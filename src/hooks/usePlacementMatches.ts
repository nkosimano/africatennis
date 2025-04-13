import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from './useEvents';

export function usePlacementMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchPlacementMatches();
  }, [user]);

  const fetchPlacementMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          location:locations(*),
          participants:event_participants(
            id,
            profile_id,
            role,
            invitation_status,
            profile:profiles(
              full_name,
              username
            )
          )
        `)
        .eq('event_type', 'match_singles_ranked')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: true })
        .limit(3);

      if (fetchError) throw fetchError;
      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching placement matches:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createPlacementMatch = async (matchData: {
    opponent_id: string;
    location_id: string;
    scheduled_start_time: string;
  }) => {
    try {
      if (!user) throw new Error('User must be authenticated');
      if (matches.length >= 3) throw new Error('Maximum placement matches reached');

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            event_type: 'match_singles_ranked',
            status: 'pending_confirmation',
            scheduled_start_time: matchData.scheduled_start_time,
            scheduled_end_time: new Date(new Date(matchData.scheduled_start_time).getTime() + 2 * 60 * 60 * 1000).toISOString(),
            location_id: matchData.location_id,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: participantsError } = await supabase
        .from('event_participants')
        .insert([
          {
            event_id: event.id,
            profile_id: user.id,
            role: 'challenger',
            invitation_status: 'accepted',
          },
          {
            event_id: event.id,
            profile_id: matchData.opponent_id,
            role: 'opponent',
            invitation_status: 'pending',
          },
        ]);

      if (participantsError) throw participantsError;

      await fetchPlacementMatches();
      return { error: null };
    } catch (err) {
      console.error('Error creating placement match:', err);
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return {
    matches,
    loading,
    error,
    createPlacementMatch,
    refresh: fetchPlacementMatches,
  };
}