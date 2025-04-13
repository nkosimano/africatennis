import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MatchStatistics {
  id: string;
  match_id: string | null;
  player_id: string | null;
  winners: number | null;
  unforced_errors: number | null;
  aces: number | null;
  created_at: string | null;
  updated_at: string | null;
  player?: {
    full_name: string | null;
    username: string | null;
  } | null;
}

export function useMatchStatistics(matchId: string | null) {
  const [statistics, setStatistics] = useState<MatchStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId) {
      fetchStatistics();
    }
  }, [matchId]);

  const fetchStatistics = async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch match participants first
      const { data: matchData, error: matchError } = await supabase
        .from('events')
        .select(`
          id,
          participants:event_participants(
            profile_id,
            profile:profiles(
              full_name,
              username
            )
          )
        `)
        .eq('id', matchId)
        .single();
        
      if (matchError) {
        console.error('Error fetching match data:', matchError);
        setError(`Failed to fetch match data: ${matchError.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      if (!matchData || !matchData.participants || matchData.participants.length === 0) {
        console.warn('No participants found for this match');
        setStatistics([]);
        setLoading(false);
        return;
      }

      // Then try to fetch existing statistics
      const { data: statsData, error: statsError } = await supabase
        .from('match_statistics')
        .select(`
          *,
          player:profiles(
            full_name,
            username
          )
        `)
        .eq('match_id', matchId);

      if (statsError) {
        console.error('Error fetching match statistics:', statsError);
        
        // Still create empty statistics despite the error
        if (matchData && matchData.participants) {
          const emptyStats = matchData.participants.map((participant: any) => ({
            id: `temp-${participant.profile_id}`,
            match_id: matchId,
            player_id: participant.profile_id,
            winners: 0,
            unforced_errors: 0,
            aces: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            player: participant.profile
          }));
          
          setStatistics(emptyStats);
          setError(`Failed to load existing statistics, showing default values: ${statsError.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        throw statsError;
      }

      if (statsData && statsData.length > 0) {
        // We have existing statistics
        setStatistics(statsData);
      } else if (matchData && matchData.participants) {
        // Create empty statistics objects for each participant
        const emptyStats = matchData.participants.map((participant: any) => ({
          id: `temp-${participant.profile_id}`,
          match_id: matchId,
          player_id: participant.profile_id,
          winners: 0,
          unforced_errors: 0,
          aces: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          player: participant.profile
        }));
        
        setStatistics(emptyStats);
      } else {
        setStatistics([]);
      }

    } catch (err) {
      console.error('Error in fetchStatistics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching match statistics');
    } finally {
      setLoading(false);
    }
  };

  const updateStatistics = async (
    playerId: string,
    updates: Partial<Omit<MatchStatistics, 'id' | 'match_id' | 'player_id'>>
  ): Promise<{ error: string | null; data?: MatchStatistics }> => {
    if (!matchId || !playerId) {
      return { error: 'Missing match ID or player ID' };
    }
    
    try {
      // First check if player exists in this match
      const playerExists = statistics.some(stat => stat.player_id === playerId);
      if (!playerExists) {
        return { error: 'Player is not a participant in this match' };
      }
      
      const { data, error: updateError } = await supabase
        .from('match_statistics')
        .upsert([
          {
            match_id: matchId,
            player_id: playerId,
            ...updates,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (updateError) {
        console.error('Error updating match statistics:', updateError);
        return { error: `Failed to update statistics: ${updateError.message}` };
      }

      if (!data) {
        return { error: 'No data returned after update' };
      }

      // Update local state
      setStatistics(prev => 
        prev.map(stat => 
          stat.player_id === playerId ? { ...stat, ...data } : stat
        )
      );

      return { error: null, data };
    } catch (err) {
      console.error('Error updating match statistics:', err);
      return { error: err instanceof Error ? err.message : 'An error occurred updating statistics' };
    }
  };

  return {
    statistics,
    loading,
    error,
    updateStatistics,
    refresh: fetchStatistics,
  };
}