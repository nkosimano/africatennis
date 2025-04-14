-- Create a function to handle match completion notifications
CREATE OR REPLACE FUNCTION public.handle_match_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status is changing to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert notifications for all participants
    INSERT INTO notifications (profile_id, type, title, content, data)
    SELECT 
      ep.profile_id,
      'match_completed',
      'Match Completed',
      'A match you participated in has been completed',
      jsonb_build_object(
        'event_id', NEW.id,
        'event_type', NEW.event_type,
        'completed_at', NEW.completed_at
      )
    FROM event_participants ep
    WHERE ep.event_id = NEW.id;

    -- For ranked matches, trigger rating recalculation
    IF NEW.event_type IN ('match_singles_ranked', 'match_doubles_ranked') THEN
      -- This will be handled by the Edge Function
      -- We just need to ensure the event is marked as needing rating update
      UPDATE events
      SET needs_rating_update = true
      WHERE id = NEW.id;
    END IF;

    -- Update player statistics
    WITH match_stats AS (
      SELECT 
        ms.event_id,
        SUM(CASE WHEN ms.score_team_a > ms.score_team_b THEN 1 ELSE 0 END) as team_a_sets,
        SUM(CASE WHEN ms.score_team_b > ms.score_team_a THEN 1 ELSE 0 END) as team_b_sets,
        SUM(ms.score_team_a) as team_a_games,
        SUM(ms.score_team_b) as team_b_games
      FROM match_scores ms
      WHERE ms.event_id = NEW.id
      GROUP BY ms.event_id
    )
    INSERT INTO match_statistics (
      player_id,
      event_id,
      sets_won,
      sets_lost,
      games_won,
      games_lost,
      match_type
    )
    SELECT 
      ep.profile_id,
      NEW.id,
      CASE 
        WHEN ep.role IN ('player_team_a', 'player_team_a1', 'player_team_a2') THEN ms.team_a_sets
        ELSE ms.team_b_sets
      END as sets_won,
      CASE 
        WHEN ep.role IN ('player_team_a', 'player_team_a1', 'player_team_a2') THEN ms.team_b_sets
        ELSE ms.team_a_sets
      END as sets_lost,
      CASE 
        WHEN ep.role IN ('player_team_a', 'player_team_a1', 'player_team_a2') THEN ms.team_a_games
        ELSE ms.team_b_games
      END as games_won,
      CASE 
        WHEN ep.role IN ('player_team_a', 'player_team_a1', 'player_team_a2') THEN ms.team_b_games
        ELSE ms.team_a_games
      END as games_lost,
      NEW.event_type
    FROM event_participants ep
    CROSS JOIN match_stats ms
    WHERE ep.event_id = NEW.id
    AND ep.role NOT IN ('umpire', 'spectator');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_match_completion ON events;
CREATE TRIGGER on_match_completion
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_match_completion();

-- Add needs_rating_update column to events table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'needs_rating_update'
  ) THEN
    ALTER TABLE events ADD COLUMN needs_rating_update boolean DEFAULT false;
  END IF;
END $$; 