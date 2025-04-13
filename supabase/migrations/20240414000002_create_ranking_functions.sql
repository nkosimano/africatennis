-- Create function to calculate initial ratings for a player
CREATE OR REPLACE FUNCTION public.calculate_initial_rating(player_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set initial points (1000 is a common starting point for ELO-like systems)
    UPDATE public.profiles
    SET 
        current_ranking_points_singles = 1000,
        current_ranking_points_doubles = 1000
    WHERE id = player_id;

    -- Insert initial ranking history entries
    INSERT INTO public.ranking_history (
        profile_id,
        ranking_type,
        points,
        rank,
        calculation_date
    )
    VALUES
        (player_id, 'singles', 1000, 1, NOW()),
        (player_id, 'doubles', 1000, 1, NOW());
END;
$$;

-- Create function to calculate rankings for all players
CREATE OR REPLACE FUNCTION public.calculate_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    player RECORD;
    current_date TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Loop through all profiles
    FOR player IN 
        SELECT id, current_ranking_points_singles, current_ranking_points_doubles
        FROM public.profiles
        WHERE is_guest = false
    LOOP
        -- Calculate singles ranking
        INSERT INTO public.ranking_history (
            profile_id,
            ranking_type,
            points,
            rank,
            calculation_date
        )
        VALUES (
            player.id,
            'singles',
            player.current_ranking_points_singles,
            (SELECT COUNT(*) + 1 
             FROM public.profiles p2 
             WHERE p2.current_ranking_points_singles > player.current_ranking_points_singles
             AND p2.is_guest = false),
            current_date
        );

        -- Calculate doubles ranking
        INSERT INTO public.ranking_history (
            profile_id,
            ranking_type,
            points,
            rank,
            calculation_date
        )
        VALUES (
            player.id,
            'doubles',
            player.current_ranking_points_doubles,
            (SELECT COUNT(*) + 1 
             FROM public.profiles p2 
             WHERE p2.current_ranking_points_doubles > player.current_ranking_points_doubles
             AND p2.is_guest = false),
            current_date
        );
    END LOOP;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_initial_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_rankings() TO authenticated; 