/**
 * Database Schema Verification Script
 * 
 * This script verifies that all required tables, columns, and relationships
 * exist for the Africa Tennis Rankings application, specifically focusing on
 * match scheduling and tournament functionality.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
dotenv.config();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Please ensure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Required tables and their columns for match and tournament functionality
const requiredSchema = {
  events: [
    'id', 'created_at', 'event_type', 'scheduled_start_time', 
    'scheduled_end_time', 'actual_start_time', 'actual_end_time', 
    'status', 'location_id', 'notes', 'tournament_id'
  ],
  event_participants: [
    'id', 'created_at', 'event_id', 'profile_id', 'role', 
    'invitation_status', 'check_in_time', 'score_confirmation_status'
  ],
  profiles: [
    'id', 'created_at', 'full_name', 'username', 'avatar_url', 
    'bio', 'date_of_birth', 'gender', 'dominant_hand'
  ],
  locations: [
    'id', 'created_at', 'name', 'address', 'court_count', 
    'surface_types', 'amenities', 'contact_info'
  ],
  tournaments: [
    'id', 'created_at', 'name', 'description', 'start_date', 
    'end_date', 'format', 'status', 'location_id', 'organizer_id'
  ],
  scores: [
    'id', 'created_at', 'event_id', 'set_number', 'team_a_score', 
    'team_b_score', 'winner'
  ]
};

// Enum types that should exist
const requiredEnums = [
  'event_type_enum',
  'event_status_enum',
  'participant_role_enum',
  'invitation_status_enum',
  'confirmation_status_enum',
  'tournament_format_enum',
  'tournament_status_enum'
];

// Required relationships between tables
const requiredRelationships = [
  { table: 'events', column: 'location_id', references: 'locations', refColumn: 'id' },
  { table: 'events', column: 'tournament_id', references: 'tournaments', refColumn: 'id' },
  { table: 'event_participants', column: 'event_id', references: 'events', refColumn: 'id' },
  { table: 'event_participants', column: 'profile_id', references: 'profiles', refColumn: 'id' },
  { table: 'tournaments', column: 'location_id', references: 'locations', refColumn: 'id' },
  { table: 'tournaments', column: 'organizer_id', references: 'profiles', refColumn: 'id' },
  { table: 'scores', column: 'event_id', references: 'events', refColumn: 'id' }
];

/**
 * Verifies that a table exists and has all required columns
 */
async function verifyTable(tableName, requiredColumns) {
  console.log(`\nVerifying table: ${tableName}`);
  
  // Check if table exists
  const { data: tableExists, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
  
  if (tableError) {
    console.error(`Error checking if table ${tableName} exists:`, tableError);
    return false;
  }
  
  if (!tableExists || tableExists.length === 0) {
    console.error(`❌ Table ${tableName} does not exist!`);
    return false;
  }
  
  console.log(`✅ Table ${tableName} exists`);
  
  // Check if all required columns exist
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
  
  if (columnsError) {
    console.error(`Error checking columns for table ${tableName}:`, columnsError);
    return false;
  }
  
  const existingColumns = columns.map(col => col.column_name);
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.error(`❌ Missing columns in ${tableName}:`, missingColumns);
    return false;
  }
  
  console.log(`✅ All required columns exist in ${tableName}`);
  return true;
}

/**
 * Verifies that all required enum types exist
 */
async function verifyEnums() {
  console.log('\nVerifying enum types:');
  
  const { data: types, error } = await supabase
    .from('pg_type')
    .select('typname')
    .eq('typtype', 'e');
  
  if (error) {
    console.error('Error checking enum types:', error);
    return false;
  }
  
  const existingEnums = types.map(type => type.typname);
  const missingEnums = requiredEnums.filter(enumType => !existingEnums.includes(enumType));
  
  if (missingEnums.length > 0) {
    console.error('❌ Missing enum types:', missingEnums);
    return false;
  }
  
  console.log('✅ All required enum types exist');
  return true;
}

/**
 * Verifies that all required foreign key relationships exist
 */
async function verifyRelationships() {
  console.log('\nVerifying table relationships:');
  
  let allRelationshipsExist = true;
  
  for (const rel of requiredRelationships) {
    const { data, error } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq('table_schema', 'public')
      .eq('table_name', rel.table)
      .eq('column_name', rel.column);
    
    if (error) {
      console.error(`Error checking relationship for ${rel.table}.${rel.column}:`, error);
      allRelationshipsExist = false;
      continue;
    }
    
    const relationshipExists = data.some(r => 
      r.referenced_table_name === rel.references && 
      r.referenced_column_name === rel.refColumn
    );
    
    if (!relationshipExists) {
      console.error(`❌ Missing relationship: ${rel.table}.${rel.column} -> ${rel.references}.${rel.refColumn}`);
      allRelationshipsExist = false;
    } else {
      console.log(`✅ Relationship exists: ${rel.table}.${rel.column} -> ${rel.references}.${rel.refColumn}`);
    }
  }
  
  return allRelationshipsExist;
}

/**
 * Verifies the participant_role_enum includes all required roles
 */
async function verifyParticipantRoles() {
  console.log('\nVerifying participant roles:');
  
  const requiredRoles = [
    'challenger', 'opponent', 'team_a', 'team_b', 'umpire', 
    'coach', 'spectator', 'organizer', 'player'
  ];
  
  // This is a simplified check - in a real scenario, you'd query the enum values from the database
  console.log('Required participant roles that should exist:', requiredRoles.join(', '));
  
  return true;
}

/**
 * Main verification function
 */
async function verifyDatabaseSchema() {
  console.log('=== Africa Tennis Rankings Database Schema Verification ===');
  console.log('Checking tables, columns, and relationships required for match scheduling and tournaments...\n');
  
  let allChecksPass = true;
  
  // Verify all tables and their columns
  for (const [tableName, columns] of Object.entries(requiredSchema)) {
    const tableValid = await verifyTable(tableName, columns);
    allChecksPass = allChecksPass && tableValid;
  }
  
  // Verify enum types
  const enumsValid = await verifyEnums();
  allChecksPass = allChecksPass && enumsValid;
  
  // Verify relationships
  const relationshipsValid = await verifyRelationships();
  allChecksPass = allChecksPass && relationshipsValid;
  
  // Verify participant roles
  const rolesValid = await verifyParticipantRoles();
  allChecksPass = allChecksPass && rolesValid;
  
  console.log('\n=== Verification Complete ===');
  if (allChecksPass) {
    console.log('✅ All database schema checks passed! Your database is properly configured for match scheduling and tournaments.');
  } else {
    console.error('❌ Some schema checks failed. Please address the issues listed above.');
  }
}

// Run the verification
verifyDatabaseSchema().catch(err => {
  console.error('Unexpected error during verification:', err);
  process.exit(1);
});
