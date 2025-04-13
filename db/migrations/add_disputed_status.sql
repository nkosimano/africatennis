-- Migration to add 'disputed' to the event_status enum type

-- First, check if the enum type exists and if 'disputed' is already a value
DO $$
DECLARE
    enum_exists boolean;
    disputed_exists boolean;
BEGIN
    -- Check if the enum type exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'event_status'
    ) INTO enum_exists;
    
    IF enum_exists THEN
        -- Check if 'disputed' is already a value in the enum
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_status')
            AND enumlabel = 'disputed'
        ) INTO disputed_exists;
        
        IF NOT disputed_exists THEN
            -- Add 'disputed' to the enum
            EXECUTE 'ALTER TYPE event_status ADD VALUE ''disputed''';
            RAISE NOTICE 'Added ''disputed'' to the event_status enum type';
        ELSE
            RAISE NOTICE '''disputed'' is already a value in the event_status enum type';
        END IF;
    ELSE
        RAISE NOTICE 'The event_status enum type does not exist';
    END IF;
END $$;
