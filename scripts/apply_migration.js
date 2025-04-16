const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if needed
// require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250415_rename_favorite_player_id_to_profile_id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    
    // Execute the SQL using Supabase's rpc call
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error applying migration:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    
    // Verify the changes
    const { data, error: verifyError } = await supabase
      .from('favorite_players')
      .select('profile_id')
      .limit(1);
    
    if (verifyError) {
      console.error('Error verifying migration:', verifyError);
      return;
    }
    
    console.log('Verification successful. Column renamed to profile_id.');
    console.log('Sample data:', data);
    
  } catch (error) {
    console.error('Error in migration process:', error);
  }
}

// Run the migration
applyMigration();
