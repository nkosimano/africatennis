import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Achievement {
  id: string;
  player_id: string;
  achievement_type: string;
  achievement_level: string;
  achieved_at: string;
  description: string;
  metadata: Json;
}

export function usePlayerAchievements(playerId?: string) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId && !user?.id) return;
    fetchAchievements();
  }, [user, playerId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const targetPlayerId = playerId || user?.id;
      if (!targetPlayerId) return;

      const { data, error: fetchError } = await supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', targetPlayerId)
        .order('achieved_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAchievements(data?.map(achievement => ({
        ...achievement,
        player_id: achievement.player_id || '',
        achieved_at: achievement.achieved_at || '',
        description: achievement.description || '',
        metadata: achievement.metadata || null,
      })) || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    achievements,
    loading,
    error,
    refresh: fetchAchievements,
  };
}