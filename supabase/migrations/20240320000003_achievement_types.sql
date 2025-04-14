-- Create achievement_types enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_type') THEN
        CREATE TYPE achievement_type AS ENUM (
            'first_win',
            'rating_milestone',
            'win_streak',
            'tournament_win',
            'perfect_set',
            'comeback_victory',
            'season_champion'
        );
    END IF;
END$$;

-- Add achievement_type column to player_achievements if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'player_achievements' 
        AND column_name = 'achievement_type'
    ) THEN
        ALTER TABLE player_achievements 
        ADD COLUMN achievement_type achievement_type NOT NULL,
        ADD COLUMN data jsonb;
    END IF;
END $$;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    win_streak integer;
    games_won integer;
    games_lost integer;
BEGIN
    -- Check for win streak
    SELECT COUNT(*) INTO win_streak
    FROM match_statistics
    WHERE player_id = NEW.player_id
    AND games_won > games_lost
    AND created_at >= (NOW() - INTERVAL '30 days')
    ORDER BY created_at DESC
    LIMIT 5;

    IF win_streak = 5 THEN
        INSERT INTO player_achievements (
            player_id,
            achievement_type,
            description,
            data
        ) VALUES (
            NEW.player_id,
            'win_streak',
            'Won 5 matches in a row!',
            jsonb_build_object('streak', win_streak)
        );
    END IF;

    -- Check for perfect set
    SELECT 
        SUM(CASE WHEN score_team_a > score_team_b THEN score_team_a ELSE score_team_b END),
        SUM(CASE WHEN score_team_a > score_team_b THEN score_team_b ELSE score_team_a END)
    INTO games_won, games_lost
    FROM match_scores
    WHERE event_id = NEW.event_id;

    IF games_lost = 0 THEN
        INSERT INTO player_achievements (
            player_id,
            achievement_type,
            description,
            data
        ) VALUES (
            NEW.player_id,
            'perfect_set',
            'Won a set without losing a game!',
            jsonb_build_object('games_won', games_won)
        );
    END IF;

    -- Check for comeback victory
    IF games_won > games_lost AND 
       EXISTS (
           SELECT 1 FROM match_scores 
           WHERE event_id = NEW.event_id 
           AND score_team_b > score_team_a 
           LIMIT 1
       ) THEN
        INSERT INTO player_achievements (
            player_id,
            achievement_type,
            description,
            data
        ) VALUES (
            NEW.player_id,
            'comeback_victory',
            'Won after losing a set!',
            jsonb_build_object('final_score', format('%s-%s', games_won, games_lost))
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for achievement checking
DROP TRIGGER IF EXISTS check_achievements ON match_statistics;
CREATE TRIGGER check_achievements
    AFTER INSERT ON match_statistics
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_achievements(); 