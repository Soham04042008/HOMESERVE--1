/*
# Create professionals table and expand bookings categories

1. New Table
- `professionals`
  - id (uuid, primary key)
  - name (text, not null)
  - category (text, not null)
  - specialization (text, not null)
  - bio (text, nullable)
  - avatar (text, nullable, URL)
  - rating (numeric, default 0, 0-5)
  - reviews (integer, default 0)
  - starting_price (integer, not null, INR)
  - area (text, not null, e.g. "Panvel")
  - experience_years (integer, default 0)
  - availability (text, default 'Available This Week': Available Today, Available This Week, Busy)
  - verified (boolean, default false)
  - phone (text, nullable)
  - services (jsonb, nullable, list of {name, price})
  - created_at (timestamptz, default now())

2. Alter bookings
- Expand category CHECK to include 'Handyman' and 'Landscaping'

3. Security
- professionals: public read (TO anon, authenticated) so the marketplace is browsable
  before booking; writes restricted to authenticated (admin-managed in the future).
- bookings: existing RLS unchanged.

4. Notes
- verified defaults false; only true when database confirms it.
- services jsonb holds per-professional service offerings with individual prices.
*/

CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  specialization text NOT NULL,
  bio text,
  avatar text,
  rating numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews integer NOT NULL DEFAULT 0,
  starting_price integer NOT NULL,
  area text NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'Available This Week' CHECK (availability IN ('Available Today','Available This Week','Busy')),
  verified boolean NOT NULL DEFAULT false,
  phone text,
  services jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_professionals" ON professionals;
CREATE POLICY "read_professionals"
  ON professionals FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_category_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_category_check
  CHECK (category IN ('Electrician','Plumbing','Cleaning','Carpentry','AC Repair','Painting','Handyman','Landscaping','Other'));

CREATE INDEX IF NOT EXISTS idx_professionals_category ON professionals(category);
CREATE INDEX IF NOT EXISTS idx_professionals_area ON professionals(area);
