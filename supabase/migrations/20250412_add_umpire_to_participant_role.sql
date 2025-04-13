-- Add 'umpire' to the participant_role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'participant_role' 
        AND pg_enum.enumlabel = 'umpire'
    ) THEN
        ALTER TYPE participant_role ADD VALUE IF NOT EXISTS 'umpire';
    END IF;
END
$$;
