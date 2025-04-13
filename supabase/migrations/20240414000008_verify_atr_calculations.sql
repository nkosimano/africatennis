-- Detailed ATR Rating System Verification
DO $$
DECLARE
    test_player_id UUID;
    test_match_id UUID;
    initial_rating NUMERIC;
    match_rating NUMERIC;
    rating_status TEXT;
    test_result BOOLEAN;
    r RECORD;
BEGIN
    -- 1. Show Players with Different Rating Statuses
    RAISE NOTICE '1. Players with Different Rating Statuses:';
    RAISE NOTICE '----------------------------------------';
    
    FOR r IN 
        SELECT 
            p.id as player_id,
            p.full_name,
            p.current_ranking_points_singles as rating,
            p.rating_status,
            COUNT(DISTINCT e.id) as completed_matches
        FROM profiles p
        LEFT JOIN event_participants ep ON p.id = ep.profile_id
        LEFT JOIN events e ON ep.event_id = e.id 
            AND e.event_type = 'match_singles_ranked' 
            AND e.status = 'completed'
        GROUP BY p.id, p.full_name, p.current_ranking_points_singles, p.rating_status
        ORDER BY p.rating_status, p.current_ranking_points_singles DESC
    LOOP
        RAISE NOTICE 'Player: %, Rating: %, Status: %, Completed Matches: %', 
            r.full_name, r.rating, r.rating_status, r.completed_matches;
    END LOOP;

    -- 2. Show Recent Rating Changes
    RAISE NOTICE E'\n2. Recent Rating Changes:';
    RAISE NOTICE '------------------------';
    
    FOR r IN 
        WITH rating_changes AS (
            SELECT 
                p.full_name,
                rh.points as new_rating,
                LAG(rh.points) OVER (PARTITION BY rh.profile_id ORDER BY rh.calculation_date) as old_rating,
                rh.points - LAG(rh.points) OVER (PARTITION BY rh.profile_id ORDER BY rh.calculation_date) as rating_change,
                rh.calculation_date
            FROM ranking_history rh
            JOIN profiles p ON rh.profile_id = p.id
            WHERE rh.ranking_type = 'singles'
            AND rh.calculation_date >= NOW() - INTERVAL '30 days'
        )
        SELECT *
        FROM rating_changes
        WHERE rating_change IS NOT NULL
        ORDER BY calculation_date DESC
        LIMIT 10
    LOOP
        RAISE NOTICE 'Player: %, Old Rating: %, New Rating: %, Change: %, Date: %', 
            r.full_name, r.old_rating, r.new_rating, r.rating_change, r.calculation_date;
    END LOOP;

    -- 3. Check K-Factor Application
    RAISE NOTICE E'\n3. K-Factor Rule Verification:';
    RAISE NOTICE '---------------------------';
    
    FOR r IN 
        SELECT 
            p1.full_name as player1,
            p2.full_name as player2,
            p1.current_ranking_points_singles as rating1,
            p2.current_ranking_points_singles as rating2,
            ABS(p1.current_ranking_points_singles - p2.current_ranking_points_singles) as rating_diff,
            p1.rating_status as status1,
            p2.rating_status as status2,
            e.id as match_id,
            ms.sets_won,
            ms.sets_lost
        FROM profiles p1
        JOIN event_participants ep1 ON p1.id = ep1.profile_id
        JOIN event_participants ep2 ON ep1.event_id = ep2.event_id AND ep2.profile_id != p1.id
        JOIN profiles p2 ON ep2.profile_id = p2.id
        JOIN events e ON ep1.event_id = e.id
        JOIN match_scores ms ON e.id = ms.event_id
        WHERE e.event_type = 'match_singles_ranked'
        AND e.status = 'completed'
        AND p1.rating_status != p2.rating_status
        ORDER BY ABS(p1.current_ranking_points_singles - p2.current_ranking_points_singles) DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Match: % vs %, Ratings: % vs %, Diff: %, Statuses: % vs %, Score: %-%', 
            r.player1, r.player2, r.rating1, r.rating2, r.rating_diff, r.status1, r.status2, r.sets_won, r.sets_lost;
    END LOOP;

    -- 4. Check Rating History Consistency
    RAISE NOTICE E'\n4. Rating History Consistency:';
    RAISE NOTICE '---------------------------';
    
    FOR r IN 
        SELECT 
            p.full_name,
            rh1.points as old_points,
            rh2.points as new_points,
            rh1.calculation_date as old_date,
            rh2.calculation_date as new_date
        FROM ranking_history rh1
        JOIN ranking_history rh2 ON rh1.profile_id = rh2.profile_id
        JOIN profiles p ON rh1.profile_id = p.id
        WHERE rh1.calculation_date < rh2.calculation_date
        AND rh1.points > rh2.points
        AND rh1.ranking_type = 'singles'
        AND rh2.ranking_type = 'singles'
        ORDER BY rh2.calculation_date DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Player: %, Rating Drop: % to %, Dates: % to %', 
            r.full_name, r.old_points, r.new_points, r.old_date, r.new_date;
    END LOOP;

    -- 5. Check Minimum Rating Compliance
    RAISE NOTICE E'\n5. Minimum Rating Compliance:';
    RAISE NOTICE '---------------------------';
    
    FOR r IN 
        SELECT 
            p.full_name,
            p.current_ranking_points_singles,
            p.rating_status,
            COUNT(DISTINCT e.id) as completed_matches
        FROM profiles p
        LEFT JOIN event_participants ep ON p.id = ep.profile_id
        LEFT JOIN events e ON ep.event_id = e.id 
            AND e.event_type = 'match_singles_ranked' 
            AND e.status = 'completed'
        WHERE p.current_ranking_points_singles < 100
        AND p.rating_status != 'Provisional'
        GROUP BY p.id, p.full_name, p.current_ranking_points_singles, p.rating_status
        ORDER BY p.current_ranking_points_singles
    LOOP
        RAISE NOTICE 'Player: %, Rating: %, Status: %, Completed Matches: %', 
            r.full_name, r.current_ranking_points_singles, r.rating_status, r.completed_matches;
    END LOOP;

    -- If we get here, all checks completed
    RAISE NOTICE E'\nVerification Completed Successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during verification: %', SQLERRM;
END;
$$; 