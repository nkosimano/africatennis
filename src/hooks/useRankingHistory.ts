import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RankingHistoryEntry {
  id: number;
  profile_id: string;
  ranking_type: 'singles' | 'doubles';
  points: number;
  rank: number;
  calculation_date: string;
  related_event_id: string | null;
}

export function useRankingHistory(profileId: string, rankingType: 'singles' | 'doubles') {
  const [history, setHistory] = useState<RankingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [profileId, rankingType]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ranking_history')
        .select('*')
        .eq('profile_id', profileId)
        .eq('ranking_type', rankingType)
        .order('calculation_date', { ascending: true });

      if (fetchError) throw fetchError;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching ranking history:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    history,
    loading,
    error,
    refresh: fetchHistory,
  };
}