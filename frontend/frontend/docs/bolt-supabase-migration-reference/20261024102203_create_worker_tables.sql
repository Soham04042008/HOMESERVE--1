/*
# Worker Space tables

5 tables owned by each authenticated worker (auth.uid()).
All have RLS: owner-only for writes, public read for non-private fields only.

1. worker_profiles — one row per worker (linked to auth.users)
2. worker_services — multiple service entries per worker
3. worker_qualifications — education/training/certificates
4. worker_availability — working schedule per worker (one row)
5. worker_portfolio — work samples with images
*/

CREATE TABLE IF NOT EXISTS worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  headline text,
  bio text,
  avatar text,
  date_of_birth date,
  gender text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  experience_years integer NOT NULL DEFAULT 0,
  preferred_areas text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  verification_status text NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending','Verified','Rejected')),
  availability_status text NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available','Busy','Unavailable')),
  min_price integer NOT NULL DEFAULT 0,
  max_price integer NOT NULL DEFAULT 0,
  starting_price integer NOT NULL DEFAULT 0,
  pricing_type text NOT NULL DEFAULT 'Fixed Price' CHECK (pricing_type IN ('Fixed Price','Hourly','Per Visit','Custom Quote')),
  visit_charge integer NOT NULL DEFAULT 0,
  negotiable boolean NOT NULL DEFAULT false,
  additional_charges jsonb DEFAULT '[]',
  emergency_service boolean NOT NULL DEFAULT false,
  max_travel_distance integer NOT NULL DEFAULT 10,
  total_earnings integer NOT NULL DEFAULT 0,
  monthly_earnings integer NOT NULL DEFAULT 0,
  total_bookings integer NOT NULL DEFAULT 0,
  completed_jobs integer NOT NULL DEFAULT 0,
  pending_requests integer NOT NULL DEFAULT 0,
  average_rating numeric(2,1) NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_worker_profiles" ON worker_profiles;
CREATE POLICY "read_worker_profiles"
  ON worker_profiles FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_worker_profile" ON worker_profiles;
CREATE POLICY "insert_own_worker_profile"
  ON worker_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_worker_profile" ON worker_profiles;
CREATE POLICY "update_own_worker_profile"
  ON worker_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_worker_profile" ON worker_profiles;
CREATE POLICY "delete_own_worker_profile"
  ON worker_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS worker_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  skills text[] DEFAULT '{}',
  description text,
  experience_years integer NOT NULL DEFAULT 0,
  qualification text,
  tools text,
  service_areas text[] DEFAULT '{}',
  emergency_available boolean NOT NULL DEFAULT false,
  min_price integer NOT NULL DEFAULT 0,
  max_price integer NOT NULL DEFAULT 0,
  pricing_type text NOT NULL DEFAULT 'Fixed Price' CHECK (pricing_type IN ('Fixed Price','Hourly','Per Visit','Custom Quote')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worker_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_worker_services" ON worker_services;
CREATE POLICY "read_worker_services"
  ON worker_services FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_worker_services" ON worker_services;
CREATE POLICY "insert_own_worker_services"
  ON worker_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_services.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_worker_services" ON worker_services;
CREATE POLICY "update_own_worker_services"
  ON worker_services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_services.worker_id AND wp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_services.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_worker_services" ON worker_services;
CREATE POLICY "delete_own_worker_services"
  ON worker_services FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_services.worker_id AND wp.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS worker_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Education','Course','Certificate','Licence','Experience')),
  title text NOT NULL,
  institution text,
  year integer,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worker_qualifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_worker_qualifications" ON worker_qualifications;
CREATE POLICY "read_worker_qualifications"
  ON worker_qualifications FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_worker_qualifications" ON worker_qualifications;
CREATE POLICY "insert_own_worker_qualifications"
  ON worker_qualifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_qualifications.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_worker_qualifications" ON worker_qualifications;
CREATE POLICY "update_own_worker_qualifications"
  ON worker_qualifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_qualifications.worker_id AND wp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_qualifications.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_worker_qualifications" ON worker_qualifications;
CREATE POLICY "delete_own_worker_qualifications"
  ON worker_qualifications FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_qualifications.worker_id AND wp.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS worker_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL UNIQUE REFERENCES worker_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Busy','Unavailable')),
  working_days jsonb NOT NULL DEFAULT '{}',
  break_start text,
  break_end text,
  service_area text,
  max_travel_distance integer NOT NULL DEFAULT 10,
  emergency_service boolean NOT NULL DEFAULT false,
  leave_dates date[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_worker_availability" ON worker_availability;
CREATE POLICY "read_worker_availability"
  ON worker_availability FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_worker_availability" ON worker_availability;
CREATE POLICY "insert_own_worker_availability"
  ON worker_availability FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_availability.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_worker_availability" ON worker_availability;
CREATE POLICY "update_own_worker_availability"
  ON worker_availability FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_availability.worker_id AND wp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_availability.worker_id AND wp.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS worker_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  category text,
  completed_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worker_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_worker_portfolio" ON worker_portfolio;
CREATE POLICY "read_worker_portfolio"
  ON worker_portfolio FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_worker_portfolio" ON worker_portfolio;
CREATE POLICY "insert_own_worker_portfolio"
  ON worker_portfolio FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_portfolio.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_worker_portfolio" ON worker_portfolio;
CREATE POLICY "update_own_worker_portfolio"
  ON worker_portfolio FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_portfolio.worker_id AND wp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_portfolio.worker_id AND wp.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_worker_portfolio" ON worker_portfolio;
CREATE POLICY "delete_own_worker_portfolio"
  ON worker_portfolio FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_portfolio.worker_id AND wp.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_worker_id ON worker_services(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_qualifications_worker_id ON worker_qualifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_availability_worker_id ON worker_availability(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_portfolio_worker_id ON worker_portfolio(worker_id);
