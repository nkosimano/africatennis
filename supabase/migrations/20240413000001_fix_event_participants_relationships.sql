-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS event_participants
DROP CONSTRAINT IF EXISTS event_participants_profile_id_fkey;

-- Add proper foreign key constraint
ALTER TABLE event_participants
ADD CONSTRAINT event_participants_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Update RLS policies
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view event participants
CREATE POLICY "Allow authenticated users to view event participants"
ON event_participants
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow users to insert their own event participants
CREATE POLICY "Allow users to insert their own event participants"
ON event_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Create policy to allow users to update their own event participants
CREATE POLICY "Allow users to update their own event participants"
ON event_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Create policy to allow users to delete their own event participants
CREATE POLICY "Allow users to delete their own event participants"
ON event_participants
FOR DELETE
TO authenticated
USING (auth.uid() = profile_id); 