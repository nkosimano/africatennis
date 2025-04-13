-- Add search_radius_km column to profiles table
ALTER TABLE profiles
ADD COLUMN search_radius_km INTEGER NOT NULL DEFAULT 25;

-- Add RLS policy for search_radius_km
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view search radius"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own search radius"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 