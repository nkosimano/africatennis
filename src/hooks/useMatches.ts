import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';

export type Match = {
  id: string;
  event_type: string;
  status: string;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  location: {
    name: string;
  } | null;
  participants: {
    profile_id: string;
    invitation_status: string;
    role: string;
    profile: {
      full_name: string;
    };
  }[];
};

type Activity = {
  id: string;
  event_type: string;
  status: string;
  scheduled_start_time: string;
  location: {
    name: string;
  } | null;
  participants: {
    profile_id: string;
    invitation_status: string;
    role: string;
    profile: {
      full_name: string;
    };
  }[];
};

type EventWithRelations = Database['public']['Tables']['events']['Row'] & {
  location: Database['public']['Tables']['locations']['Row'] | null;
  event_participants: (Database['public']['Tables']['event_participants']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'];
  })[];
};

export function useMatches() {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    async function fetchMatches() {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure supabase client is initialized
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
        
        // First, fetch the events and their participants
        const { data: rawMatchesData, error: matchesError } = await supabase
          .from('events')
          .select(`
            id,
            event_type,
            status,
            scheduled_start_time,
            scheduled_end_time,
            location:locations(name),
            event_participants!inner(
              profile_id,
              invitation_status,
              role,
              profiles!inner(
                full_name
              )
            )
          `)
          .gte('scheduled_start_time', new Date().toISOString())
          .lte('scheduled_start_time', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 days from now
          .order('scheduled_start_time', { ascending: true })
          .limit(5);

        if (matchesError) throw matchesError;
        if (!isSubscribed) return;

        // Handle the case when there are no matches
        if (!rawMatchesData || rawMatchesData.length === 0) {
          setUpcomingMatches([]);
          setRecentActivity([]);
          setLoading(false);
          return;
        }

        const matchesData = rawMatchesData as unknown as EventWithRelations[];

        // Format upcoming matches
        const formattedMatches = matchesData.map(match => ({
          id: match.id,
          event_type: match.event_type,
          status: match.status,
          scheduled_start_time: match.scheduled_start_time,
          scheduled_end_time: match.scheduled_end_time,
          location: match.location ? { name: match.location.name } : null,
          participants: match.event_participants.map(participant => ({
            profile_id: participant.profile_id,
            invitation_status: participant.invitation_status,
            role: participant.role,
            profile: {
              full_name: participant.profile?.full_name || participant.profiles?.full_name || '',
            },
          })),
        }));

        setUpcomingMatches(formattedMatches);

        // Fetch recent activity (completed matches)
        const { data: recentActivityData, error: activityError } = await supabase
          .from('events')
          .select(`
            id,
            event_type,
            status,
            scheduled_start_time,
            location:locations(name),
            event_participants(
              profile_id,
              invitation_status,
              role,
              profiles!inner(
                full_name
              )
            )
          `)
          .eq('status', 'completed')
          .order('scheduled_start_time', { ascending: false })
          .limit(5);

        if (activityError) throw activityError;
        if (!isSubscribed) return;

        if (recentActivityData) {
          const formattedActivity = recentActivityData.map(activity => ({
            id: activity.id,
            event_type: activity.event_type,
            status: activity.status,
            scheduled_start_time: activity.scheduled_start_time,
            location: activity.location ? { name: activity.location.name } : null,
            participants: activity.event_participants.map(participant => ({
              profile_id: participant.profile_id,
              invitation_status: participant.invitation_status,
              role: participant.role,
              profile: {
                full_name: participant.profiles?.full_name || '',
              },
            })),
          }));

          setRecentActivity(formattedActivity);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  return {
    upcomingMatches,
    recentActivity,
    loading,
    error,
  };
}