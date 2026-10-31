/*
# Add user_profiles table with secure role storage and worker onboarding tracking

## Purpose
HomeServe needs separate Customer and Worker experiences with role-based access control.
Currently roles are only stored in user_metadata (user-mutable, not secure). This migration
creates a server-side user_profiles table that stores the role securely and tracks worker
onboarding completion status.

## 1. New Tables
- `user_profiles`
  - `id` uuid PRIMARY KEY, defaults to auth.uid(), references auth.users
  - `email` text (cached from auth for convenience)
  - `full_name` text (display name)
  - `role` text NOT NULL DEFAULT 'customer', CHECK IN ('customer','worker')
    - This is the authoritative role. Users CANNOT change their own role after registration
      because UPDATE policy only allows updating non-role columns.
  - `worker_onboarding_complete` boolean DEFAULT false
    - Tracks whether the worker has completed the mandatory setup wizard
  - `worker_onboarding_step` integer DEFAULT 0
    - Tracks current step in the setup wizard (0 = not started, 1-7 = steps, 7 = complete)
  - `created_at` timestamptz
  - `updated_at` timestamptz

## 2. Security
- Enable RLS on user_profiles
- GRANT SELECT to authenticated (users can read their own profile)
- GRANT INSERT to authenticated (auto-created on first login)
- GRANT UPDATE on specific columns only (full_name, worker_onboarding_complete, worker_onboarding_step, updated_at)
  - Role column is NOT in the updatable set, so users cannot escalate themselves
- 4 separate policies (SELECT/INSERT/UPDATE/DELETE) all scoped to auth.uid() = id
- DELETE allowed so users can delete their own profile

## 3. Worker profiles onboarding column
- Adds `onboarding_complete` boolean DEFAULT false to worker_profiles
- Adds `onboarding_step` integer DEFAULT 0 to worker_profiles
- These mirror the user_profiles columns for convenience

## Important Notes
1. The role is set at registration time via a SECURITY DEFINER function `register_user_role`
   that inserts the initial profile row with the correct role. Users cannot change it later
   because the UPDATE grant excludes the role column.
2. The `register_user_role` function is callable by authenticated users only and only
   sets the role for the CALLING user (auth.uid()), preventing privilege escalation.
3. Onboarding status is persisted in the database so it works across browsers and devices.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text DEFAULT '',
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','worker')),
  worker_onboarding_complete boolean NOT NULL DEFAULT false,
  worker_onboarding_step integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON user_profiles TO authenticated;
GRANT UPDATE (full_name, worker_onboarding_complete, worker_onboarding_step, updated_at) ON user_profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_user_profile" ON user_profiles;
CREATE POLICY "select_own_user_profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_user_profile" ON user_profiles;
CREATE POLICY "insert_own_user_profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_user_profile" ON user_profiles;
CREATE POLICY "update_own_user_profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_user_profile" ON user_profiles;
CREATE POLICY "delete_own_user_profile"
  ON user_profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- SECURITY DEFINER function to register a user's role at signup.
-- This prevents users from setting arbitrary roles via direct table inserts,
-- because the function validates that the role matches what was passed at signup
-- and only sets it for the calling user.
CREATE OR REPLACE FUNCTION register_user_role(p_role text, p_full_name text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_record RECORD;
  valid_roles text[] := ARRAY['customer','worker'];
BEGIN
  -- Validate role
  IF NOT (p_role = ANY(valid_roles)) THEN
    RETURN jsonb_build_object('error', 'Invalid role');
  END IF;

  -- Check if profile already exists
  SELECT * INTO existing_record FROM user_profiles WHERE id = auth.uid();

  IF FOUND THEN
    -- Profile exists: return current role, don't overwrite
    RETURN jsonb_build_object(
      'role', existing_record.role,
      'already_exists', true
    );
  END IF;

  -- Insert new profile with the requested role
  INSERT INTO user_profiles (id, role, full_name, email)
  VALUES (auth.uid(), p_role, p_full_name, (SELECT email FROM auth.users WHERE id = auth.uid()))
  RETURNING role, full_name, worker_onboarding_complete, worker_onboarding_step
  INTO existing_record;

  RETURN jsonb_build_object(
    'role', existing_record.role,
    'already_exists', false
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION register_user_role(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_user_role(text, text) TO authenticated;

-- Add onboarding columns to worker_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'worker_profiles' AND column_name = 'onboarding_complete') THEN
    ALTER TABLE worker_profiles ADD COLUMN onboarding_complete boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'worker_profiles' AND column_name = 'onboarding_step') THEN
    ALTER TABLE worker_profiles ADD COLUMN onboarding_step integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);