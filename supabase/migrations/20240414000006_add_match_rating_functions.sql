-- Create function to calculate ratings for established players
CREATE OR REPLACE FUNCTION public.calculate_match_rating(
    p_event_id UUID,
    p_winner_id UUID,
    p_loser_id UUID,
    p_games_won INTEGER,
    p_games_lost INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    winner_rating NUMERIC;
    loser_rating NUMERIC;
    rating_diff NUMERIC;
    expected_percentage NUMERIC;
    actual_percentage NUMERIC;
    k_factor INTEGER;
    points_change NUMERIC;
    total_games INTEGER;
BEGIN
    -- Get current ratings
    SELECT current_ranking_points_singles INTO winner_rating
    FROM profiles WHERE id = p_winner_id;
    
    SELECT current_ranking_points_singles INTO loser_rating
    FROM profiles WHERE id = p_loser_id;

    -- Calculate rating difference
    rating_diff := winner_rating - loser_rating;
    
    -- Calculate expected percentage using logistic function
    expected_percentage := 1.0 / (1.0 + pow(10.0, -rating_diff / 400.0));
    
    -- Calculate actual percentage of games won
    total_games := p_games_won + p_games_lost;
    actual_percentage := p_games_won::NUMERIC / total_games;
    
    -- Determine K-factor based on rating status
    SELECT 
        CASE 
            WHEN rating_status = 'Provisional' THEN 40
            WHEN rating_status = 'Established' THEN 20
            ELSE 30
        END INTO k_factor
    FROM profiles
    WHERE id = p_winner_id;
    
    -- Calculate points change
    points_change := k_factor * (actual_percentage - expected_percentage);
    
    -- Ensure minimum rating
    points_change := GREATEST(points_change, -50);
    points_change := LEAST(points_change, 50);
    
    RETURN points_change;
END;
$$;

-- Create function to update ratings after a match
CREATE OR REPLACE FUNCTION public.update_match_ratings(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_winner_id UUID;
    v_loser_id UUID;
    v_games_won INTEGER;
    v_games_lost INTEGER;
    v_points_change NUMERIC;
BEGIN
    -- Get match details
    SELECT 
        e.winner_profile_id,
        CASE 
            WHEN e.winner_profile_id = ep1.profile_id THEN ep2.profile_id
            ELSE ep1.profile_id
        END,
        ms.score_team_a,
        ms.score_team_b
    INTO 
        v_winner_id,
        v_loser_id,
        v_games_won,
        v_games_lost
    FROM events e
    JOIN event_participants ep1 ON e.id = ep1.event_id
    JOIN event_participants ep2 ON e.id = ep2.event_id AND ep2.profile_id != ep1.profile_id
    JOIN match_scores ms ON e.id = ms.event_id
    WHERE e.id = p_event_id
    AND e.event_type = 'match_singles_ranked'
    AND e.status = 'completed';
    
    -- Calculate points change
    v_points_change := calculate_match_rating(
        p_event_id,
        v_winner_id,
        v_loser_id,
        v_games_won,
        v_games_lost
    );
    
    -- Update winner's rating
    UPDATE profiles
    SET current_ranking_points_singles = current_ranking_points_singles + v_points_change
    WHERE id = v_winner_id;
    
    -- Update loser's rating
    UPDATE profiles
    SET current_ranking_points_singles = current_ranking_points_singles - v_points_change
    WHERE id = v_loser_id;
    
    -- Insert into ranking history
    INSERT INTO ranking_history (
        profile_id,
        ranking_type,
        points,
        rank,
        calculation_date
    )
    SELECT 
        p.id,
        'singles',
        p.current_ranking_points_singles,
        ROW_NUMBER() OVER (ORDER BY p.current_ranking_points_singles DESC),
        NOW()
    FROM profiles p
    WHERE p.id IN (v_winner_id, v_loser_id)
    AND p.is_guest = false;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_match_rating(UUID, UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_match_ratings(UUID) TO authenticated; 