import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MatchCompletionParams {
  match_id: string;
  event_id: string;
  winner_id: string;
  loser_id: string;
  score_summary: {
    sets: Array<{
      team_a: number;
      team_b: number;
      tiebreak_team_a?: number;
      tiebreak_team_b?: number;
    }>;
  };
}

interface EventData {
  event_type: string;
  status: string;
  created_by: string; // Using created_by instead of organizer_id to match schema
}

export function useMatchCompletion() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeMatch = async (params: MatchCompletionParams) => {
    if (!user) {
      setError('User must be authenticated to complete a match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Verify user has permission to complete this match
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('event_type, status, created_by')
        .eq('id', params.event_id)
        .single();

      if (eventError) throw eventError;

      // Check if user is authorized (creator, umpire, or participant)
      const isCreator = (eventData as EventData).created_by === user.id;
      
      if (!isCreator) {
        const { data: participantData } = await supabase
          .from('event_participants')
          .select('role')
          .eq('event_id', params.event_id)
          .eq('profile_id', user.id)
          .single();

        const isUmpire = participantData?.role === 'umpire';
        const isParticipant = ['player', 'challenger', 'opponent'].includes(participantData?.role || '');

        if (!isUmpire && !isParticipant) {
          throw new Error('Not authorized to complete this match');
        }
      }

      // 2. Call the match completion edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/handle-match-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete match');
      }

      const result = await response.json();

      // 3. Update local state/cache if needed
      // This could involve invalidating certain queries or updating local state
      // depending on your caching strategy

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while completing the match');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    completeMatch,
    loading,
    error
  };
} 