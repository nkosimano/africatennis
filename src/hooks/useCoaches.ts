import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Coach {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  playing_style: string | null;
  preferred_hand: 'left' | 'right' | 'ambidextrous' | null;
  is_coach: boolean;
  coach_hourly_rate: number | null;
  coach_specialization: string | null;
  preferred_locations?: string[];
  skill_level: number | null;
}

export function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_coach', true)
        .order('full_name');

      if (fetchError) {
        throw new Error(
          fetchError.message === 'Failed to fetch'
            ? 'Unable to load coaches. Please check your internet connection.'
            : `Error loading coaches: ${fetchError.message}`
        );
      }

      if (!data) {
        throw new Error('No coaches data received from the server');
      }

      setCoaches(data as Coach[]);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading coaches'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  return {
    coaches,
    loading,
    error,
    refresh: fetchCoaches,
  };
}