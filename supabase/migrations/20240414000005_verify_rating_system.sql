-- Verification script for rating system implementation
DO $$
DECLARE
    column_exists BOOLEAN;
    function_exists BOOLEAN;
    test_player_id UUID;
    test_rating NUMERIC;
    test_status TEXT;
BEGIN
    -- Check for required columns
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'rating_status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Missing column: rating_status in profiles table';
    END IF;

    -- Check for required functions
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'calculate_initial_rating'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION 'Missing function: calculate_initial_rating';
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'calculate_match_rating'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION 'Missing function: calculate_match_rating';
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'update_match_ratings'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE EXCEPTION 'Missing function: update_match_ratings';
    END IF;

    -- Test initial rating calculation
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
        SELECT calculate_initial_rating(test_player_id) INTO test_rating;
        
        -- Check if rating was updated
        SELECT current_ranking_points_singles, rating_status 
        INTO test_rating, test_status
        FROM profiles
        WHERE id = test_player_id;

        IF test_rating IS NULL THEN
            RAISE WARNING 'Rating not updated for test player';
        END IF;

        IF test_status IS NULL THEN
            RAISE WARNING 'Rating status not updated for test player';
        END IF;
    END IF;

    -- Check for ranking history records
    IF NOT EXISTS (
        SELECT 1 
        FROM ranking_history 
        WHERE ranking_type = 'singles'
    ) THEN
        RAISE WARNING 'No ranking history records found';
    END IF;

    -- Verify table structure
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'ranking_history'
    ) THEN
        RAISE EXCEPTION 'Missing table: ranking_history';
    END IF;

    -- Check ranking history columns
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ranking_history' 
        AND column_name = 'profile_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Missing column: profile_id in ranking_history table';
    END IF;

    -- If we get here, all checks passed
    RAISE NOTICE 'Rating system verification completed successfully';
END;
$$; 