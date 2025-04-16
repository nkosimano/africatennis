import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type Match = {
  id: string;
  event_type: string;
  status: string;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  location: {
    name: string;
  } | null;
  event_participants: {
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
  event_participants: {
    profile_id: string;
    invitation_status: string;
    role: string;
    profile: {
      full_name: string;
    };
  }[];
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
        
        // Step 1: Fetch upcoming events (matches) without deep joins
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, event_type, status, scheduled_start_time, scheduled_end_time, location_id')
          .gte('scheduled_start_time', new Date().toISOString())
          .lte('scheduled_start_time', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 days from now
          .order('scheduled_start_time', { ascending: true })
          .limit(5);
        if (eventsError) throw eventsError;
        if (!isSubscribed) return;
        if (!eventsData || eventsData.length === 0) {
          setUpcomingMatches([]);
          setRecentActivity([]);
          setLoading(false);
          return;
        }
        // Step 2: Fetch locations for all events
        const locationIds = eventsData.filter(e => e.location_id).map(e => e.location_id);
        let locationsMap: Record<string, { name: string }> = {};
        if (locationIds.length > 0) {
          const { data: locations } = await supabase
            .from('locations')
            .select('id, name')
            .in('id', locationIds);
          if (locations) {
            locationsMap = locations.reduce((acc: any, loc: any) => {
              acc[loc.id] = { name: loc.name };
              return acc;
            }, {});
          }
        }
        // Step 3: Fetch participants for all events
        const eventIds = eventsData.map(e => e.id);
        let allParticipants: any[] = [];
        if (eventIds.length > 0) {
          const { data: participants } = await supabase
            .from('event_participants')
            .select('id, event_id, profile_id, invitation_status, role')
            .in('event_id', eventIds);
          if (participants) {
            allParticipants = participants;
          }
        }
        // Step 4: Fetch profiles for all participants
        const profileIds = allParticipants.map(p => p.profile_id);
        let profilesMap: Record<string, { full_name: string }> = {};
        if (profileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);
          if (profiles) {
            profilesMap = profiles.reduce((acc: any, prof: any) => {
              acc[prof.id] = { full_name: prof.full_name };
              return acc;
            }, {});
          }
        }
        // Step 5: Group participants by event_id
        const participantsByEvent: Record<string, any[]> = {};
        for (const participant of allParticipants) {
          if (!participantsByEvent[participant.event_id]) participantsByEvent[participant.event_id] = [];
          participantsByEvent[participant.event_id].push({
            profile_id: participant.profile_id,
            invitation_status: participant.invitation_status,
            role: participant.role,
            profile: profilesMap[participant.profile_id] || { full_name: '' },
          });
        }
        // Step 6: Format upcoming matches
        const formattedMatches = eventsData.map(event => ({
          id: event.id,
          event_type: event.event_type,
          status: event.status,
          scheduled_start_time: event.scheduled_start_time,
          scheduled_end_time: event.scheduled_end_time,
          location: locationsMap[event.location_id] || null,
          event_participants: participantsByEvent[event.id] || [],
        }));
        setUpcomingMatches(formattedMatches);

        // Step 7: Fetch recent activity (completed matches) - repeat similar logic
        const { data: recentEvents, error: recentError } = await supabase
          .from('events')
          .select('id, event_type, status, scheduled_start_time, location_id')
          .eq('status', 'completed')
          .order('scheduled_start_time', { ascending: false })
          .limit(5);
        if (recentError) throw recentError;
        if (!isSubscribed) return;
        if (!recentEvents || recentEvents.length === 0) {
          setRecentActivity([]);
        } else {
          const recentLocationIds = recentEvents.filter(e => e.location_id).map(e => e.location_id);
          let recentLocationsMap: Record<string, { name: string }> = {};
          if (recentLocationIds.length > 0) {
            const { data: locations } = await supabase
              .from('locations')
              .select('id, name')
              .in('id', recentLocationIds);
            if (locations) {
              recentLocationsMap = locations.reduce((acc: any, loc: any) => {
                acc[loc.id] = { name: loc.name };
                return acc;
              }, {});
            }
          }
          const recentEventIds = recentEvents.map(e => e.id);
          let recentParticipants: any[] = [];
          if (recentEventIds.length > 0) {
            const { data: participants } = await supabase
              .from('event_participants')
              .select('id, event_id, profile_id, invitation_status, role')
              .in('event_id', recentEventIds);
            if (participants) {
              recentParticipants = participants;
            }
          }
          const recentProfileIds = recentParticipants.map(p => p.profile_id);
          let recentProfilesMap: Record<string, { full_name: string }> = {};
          if (recentProfileIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', recentProfileIds);
            if (profiles) {
              recentProfilesMap = profiles.reduce((acc: any, prof: any) => {
                acc[prof.id] = { full_name: prof.full_name };
                return acc;
              }, {});
            }
          }
          const recentParticipantsByEvent: Record<string, any[]> = {};
          for (const participant of recentParticipants) {
            if (!recentParticipantsByEvent[participant.event_id]) recentParticipantsByEvent[participant.event_id] = [];
            recentParticipantsByEvent[participant.event_id].push({
              profile_id: participant.profile_id,
              invitation_status: participant.invitation_status,
              role: participant.role,
              profile: recentProfilesMap[participant.profile_id] || { full_name: '' },
            });
          }
          const formattedActivity = recentEvents.map(event => ({
            id: event.id,
            event_type: event.event_type,
            status: event.status,
            scheduled_start_time: event.scheduled_start_time,
            location: recentLocationsMap[event.location_id] || null,
            event_participants: recentParticipantsByEvent[event.id] || [],
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