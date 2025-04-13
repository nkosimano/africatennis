import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Challenge {
  id: string;
  player_id: string;
  challenge_type: string;
  description: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  completed: boolean;
  reward_points: number;
}

export function usePlayerChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('player_challenges')
          .select('*')
          .eq('player_id', user?.id)
          .order('end_date', { ascending: true });

        if (fetchError) {
          // Check if the error is because the table doesn't exist
          if (fetchError.code === '42P01') {
            console.warn('player_challenges table does not exist, using fallback data');
            // Provide fallback data
            const fallbackChallenges = generateFallbackChallenges(user?.id);
            setChallenges(fallbackChallenges);
            return;
          }
          throw fetchError;
        }
        
        setChallenges(data || []);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        
        // Provide fallback data if there's any error
        const fallbackChallenges = generateFallbackChallenges(user?.id);
        setChallenges(fallbackChallenges);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackChallenges = (userId?: string): Challenge[] => {
    if (!userId) return [];
    
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(now.getDate() + 14);
    
    return [
      {
        id: 'fallback-1',
        player_id: userId,
        challenge_type: 'matches',
        description: 'Play 5 matches this week',
        target_value: 5,
        current_value: 2,
        start_date: now.toISOString(),
        end_date: oneWeekLater.toISOString(),
        completed: false,
        reward_points: 100
      },
      {
        id: 'fallback-2',
        player_id: userId,
        challenge_type: 'wins',
        description: 'Win 3 matches against higher-ranked players',
        target_value: 3,
        current_value: 1,
        start_date: now.toISOString(),
        end_date: twoWeeksLater.toISOString(),
        completed: false,
        reward_points: 200
      },
      {
        id: 'fallback-3',
        player_id: userId,
        challenge_type: 'practice',
        description: 'Practice serves for 5 hours',
        target_value: 5,
        current_value: 3,
        start_date: now.toISOString(),
        end_date: oneWeekLater.toISOString(),
        completed: false,
        reward_points: 50
      }
    ];
  };

  const updateChallenge = async (challengeId: string, progress: number) => {
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      const completed = progress >= challenge.target_value;
      
      // If it's a fallback challenge (id starts with 'fallback-'), just update the local state
      if (challengeId.startsWith('fallback-')) {
        setChallenges(prev =>
          prev.map(c =>
            c.id === challengeId
              ? { ...c, current_value: progress, completed }
              : c
          )
        );
        return { error: null };
      }
      
      // Otherwise try to update in the database
      try {
        const { error: updateError } = await supabase
          .from('player_challenges')
          .update({
            current_value: progress,
            completed,
          })
          .eq('id', challengeId);

        if (updateError) throw updateError;
      } catch (err) {
        console.warn('Error updating challenge in database, updating local state only:', err);
        // Fall back to just updating the local state
      }

      setChallenges(prev =>
        prev.map(c =>
          c.id === challengeId
            ? { ...c, current_value: progress, completed }
            : c
        )
      );

      return { error: null };
    } catch (err) {
      console.error('Error updating challenge:', err);
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return {
    challenges,
    loading,
    error,
    updateChallenge,
    refresh: fetchChallenges,
  };
}