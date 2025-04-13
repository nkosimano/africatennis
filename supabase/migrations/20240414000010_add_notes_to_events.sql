-- Add notes column to events table
ALTER TABLE events
ADD COLUMN notes TEXT;

-- Add RLS policy for notes
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event notes"
ON events FOR SELECT
USING (true);

CREATE POLICY "Users can update their own event notes"
ON events FOR UPDATE
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id); 