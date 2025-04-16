// Script to apply the get_all_event_participants stored procedure migration
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Please ensure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Applying get_all_event_participants stored procedure migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250416_get_all_event_participants.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error applying migration:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    console.log('You should now be able to see all participants in events.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT 1' 
    });
    
    // If the function exists, we're good
    if (!error || !error.message.includes('function') || !error.message.includes('does not exist')) {
      return;
    }
    
    console.log('Creating exec_sql function...');
    
    // Create the function
    const { error: createError } = await supabase.sql(`
      CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    if (createError) {
      console.error('Error creating exec_sql function:', createError);
      return;
    }
    
    console.log('exec_sql function created successfully!');
    
  } catch (err) {
    console.error('Error checking/creating exec_sql function:', err);
  }
}

// Run the migration
async function run() {
  await createExecSqlFunction();
  await applyMigration();
}

run();
