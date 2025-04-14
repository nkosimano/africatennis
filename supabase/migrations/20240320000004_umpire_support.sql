-- Add is_umpire column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_umpire boolean DEFAULT false;

-- Add umpire_id to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS umpire_id uuid REFERENCES auth.users(id);

-- Create umpire certification table
CREATE TABLE IF NOT EXISTS umpire_certifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id uuid REFERENCES auth.users(id) NOT NULL,
    certification_level text NOT NULL,
    certification_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expiry_date timestamp with time zone,
    issuing_authority text,
    certification_number text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, certification_level)
);

-- Add RLS policies for umpire_certifications
ALTER TABLE umpire_certifications ENABLE ROW LEVEL SECURITY;

-- Everyone can view certifications
CREATE POLICY "Certifications are viewable by everyone" ON umpire_certifications
    FOR SELECT USING (true);

-- Only admins can manage certifications
CREATE POLICY "Certifications are manageable by admins" ON umpire_certifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to check if a user is certified as an umpire
CREATE OR REPLACE FUNCTION is_certified_umpire(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM umpire_certifications 
        WHERE profile_id = user_id 
        AND (expiry_date IS NULL OR expiry_date > NOW())
    );
END;
$$;

-- Trigger to update is_umpire status when certifications change
CREATE OR REPLACE FUNCTION update_umpire_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the is_umpire flag based on valid certifications
    UPDATE profiles
    SET is_umpire = is_certified_umpire(NEW.profile_id)
    WHERE id = NEW.profile_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_umpire_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON umpire_certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_umpire_status();

-- Add constraint to ensure ranked tournaments have an umpire
ALTER TABLE tournaments 
    ADD CONSTRAINT ranked_tournaments_require_umpire 
    CHECK (
        NOT is_ranked OR 
        (is_ranked AND umpire_id IS NOT NULL)
    ); 