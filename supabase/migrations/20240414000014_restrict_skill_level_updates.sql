-- Create policy to restrict skill_level updates to service role only
CREATE POLICY "Only service role can update skill level"
ON profiles
FOR UPDATE USING (
    CASE 
        WHEN auth.role() = 'service_role' THEN true
        WHEN NEW.skill_level IS NOT DISTINCT FROM OLD.skill_level THEN true
        ELSE false
    END
); 