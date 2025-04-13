import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Availability {
  id: string;
  profile_id: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
}

export function useAvailability() {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('availability')
        .select('*')
        .eq('profile_id', user?.id)
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;
      setAvailabilities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = async (newAvailability: Omit<Availability, 'id' | 'profile_id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('availability')
        .insert([
          {
            ...newAvailability,
            profile_id: user?.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      setAvailabilities([...availabilities, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const updateAvailability = async (id: string, updates: Partial<Availability>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('availability')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setAvailabilities(availabilities.map(a => a.id === id ? data : a));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setAvailabilities(availabilities.filter(a => a.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return {
    availabilities,
    loading,
    error,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    refresh: fetchAvailability,
  };
}