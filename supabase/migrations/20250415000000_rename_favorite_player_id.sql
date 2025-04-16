-- Rename favorite_player_id to profile_id in the favorite_players table
-- This migration ensures the database schema matches the updated code

-- Check if the table exists before making changes
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'favorite_players'
    ) THEN
        -- Drop the existing foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'favorite_players_favorite_player_id_fkey' 
            AND table_name = 'favorite_players'
        ) THEN
            ALTER TABLE public.favorite_players DROP CONSTRAINT favorite_players_favorite_player_id_fkey;
        END IF;

        -- Check if the column exists before renaming
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'favorite_players' 
            AND column_name = 'favorite_player_id'
        ) THEN
            -- Rename the column
            ALTER TABLE public.favorite_players RENAME COLUMN favorite_player_id TO profile_id;
            
            -- Add the new foreign key constraint
            ALTER TABLE public.favorite_players 
                ADD CONSTRAINT favorite_players_profile_id_fkey 
                FOREIGN KEY (profile_id) 
                REFERENCES public.profiles(id);
                
            -- Update any existing indexes
            DROP INDEX IF EXISTS idx_favorite_players_favorite_player_id;
            CREATE INDEX IF NOT EXISTS idx_favorite_players_profile_id ON public.favorite_players(profile_id);
            
            -- Log the migration
            RAISE NOTICE 'Successfully renamed favorite_player_id to profile_id in favorite_players table';
        ELSE
            RAISE NOTICE 'Column favorite_player_id does not exist in favorite_players table';
        END IF;
    ELSE
        RAISE NOTICE 'Table favorite_players does not exist';
    END IF;
END
$$;
