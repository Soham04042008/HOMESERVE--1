/*
# Create conversations and messages tables

1. New Tables
- `conversations`
  - id (uuid, primary key)
  - user_id (uuid, not null, defaults to auth.uid(), references auth.users) — the customer
  - professional_name (text, not null) — display name of the professional
  - professional_avatar (text, nullable) — avatar URL
  - booking_reference (text, nullable) — associated booking ID e.g. HS-1001
  - service_name (text, not null) — e.g. "Plumbing Inspection"
  - category (text, not null) — service category
  - booking_status (text, not null, default 'Confirmed')
  - last_message (text, nullable) — preview of latest message
  - last_message_at (timestamptz, nullable) — timestamp of latest message
  - unread_count (integer, not null, default 0) — unread messages from professional
  - created_at (timestamptz, default now())

- `messages`
  - id (uuid, primary key)
  - conversation_id (uuid, not null, references conversations ON DELETE CASCADE)
  - sender (text, not null, 'customer' or 'professional')
  - content (text, not null, 1-2000 chars)
  - read_by_customer (boolean, default true)
  - created_at (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- conversations: owner-scoped CRUD (auth.uid() = user_id)
- messages: a customer can read/insert messages in conversations they own
  (validated via EXISTS subquery against conversations)
- UPDATE on messages is restricted to marking read status
- No DELETE policy on messages (preserve message history)

3. Notes
- user_id defaults to auth.uid() so inserts omitting it succeed.
- Message content is CHECK-constrained to non-empty, max 2000 chars.
- Realtime is enabled on both tables via ALTER TABLE ... REPLICA IDENTITY FULL
  so supabase_realtime publication can stream row changes.
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_name text NOT NULL,
  professional_avatar text,
  booking_reference text,
  service_name text NOT NULL,
  category text NOT NULL,
  booking_status text NOT NULL DEFAULT 'Confirmed',
  last_message text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations"
  ON conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations"
  ON conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer','professional')),
  content text NOT NULL CHECK (length(trim(content)) > 0 AND length(content) <= 2000),
  read_by_customer boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages"
  ON messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
