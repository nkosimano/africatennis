import { z } from 'zod';

// Event validation schema
export const eventSchema = z.object({
  event_type: z.enum([
    'match_singles_friendly',
    'match_singles_ranked',
    'match_doubles_friendly',
    'match_doubles_ranked',
    'coaching_session',
    'hitting_session',
    'tournament_match'
  ], { message: "Invalid event type selected" }), // Added error message example
  scheduled_start_time: z.string().datetime({ message: "Invalid start date/time format" }),
  scheduled_end_time: z.string().datetime({ message: "Invalid end date/time format" }),
  // **FIX:** Added .nullable() to allow null in addition to string or undefined
  location_id: z.string().uuid({ message: "Invalid location format" }).optional().nullable(),
  // **FIX:** Added .nullable() to allow null in addition to string or undefined
  notes: z.string().max(500, { message: "Notes cannot exceed 500 characters" }).optional().nullable(), // Added max length example
  // Note: The 'participants' validation seems to be handled separately in the hook.
  // If you intended to validate it here, ensure it matches the structure passed in.
  // It might be better to keep participant validation separate as the hook does.
  // participants: z.array(z.object({
  //   profile_id: z.string().uuid(),
  //   role: z.string()
  // })).optional() // Example if you were validating participants here
});

export function validateEventData(data: any): string | null {
  try {
    // Attempt to parse the data against the schema
    eventSchema.parse(data);
    // If parse is successful, return null (no error)
    return null;
  } catch (error: any) {
    // Log the detailed Zod error object for debugging
    console.error("Zod validation error details:", error.errors);
    // Return the first validation error message for user feedback
    return error.errors?.[0]?.message || "Event data validation failed";
  }
}

export function validateParticipants(participants: any): string | null {
  // Check if participants is a non-empty array
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return "Participants array cannot be empty.";
  }

  // Validate each participant object in the array
  for (const participant of participants) {
    if (!participant || typeof participant !== 'object') {
      return "Each participant entry must be an object.";
    }

    // Validate profile_id exists and is a string (UUID check is in schema if included)
    if (!participant.profile_id || typeof participant.profile_id !== 'string') {
      return `Invalid or missing profile_id found in participants: ${participant.profile_id}`;
    }
    // You could add a regex check for UUID format here if needed for pre-Zod validation

    // Validate role exists and is a string
    if (!participant.role || typeof participant.role !== 'string') {
      return `Invalid or missing role found for participant ${participant.profile_id}: ${participant.role}`;
    }
  }

  // If all participants are valid, return null (no error)
  return null;
}

// Match score validation schema (Unchanged)
export const matchScoreSchema = z.object({
  event_id: z.string().uuid(),
  set_number: z.number().int().positive(),
  score_team_a: z.number().int().min(0),
  score_team_b: z.number().int().min(0),
  tiebreak_score_team_a: z.number().int().min(0).optional(),
  tiebreak_score_team_b: z.number().int().min(0).optional(),
  game_score_detail_json: z.object({
    games: z.array(z.object({
      winner: z.enum(['A', 'B']),
      game_number: z.number().int().positive()
    }))
  }).optional()
});

// Profile validation schema (Unchanged)
export const profileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).optional(),
  full_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  skill_level: z.number().min(1).max(7).optional(),
  playing_style: z.string().optional(),
  preferred_hand: z.enum(['left', 'right', 'ambidextrous']).optional(),
  coach_hourly_rate: z.number().positive().optional(),
  coach_specialization: z.string().optional()
});