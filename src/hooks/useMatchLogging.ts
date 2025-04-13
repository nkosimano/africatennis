import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MatchData {
  type: 'ranked' | 'friendly';
  format: 'best_of_3' | 'best_of_1' | 'pro_set' | 'doubles';
  playerA: string;
  playerB: string;
  scores: Array<{ setNumber: number; playerA: number; playerB: number }>;
  acesPlayerA: number;
  acesPlayerB: number;
  matchDate: Date;
  result: 'completed' | 'retirement' | 'walkover';
  retirementScores?: Array<{ setNumber: number; playerA: number; playerB: number }>;
}

export function useMatchLogging() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logMatch = async (matchData: MatchData) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User must be authenticated to log matches');
      }

      // Create the event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            event_type: matchData.type === 'ranked' ? 'match_singles_ranked' : 'match_singles_friendly',
            status: matchData.type === 'ranked' ? 'pending_confirmation' : 'completed',
            scheduled_start_time: matchData.matchDate.toISOString(),
            scheduled_end_time: new Date(matchData.matchDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (eventError) throw eventError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('event_participants')
        .insert([
          {
            event_id: event.id,
            profile_id: matchData.playerA,
            role: 'challenger',
            invitation_status: matchData.playerA === user.id ? 'accepted' : 'pending',
          },
          {
            event_id: event.id,
            profile_id: matchData.playerB,
            role: 'opponent',
            invitation_status: matchData.playerB === user.id ? 'accepted' : 'pending',
          },
        ]);

      if (participantsError) throw participantsError;

      // Add match scores
      const { error: scoresError } = await supabase
        .from('match_scores')
        .insert(
          matchData.scores.map(score => ({
            event_id: event.id,
            set_number: score.setNumber,
            score_team_a: score.playerA,
            score_team_b: score.playerB,
            recorded_by: user.id,
          }))
        );

      if (scoresError) throw scoresError;

      // Add match statistics
      const { error: statsError } = await supabase
        .from('match_statistics')
        .insert([
          {
            match_id: event.id,
            player_id: matchData.playerA,
            winners: matchData.acesPlayerA,
            unforced_errors: 0,
          },
          {
            match_id: event.id,
            player_id: matchData.playerB,
            winners: matchData.acesPlayerB,
            unforced_errors: 0,
          },
        ]);

      if (statsError) throw statsError;

      return { error: null };
    } catch (err) {
      console.error('Error logging match:', err);
      return { error: err instanceof Error ? err.message : 'An error occurred while logging the match' };
    } finally {
      setLoading(false);
    }
  };

  return {
    logMatch,
    loading,
    error,
  };
}