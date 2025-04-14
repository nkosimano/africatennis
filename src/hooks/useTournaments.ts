import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type TournamentFormat = Database['public']['Enums']['tournament_format_enum'];
type TournamentStatus = Database['public']['Enums']['tournament_status_enum'];

interface TournamentData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  format: TournamentFormat;
  location_id?: string;
  max_participants?: number;
  registration_deadline?: string;
  is_ranked?: boolean;
}

interface TournamentParticipant {
  profile_id: string;
  seed?: number;
}

export function useTournaments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTournament = async (
    tournamentData: TournamentData,
    participants: TournamentParticipant[]
  ) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to create tournaments');
      }

      setLoading(true);
      setError(null);

      // Start a Supabase transaction
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert([{
          name: tournamentData.name,
          description: tournamentData.description,
          start_date: tournamentData.start_date,
          end_date: tournamentData.end_date,
          format: tournamentData.format,
          organizer_id: user.id,
          location_id: tournamentData.location_id,
          max_participants: tournamentData.max_participants,
          registration_deadline: tournamentData.registration_deadline,
          is_ranked: tournamentData.is_ranked ?? true,
          status: 'pending' as TournamentStatus
        }])
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Create first round
      const { data: round, error: roundError } = await supabase
        .from('tournament_rounds')
        .insert([{
          tournament_id: tournament.id,
          round_number: 1,
          status: 'pending' as TournamentStatus
        }])
        .select()
        .single();

      if (roundError) {
        // If round creation fails, delete the tournament
        await supabase.from('tournaments').delete().eq('id', tournament.id);
        throw roundError;
      }

      // Create matches for the first round
      const matches = [];
      for (let i = 0; i < participants.length; i += 2) {
        const player1 = participants[i];
        const player2 = participants[i + 1];

        // Create an event for the match
        const { data: event, error: eventError } = await supabase
          .from('events')
          .insert([{
            event_type: tournamentData.is_ranked ? 'tournament_match_singles' : 'match_singles_friendly',
            status: 'pending',
            organizer_id: user.id,
            scheduled_start_time: tournamentData.start_date,
            scheduled_end_time: tournamentData.end_date,
            location_id: tournamentData.location_id,
            notes: `Tournament: ${tournamentData.name} - Round 1`
          }])
          .select()
          .single();

        if (eventError) throw eventError;

        // Create the tournament match
        matches.push({
          tournament_id: tournament.id,
          round_id: round.id,
          player1_id: player1?.profile_id,
          player2_id: player2?.profile_id,
          status: 'pending' as TournamentStatus,
          scheduled_time: tournamentData.start_date,
          event_id: event.id
        });

        // Add participants to the event
        if (player1) {
          await supabase.from('event_participants').insert([{
            event_id: event.id,
            profile_id: player1.profile_id,
            role: 'player'
          }]);
        }
        if (player2) {
          await supabase.from('event_participants').insert([{
            event_id: event.id,
            profile_id: player2.profile_id,
            role: 'player'
          }]);
        }
      }

      // Insert all matches
      if (matches.length > 0) {
        const { error: matchesError } = await supabase
          .from('tournament_matches')
          .insert(matches);

        if (matchesError) throw matchesError;
      }

      return { data: tournament, error: null };
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the tournament');
      return {
        data: null,
        error: err instanceof Error ? err.message : 'An error occurred while creating the tournament'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createTournament,
    loading,
    error
  };
}