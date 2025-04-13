-- Drop the column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'rating_status'
    ) THEN
        ALTER TABLE public.profiles DROP COLUMN rating_status;
    END IF;
END $$;

-- Add rating_status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN rating_status TEXT DEFAULT 'Provisional';

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.calculate_initial_rating(UUID);

-- Create function to calculate initial ratings based on first 3 matches
CREATE OR REPLACE FUNCTION public.calculate_initial_rating(p_player_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    match_record RECORD;
    opponent_id UUID;
    opponent_rating NUMERIC;
    total_opponent_rating NUMERIC := 0;
    match_count INTEGER := 0;
    calculated_rating NUMERIC := 1000; -- Default starting point
    base_rating NUMERIC := 1000;
    placement_k_factor INTEGER := 40;
    points_change NUMERIC := 0;
    match_won BOOLEAN;
    total_games_won INTEGER := 0;
    total_games_played INTEGER := 0;
BEGIN
    -- Find the first 3 completed ranked singles matches for the player
    FOR match_record IN
        SELECT
            e.id as event_id,
            e.winner_profile_id,
            ep_player.score AS player_score,
            ep_opponent.profile_id AS opponent_profile_id,
            ep_opponent.score AS opponent_score,
            opp_profile.current_ranking_points_singles AS opponent_current_rating,
            ms.score_team_a,
            ms.score_team_b,
            ms.tiebreak_score_team_a,
            ms.tiebreak_score_team_b
        FROM
            events e
        JOIN
            event_participants ep_player ON e.id = ep_player.event_id
        JOIN
            event_participants ep_opponent ON e.id = ep_opponent.event_id
        JOIN
            profiles opp_profile ON ep_opponent.profile_id = opp_profile.id
        LEFT JOIN
            match_scores ms ON e.id = ms.event_id
        WHERE
            e.event_type = 'match_singles_ranked'
            AND e.status = 'completed'
            AND ep_player.profile_id = p_player_id
            AND ep_opponent.profile_id != p_player_id
        ORDER BY
            e.created_at
        LIMIT 3
    LOOP
        match_count := match_count + 1;

        -- Determine opponent and their rating
        opponent_id := match_record.opponent_profile_id;
        opponent_rating := COALESCE(match_record.opponent_current_rating, base_rating);

        -- Calculate games won and total games
        IF match_record.winner_profile_id = p_player_id THEN
            total_games_won := total_games_won + match_record.score_team_a;
            total_games_played := total_games_played + match_record.score_team_a + match_record.score_team_b;
        ELSE
            total_games_won := total_games_won + match_record.score_team_b;
            total_games_played := total_games_played + match_record.score_team_a + match_record.score_team_b;
        END IF;

        -- Calculate points change based on game percentage
        DECLARE
            game_percentage NUMERIC;
            expected_percentage NUMERIC;
            rating_diff NUMERIC;
        BEGIN
            rating_diff := opponent_rating - base_rating;
            expected_percentage := 1.0 / (1.0 + pow(10.0, rating_diff / 400.0));
            
            IF total_games_played > 0 THEN
                game_percentage := total_games_won::NUMERIC / total_games_played;
                points_change := points_change + (placement_k_factor * (game_percentage - expected_percentage));
            END IF;
        END;
    END LOOP;

    -- Calculate final rating
    IF match_count > 0 THEN
        calculated_rating := base_rating + points_change;
        calculated_rating := GREATEST(calculated_rating, 100);
        
        -- Update player's rating and status
        UPDATE profiles 
        SET 
            current_ranking_points_singles = calculated_rating,
            rating_status = CASE 
                WHEN match_count >= 10 THEN 'Established'
                ELSE 'Provisional'
            END
        WHERE id = p_player_id;
    END IF;

    RETURN calculated_rating;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error calculating initial rating for %: %', p_player_id, SQLERRM;
        RETURN base_rating;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_initial_rating(UUID) TO authenticated; 