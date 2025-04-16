-- Migration script to ensure event_participants table is properly set up
-- This migration ensures the database schema matches the updated code structure

DO $$
BEGIN
    -- Check if the event_participants table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_participants'
    ) THEN
        -- Make sure the profile_id column has the correct foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'event_participants_profile_id_fkey' 
            AND table_name = 'event_participants'
        ) THEN
            -- The constraint exists, but let's make sure it's pointing to the right table
            -- First drop the existing constraint
            ALTER TABLE public.event_participants DROP CONSTRAINT event_participants_profile_id_fkey;
            
            -- Then add it back pointing to profiles
            ALTER TABLE public.event_participants 
                ADD CONSTRAINT event_participants_profile_id_fkey 
                FOREIGN KEY (profile_id) 
                REFERENCES public.profiles(id);
                
            RAISE NOTICE 'Updated event_participants_profile_id_fkey constraint';
        ELSE
            -- The constraint doesn't exist, add it
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'event_participants' 
                AND column_name = 'profile_id'
            ) THEN
                ALTER TABLE public.event_participants 
                    ADD CONSTRAINT event_participants_profile_id_fkey 
                    FOREIGN KEY (profile_id) 
                    REFERENCES public.profiles(id);
                    
                RAISE NOTICE 'Added event_participants_profile_id_fkey constraint';
            ELSE
                RAISE NOTICE 'Column profile_id does not exist in event_participants table';
            END IF;
        END IF;
        
        -- Make sure the event_id column has the correct foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'event_participants_event_id_fkey' 
            AND table_name = 'event_participants'
        ) THEN
            -- The constraint exists, but let's make sure it's pointing to the right table
            -- First drop the existing constraint
            ALTER TABLE public.event_participants DROP CONSTRAINT event_participants_event_id_fkey;
            
            -- Then add it back pointing to events
            ALTER TABLE public.event_participants 
                ADD CONSTRAINT event_participants_event_id_fkey 
                FOREIGN KEY (event_id) 
                REFERENCES public.events(id);
                
            RAISE NOTICE 'Updated event_participants_event_id_fkey constraint';
        ELSE
            -- The constraint doesn't exist, add it
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'event_participants' 
                AND column_name = 'event_id'
            ) THEN
                ALTER TABLE public.event_participants 
                    ADD CONSTRAINT event_participants_event_id_fkey 
                    FOREIGN KEY (event_id) 
                    REFERENCES public.events(id);
                    
                RAISE NOTICE 'Added event_participants_event_id_fkey constraint';
            ELSE
                RAISE NOTICE 'Column event_id does not exist in event_participants table';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'Table event_participants does not exist';
    END IF;
END
$$;
