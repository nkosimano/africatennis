import { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

interface MatchScore {
  player1Score: number;
  player2Score: number;
  setNumber: number;
}

export function useUmpireControls(matchId: string) {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMatch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', matchId);

      if (updateError) throw updateError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start match';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScore = async (score: MatchScore) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: submitError } = await supabase
        .from('match_scores')
        .insert({
          match_id: matchId,
          player1_score: score.player1Score,
          player2_score: score.player2Score,
          set_number: score.setNumber,
          submitted_at: new Date().toISOString()
        });

      if (submitError) throw submitError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit score';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const raiseDispute = async (description: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: disputeError } = await supabase
        .from('match_disputes')
        .insert({
          match_id: matchId,
          description,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (disputeError) throw disputeError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to raise dispute';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isUmpire = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('umpire_id')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      return data.umpire_id === userId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check umpire status';
      setError(message);
      return false;
    }
  };

  return {
    startMatch,
    submitScore,
    raiseDispute,
    isUmpire,
    isLoading,
    error
  };
} 