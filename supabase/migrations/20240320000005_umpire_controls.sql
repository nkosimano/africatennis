-- Add umpire-specific fields to event_participants
ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- Create enum for match control status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE match_control_status AS ENUM ('pending', 'in_progress', 'completed', 'disputed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add umpire control fields to events
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS umpire_controlled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS match_control_status match_control_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS score_verification jsonb DEFAULT NULL;

-- Enable RLS on required tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is event umpire
CREATE OR REPLACE FUNCTION is_event_umpire(event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM event_participants 
    WHERE event_id = $1 
    AND profile_id = auth.uid()
    AND role = 'umpire'
  );
$$;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Only umpires can start ranked matches" ON events;
    DROP POLICY IF EXISTS "Only umpires can submit scores for ranked matches" ON match_scores;
    DROP POLICY IF EXISTS "Event participants can insert match scores" ON match_scores;
    DROP POLICY IF EXISTS "Event participants can update match scores" ON match_scores;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create policy to ensure only umpires can start ranked matches
DO $$ BEGIN
    CREATE POLICY "Only umpires can start ranked matches"
    ON events
    FOR UPDATE TO authenticated
    USING (
      CASE 
        WHEN event_type::text = ANY(ARRAY['tournament_match_singles', 'tournament_match_doubles']::text[])
        AND umpire_controlled = true THEN
          is_event_umpire(id)
        ELSE 
          organizer_id = auth.uid() OR 
          EXISTS (
            SELECT 1 
            FROM event_participants 
            WHERE event_participants.event_id = events.id 
            AND event_participants.profile_id = auth.uid()
          )
      END
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policy to ensure only umpires can submit scores for ranked matches
DO $$ BEGIN
    CREATE POLICY "Only umpires can submit scores for ranked matches"
    ON match_scores
    FOR INSERT TO authenticated
    WITH CHECK (
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = match_scores.event_id 
          AND e.event_type::text = ANY(ARRAY['tournament_match_singles', 'tournament_match_doubles']::text[])
          AND e.umpire_controlled = true
        ) THEN
          is_event_umpire(event_id)
        ELSE 
          auth.uid() IN (
            SELECT ep.profile_id
            FROM event_participants ep
            WHERE ep.event_id = match_scores.event_id
          ) OR 
          auth.uid() IN (
            SELECT e.organizer_id
            FROM events e
            WHERE e.id = match_scores.event_id
          )
      END
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policy for match score updates
DO $$ BEGIN
    CREATE POLICY "Event participants can update match scores"
    ON match_scores
    FOR UPDATE TO authenticated
    USING (
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = match_scores.event_id 
          AND e.event_type::text = ANY(ARRAY['tournament_match_singles', 'tournament_match_doubles']::text[])
          AND e.umpire_controlled = true
        ) THEN
          is_event_umpire(event_id)
        ELSE 
          auth.uid() IN (
            SELECT ep.profile_id
            FROM event_participants ep
            WHERE ep.event_id = match_scores.event_id
          ) OR 
          auth.uid() IN (
            SELECT e.organizer_id
            FROM events e
            WHERE e.id = match_scores.event_id
          )
      END
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create function to start match
CREATE OR REPLACE FUNCTION start_match(match_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_event events;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = match_id;
  IF v_event IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Check permissions using RLS policies
  IF NOT (
    CASE 
      WHEN v_event.event_type::text = ANY(ARRAY['tournament_match_singles', 'tournament_match_doubles']::text[])
      AND v_event.umpire_controlled = true THEN
        is_event_umpire(match_id)
      ELSE 
        v_event.organizer_id = auth.uid() OR 
        EXISTS (
          SELECT 1 
          FROM event_participants 
          WHERE event_participants.event_id = v_event.id 
          AND event_participants.profile_id = auth.uid()
        )
    END
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to start this match');
  END IF;

  -- Update match status
  UPDATE events
  SET 
    status = 'in_progress',
    match_control_status = 'in_progress',
    updated_at = NOW()
  WHERE id = match_id
  AND status = 'pending';

  IF FOUND THEN
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Match could not be started');
  END IF;
END;
$$;

-- Create function to submit match score
CREATE OR REPLACE FUNCTION submit_match_score(
  match_id uuid,
  score_data jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_event events;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = match_id;
  IF v_event IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Match not found');
  END IF;

  -- Check permissions using RLS policies
  IF NOT (
    CASE 
      WHEN v_event.event_type::text = ANY(ARRAY['tournament_match_singles', 'tournament_match_doubles']::text[])
      AND v_event.umpire_controlled = true THEN
        is_event_umpire(match_id)
      ELSE 
        v_event.organizer_id = auth.uid() OR 
        EXISTS (
          SELECT 1 
          FROM event_participants 
          WHERE event_participants.event_id = v_event.id 
          AND event_participants.profile_id = auth.uid()
        )
    END
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to submit scores for this match');
  END IF;

  -- Insert score
  INSERT INTO match_scores (
    event_id,
    score_data,
    verified_by_umpire,
    submitted_by
  ) VALUES (
    match_id,
    score_data,
    v_event.umpire_controlled,
    auth.uid()
  );

  -- Update match status
  UPDATE events
  SET 
    status = 'completed',
    match_control_status = 'completed',
    score_verification = jsonb_build_object(
      'verified_by', CASE WHEN v_event.umpire_controlled THEN auth.uid() ELSE NULL END,
      'verified_at', CASE WHEN v_event.umpire_controlled THEN NOW() ELSE NULL END,
      'score_data', score_data
    ),
    updated_at = NOW()
  WHERE id = match_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to handle match disputes
CREATE OR REPLACE FUNCTION raise_match_dispute(
  match_id uuid,
  dispute_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM event_participants
    WHERE event_id = match_id
    AND profile_id = auth.uid()
    AND role = 'player'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Only match participants can raise disputes');
  END IF;

  -- Update match status
  UPDATE events
  SET 
    match_control_status = 'disputed',
    score_verification = COALESCE(score_verification, '{}'::jsonb) || jsonb_build_object(
      'dispute', jsonb_build_object(
        'raised_by', auth.uid(),
        'raised_at', NOW(),
        'reason', dispute_reason
      )
    )
  WHERE id = match_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$; 