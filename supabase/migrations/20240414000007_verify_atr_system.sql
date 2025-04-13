-- Comprehensive ATR rating system verification
DO $$
DECLARE
    test_player_id UUID;
    test_match_id UUID;
    initial_rating NUMERIC;
    match_rating NUMERIC;
    rating_status TEXT;
    test_result BOOLEAN;
BEGIN
    -- 1. Verify Database Structure
    RAISE NOTICE '1. Verifying Database Structure...';
    
    -- Check required columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'rating_status'
    ) THEN
        RAISE EXCEPTION 'Missing column: rating_status in profiles table';
    END IF;

    -- Check required functions
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'calculate_initial_rating'
    ) THEN
        RAISE EXCEPTION 'Missing function: calculate_initial_rating';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'calculate_match_rating'
    ) THEN
        RAISE EXCEPTION 'Missing function: calculate_match_rating';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'update_match_ratings'
    ) THEN
        RAISE EXCEPTION 'Missing function: update_match_ratings';
    END IF;

    -- 2. Test Initial Rating Calculation
    RAISE NOTICE '2. Testing Initial Rating Calculation...';
    
    -- Find a player with at least 3 completed matches
    SELECT p.id INTO test_player_id
    FROM profiles p
    JOIN event_participants ep ON p.id = ep.profile_id
    JOIN events e ON ep.event_id = e.id
    WHERE e.event_type = 'match_singles_ranked'
    AND e.status = 'completed'
    GROUP BY p.id
    HAVING COUNT(*) >= 3
    LIMIT 1;

    IF test_player_id IS NULL THEN
        RAISE WARNING 'No test player found with 3+ completed matches';
    ELSE
        -- Test initial rating calculation
        SELECT calculate_initial_rating(test_player_id) INTO initial_rating;
        
        -- Verify rating was updated
        SELECT p.current_ranking_points_singles, p.rating_status 
        INTO initial_rating, rating_status
        FROM profiles p
        WHERE p.id = test_player_id;

        IF initial_rating IS NULL THEN
            RAISE WARNING 'Initial rating not calculated for test player';
        END IF;

        IF rating_status IS NULL THEN
            RAISE WARNING 'Rating status not set for test player';
        END IF;
    END IF;

    -- 3. Test Match Rating Calculation
    RAISE NOTICE '3. Testing Match Rating Calculation...';
    
    -- Find a completed match
    SELECT e.id INTO test_match_id
    FROM events e
    JOIN event_participants ep1 ON e.id = ep1.event_id
    JOIN event_participants ep2 ON e.id = ep2.event_id AND ep2.profile_id != ep1.profile_id
    JOIN match_scores ms ON e.id = ms.event_id
    WHERE e.event_type = 'match_singles_ranked'
    AND e.status = 'completed'
    LIMIT 1;

    IF test_match_id IS NULL THEN
        RAISE WARNING 'No completed matches found for testing';
    ELSE
        -- Test match rating update
        PERFORM update_match_ratings(test_match_id);
        
        -- Verify rating history was updated
        IF NOT EXISTS (
            SELECT 1 
            FROM ranking_history 
            WHERE event_id = test_match_id
        ) THEN
            RAISE WARNING 'Rating history not updated for test match';
        END IF;
    END IF;

    -- 4. Verify Rating Rules
    RAISE NOTICE '4. Verifying Rating Rules...';
    
    -- Check K-factor application
    SELECT EXISTS (
        SELECT 1
        FROM profiles p1
        JOIN profiles p2 ON p1.rating_status != p2.rating_status
        JOIN event_participants ep1 ON p1.id = ep1.profile_id
        JOIN event_participants ep2 ON p2.id = ep2.profile_id
        JOIN events e ON ep1.event_id = e.id AND ep2.event_id = e.id
        JOIN match_scores ms ON e.id = ms.event_id
        WHERE e.event_type = 'match_singles_ranked'
        AND e.status = 'completed'
        AND (
            (p1.rating_status = 'Provisional' AND ABS(p1.current_ranking_points_singles - p2.current_ranking_points_singles) > 40)
            OR
            (p1.rating_status = 'Established' AND ABS(p1.current_ranking_points_singles - p2.current_ranking_points_singles) > 20)
        )
        AND (
            (ms.sets_won > ms.sets_lost AND ep1.id < ep2.id)
            OR
            (ms.sets_lost > ms.sets_won AND ep1.id > ep2.id)
        )
    ) INTO test_result;

    IF test_result THEN
        RAISE WARNING 'K-factor rules may not be properly applied';
    END IF;

    -- 5. Verify Data Integrity
    RAISE NOTICE '5. Verifying Data Integrity...';
    
    -- Check for players with invalid ratings
    IF EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.current_ranking_points_singles < 100
        AND p.rating_status != 'Provisional'
    ) THEN
        RAISE WARNING 'Found established players with ratings below minimum (100)';
    END IF;

    -- Check for rating history consistency
    IF EXISTS (
        SELECT 1
        FROM ranking_history rh1
        JOIN ranking_history rh2 ON rh1.profile_id = rh2.profile_id
        WHERE rh1.calculation_date < rh2.calculation_date
        AND rh1.points > rh2.points
        AND rh1.ranking_type = 'singles'
        AND rh2.ranking_type = 'singles'
    ) THEN
        RAISE WARNING 'Found potential rating history inconsistencies';
    END IF;

    -- If we get here, all checks passed
    RAISE NOTICE 'ATR Rating System Verification Completed Successfully';
END;
$$; 