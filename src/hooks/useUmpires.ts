import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export function useUmpires() {
  const [umpires, setUmpires] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUmpires();
  }, []);

  const fetchUmpires = async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjust the filter below to match your schema, e.g. role === 'umpire' or is_umpire === true
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'umpire')
        .order('full_name');
      if (fetchError) throw fetchError;
      setUmpires(data as Profile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch umpires');
    } finally {
      setLoading(false);
    }
  };

  return {
    umpires,
    loading,
    error,
    refresh: fetchUmpires,
  };
}
