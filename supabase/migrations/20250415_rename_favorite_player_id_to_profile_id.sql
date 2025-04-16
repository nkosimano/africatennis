-- Migration script to rename favorite_player_id to profile_id in favorite_players table

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE favorite_players DROP CONSTRAINT IF EXISTS favorite_players_favorite_player_id_fkey;

-- Step 2: Rename the column
ALTER TABLE favorite_players RENAME COLUMN favorite_player_id TO profile_id;

-- Step 3: Add the new foreign key constraint
ALTER TABLE favorite_players 
  ADD CONSTRAINT favorite_players_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES profiles(id);

-- Step 4: Update any indexes that might reference the old column name
-- Note: You may need to adjust this if you have specific indexes
DROP INDEX IF EXISTS idx_favorite_players_favorite_player_id;
CREATE INDEX IF NOT EXISTS idx_favorite_players_profile_id ON favorite_players(profile_id);

-- Step 5: Update any triggers or functions that might reference the old column name
-- This is a placeholder - you'll need to identify and update any specific triggers or functions
-- that reference favorite_player_id in your database

-- Log the migration
INSERT INTO _migrations (name, executed_at) 
VALUES ('20250415_rename_favorite_player_id_to_profile_id', NOW());
