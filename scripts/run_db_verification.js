/**
 * Runner script for database schema verification
 * 
 * This script provides a simplified way to run the database verification
 * and optionally fix common issues that might be found.
 */

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found in the project root.');
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

console.log('=== Africa Tennis Rankings Database Verification Runner ===');
console.log('This script will verify your database schema for match scheduling and tournaments.\n');

// Run the verification script
console.log('Running database schema verification...');
exec('node scripts/verify_database_schema.js', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running verification script: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Verification script error: ${stderr}`);
  }
  
  console.log(stdout);
  
  // Check if there were any failures
  if (stdout.includes('❌')) {
    console.log('\nSome schema checks failed. Would you like to:');
    console.log('1. Generate SQL to fix the issues');
    console.log('2. Exit');
    
    rl.question('Enter your choice (1 or 2): ', (answer) => {
      if (answer === '1') {
        console.log('\nGenerating SQL to fix schema issues...');
        generateFixSQL();
      } else {
        console.log('Exiting without generating fix SQL.');
        rl.close();
      }
    });
  } else {
    console.log('\nAll checks passed! Your database schema is correctly configured.');
    rl.close();
  }
});

/**
 * Generates SQL statements to fix common schema issues
 */
function generateFixSQL() {
  const fixSqlPath = path.join(__dirname, '..', 'scripts', 'fix_schema.sql');
  
  // This is a simplified example - in a real implementation, you would parse the 
  // verification output to determine what SQL to generate
  const sqlContent = `-- Africa Tennis Rankings Schema Fix
-- Generated on ${new Date().toISOString()}
-- Run this SQL in your Supabase SQL Editor to fix schema issues

-- Example fixes for common issues:

-- 1. Create missing tables
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type event_type_enum NOT NULL,
  scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  status event_status_enum DEFAULT 'scheduled'::event_status_enum,
  location_id UUID REFERENCES public.locations(id),
  notes TEXT,
  tournament_id UUID REFERENCES public.tournaments(id)
);

CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  role participant_role_enum NOT NULL,
  invitation_status invitation_status_enum DEFAULT 'pending'::invitation_status_enum,
  check_in_time TIMESTAMP WITH TIME ZONE,
  score_confirmation_status confirmation_status_enum DEFAULT 'pending'::confirmation_status_enum
);

-- 2. Create missing enum types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_role_enum') THEN
    CREATE TYPE participant_role_enum AS ENUM (
      'challenger', 'opponent', 'team_a', 'team_b', 'umpire', 
      'coach', 'spectator', 'organizer', 'player'
    );
  END IF;
END $$;

-- 3. Add missing columns
ALTER TABLE IF EXISTS public.events 
  ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id);

-- 4. Add missing foreign key constraints
ALTER TABLE IF EXISTS public.event_participants
  ADD CONSTRAINT IF NOT EXISTS event_participants_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id);

-- Note: This is a template SQL file. You should review and modify it
-- based on the specific issues identified in your database schema.
`;

  fs.writeFileSync(fixSqlPath, sqlContent);
  console.log(`\nSQL fix script generated at: ${fixSqlPath}`);
  console.log('Please review this SQL script carefully before running it on your database.');
  console.log('You can run it in the Supabase SQL Editor or using the supabase CLI.');
  rl.close();
}
