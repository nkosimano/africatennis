-- Add rating_status column to profiles table
ALTER TABLE profiles
ADD COLUMN rating_status TEXT NOT NULL DEFAULT 'Provisional' CHECK (rating_status IN ('Provisional', 'Established'));

-- Update existing profiles based on completed matches
UPDATE profiles p
SET rating_status = 'Established'
WHERE (
    SELECT COUNT(*)
    FROM event_participants ep
    JOIN events e ON ep.event_id = e.id
    WHERE ep.profile_id = p.id
    AND e.status = 'completed'
) >= 5;

-- Add RLS policy for rating_status
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rating status"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Only service role can update rating status"
ON profiles FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role'); 