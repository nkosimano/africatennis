-- Change skill_level column type to NUMERIC
ALTER TABLE profiles
ALTER COLUMN skill_level TYPE NUMERIC(3,1) USING skill_level::NUMERIC; 