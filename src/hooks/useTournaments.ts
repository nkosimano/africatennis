import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Event } from './useEvents';
import type { Database } from '../types/supabase';

type EventType = Database['public']['Enums']['event_type_enum'];
type ParticipantRole = Database['public']['Enums']['participant_role_enum'];
type InvitationStatus = Database['public']['Enums']['invitation_status_enum'];

export function useTournaments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTournament = async (
    eventData: Partial<Event>,
    participants: { profile_id: string; role: ParticipantRole }[]
  ) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to create tournaments');
      }

      setLoading(true);
      setError(null);

      // Create the tournament event
      const { data: tournament, error: tournamentError } = await supabase
        .from('events')
        .insert([{
          event_type: 'tournament_match' as EventType,
          status: 'pending_confirmation',
          created_by: user.id,
          scheduled_start_time: eventData.scheduled_start_time!,
          scheduled_end_time: eventData.scheduled_end_time!,
          location_id: eventData.location_id || null,
          notes: eventData.notes || null
        }])
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Add participants
      const participantData = participants.map(p => ({
        event_id: tournament.id,
        profile_id: String(p.profile_id),
        role: p.role,
        invitation_status: (p.profile_id === user.id ? 'accepted' : 'pending') as InvitationStatus
      }));

      console.log('Participant data being sent to Supabase:', participantData);

      const { error: participantsError } = await supabase
        .from('event_participants')
        .insert(participantData);

      if (participantsError) {
        // If participant insertion fails, delete the tournament
        await supabase.from('events').delete().eq('id', tournament.id);
        throw participantsError;
      }

      return { data: tournament, error: null };
    } catch (err) {
      console.error('Error creating tournament:', err);
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