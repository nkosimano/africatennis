import { useCallback, useState } from 'react';
import type { Database } from '@/types/supabase';
import { useAuth } from '../contexts/AuthContext';
import { validateEventData, validateParticipants } from '../lib/validation';
import { supabase } from '../lib/supabase';
import { 
  EventParticipantTableData 
} from '@/types/database.types';
import type { EventStatus, InvitationResponse } from '@/types/events';

type EventTableData = Database['public']['Tables']['events']['Row'];
type LocationTableData = Database['public']['Tables']['locations']['Row'];

interface EventWithRelations extends EventTableData {
  event_participants: EventParticipantTableData[];
  location: LocationTableData | null;
}

export interface Event extends EventTableData {
  participants: EventParticipantTableData[];
  location?: LocationTableData;
}

const mapEventWithRelationsToEvent = (eventWithRelations: EventWithRelations): Event => {
  // Normalize location: Supabase returns an array for joined relations, but our type expects a single object or undefined
  const normalizedLocation = Array.isArray(eventWithRelations.location)
    ? eventWithRelations.location[0] || undefined
    : eventWithRelations.location || undefined;

  // Normalize event_participants: ensure each participant's profile is a single object, not an array
  const normalizedParticipants = (eventWithRelations.event_participants || []).map((participant: any) => ({
    ...participant,
    profile: Array.isArray(participant.profile)
      ? participant.profile[0] || undefined
      : participant.profile || undefined,
  }));

  return {
    ...eventWithRelations,
    participants: normalizedParticipants,
    location: normalizedLocation,
  };
};

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Fetch basic event data only (no joins)
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, 
          event_type,
          status,
          scheduled_start_time,
          scheduled_end_time,
          created_at,
          updated_at,
          notes,
          location_id
        `)
        .gte('scheduled_start_time', new Date().toISOString())
        .order('scheduled_start_time', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Supabase eventsError:', error);
        setError('Unable to fetch events. Please try again later.');
        setEvents([]);
        setLoading(false);
        return;
      }

      // Step 2: For each event, fetch location and participants separately (avoid joins that trigger RLS recursion)
      if (data && data.length > 0) {
        // Get all location IDs
        const locationIds = data.filter(event => event.location_id).map(event => event.location_id);
        
        // Fetch all locations in a single query
        let locationsData: Record<string, any> = {};
        if (locationIds.length > 0) {
          const { data: locations } = await supabase
            .from('locations')
            .select('id, name, address')
            .in('id', locationIds);
            
          if (locations) {
            locationsData = locations.reduce((acc: Record<string, any>, loc: any) => {
              acc[loc.id] = loc;
              return acc;
            }, {});
          }
        }
        
        // Get all event IDs
        const eventIds = data.map(event => event.id);
        
        // Fetch all participants for all events in a single query (avoid nested joins)
        let allParticipants: any[] = [];
        if (eventIds.length > 0) {
          const { data: participantsData } = await supabase
            .from('event_participants')
            .select('id, event_id, profile_id, role, invitation_status')
            .in('event_id', eventIds);
          if (participantsData) {
            allParticipants = participantsData;
          }
        }
        // Group participants by event_id
        const participantsByEvent: Record<string, any[]> = {};
        for (const participant of allParticipants) {
          if (!participantsByEvent[participant.event_id]) participantsByEvent[participant.event_id] = [];
          participantsByEvent[participant.event_id].push(participant);
        }
        // Combine all data
        const eventsWithDetails = data.map(event => {
          return {
            ...event,
            participants: participantsByEvent[event.id] || [],
            location: locationsData[event.location_id]
          };
        });
        
        setEvents(eventsWithDetails as any);
      } else {
        setEvents([]);
      }
    } catch (e) {
      console.error('Unexpected error in fetchEvents:', e);
      setError('An unexpected error occurred while fetching events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvent = useCallback(async (eventId: string) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      
      // First, fetch the basic event data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          event_type,
          status,
          scheduled_start_time,
          scheduled_end_time,
          created_at,
          updated_at,
          notes,
          location_id
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error('Event not found');

      // Fetch location data if available
      let locationData = null;
      if (eventData.location_id) {
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', eventData.location_id)
          .single();
          
        if (!locationError) {
          locationData = location;
        }
      }

      // Fetch participants using the stored procedure
      const { data: participants, error: participantsError } = await supabase
        .rpc('get_all_event_participants', { event_id_param: eventId });

      if (participantsError) {
        console.error('Error fetching participants through RPC:', participantsError);
        
        // Fallback: Directly query event_participants and join with profiles
        console.log('Attempting direct query for participants...');
        const { data: directParticipants, error: directError } = await supabase
          .from('event_participants')
          .select(`
            id,
            event_id,
            profile_id,
            role,
            invitation_status,
            profile:profiles(id, full_name, avatar_url)
          `)
          .eq('event_id', eventId);
          
        if (directError) {
          console.error('Error in direct participants query:', directError);
        } else {
          console.log('Direct participants query result:', directParticipants);
          
          // Construct the complete event object with all required properties
          const completeEvent = {
            ...eventData,
            location: locationData || undefined,
            participants: directParticipants || [],
          } as Event;
          
          console.log('Fetched event with direct participants:', completeEvent);
          return completeEvent;
        }
      }

      // Construct the complete event object with all required properties from EventTableData
      const completeEvent = {
        ...eventData,
        location: locationData || undefined,
        participants: participants || [],
      } as Event; // Cast to Event type to satisfy TypeScript

      console.log('Fetched event with participants:', completeEvent);
      return completeEvent;
    } catch (err) {
      console.error('Error fetching event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createEvent = useCallback(async (eventData: Omit<EventTableData, 'id' | 'created_at' | 'updated_at'>, participants: Omit<EventParticipantTableData, 'id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      // Validate event data
      const validationError = validateEventData(eventData);
      if (validationError) {
        setError(validationError);
        return null;
      }

      // Validate participants
      const participantsError = validateParticipants(participants);
      if (participantsError) {
        setError(participantsError);
        return null;
      }

      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select(`
          id,
          event_type,
          status,
          scheduled_start_time,
          scheduled_end_time,
          created_at,
          updated_at,
          notes,
          location_id
        `)
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        setError(eventError.message);
        return null;
      }

      // Add participants
      try {
        console.log('Creating participants for event:', eventResult.id);
        console.log('Participants to add:', JSON.stringify(participants));
        
        // Add each participant individually to better track errors
        for (const participant of participants) {
          console.log(`Adding participant with profile_id ${participant.profile_id} and role ${participant.role}`);
          
          const { data, error } = await supabase
            .from('event_participants')
            .insert([{ 
              event_id: eventResult.id,
              profile_id: participant.profile_id,
              role: participant.role,
              invitation_status: 'accepted' // Default to accepted for now
            }])
            .select();
            
          if (error) {
            console.error(`Error adding participant ${participant.profile_id}:`, error);
            throw error;
          } else {
            console.log(`Successfully added participant:`, data);
          }
        }
      } catch (participantError) {
        console.error('Error adding participants:', participantError);
        setError('Event created but failed to add participants');
        return eventResult;
      }

      // Fetch the complete event with location details
      try {
        const { data: locationData } = await supabase
          .from('locations')
          .select('id, name, address')
          .eq('id', eventResult.location_id)
          .maybeSingle();

        // Fetch participants separately
        const { data: participantsData } = await supabase
          .from('event_participants')
          .select(`
            id, 
            profile_id, 
            role, 
            invitation_status,
            event_id
          `)
          .eq('event_id', eventResult.id);

        console.log('Fetched participants:', participantsData);

        // Fetch profiles for participants
        let profilesData: Record<string, any> = {};
        if (participantsData && participantsData.length > 0) {
          const profileIds = participantsData.map(p => p.profile_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .in('id', profileIds);
            
          if (profiles) {
            profilesData = profiles.reduce((acc: Record<string, any>, profile: any) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }

        // Map profiles to participants
        const participantsWithProfiles = participantsData?.map(participant => {
          const profile = profilesData[participant.profile_id];
          return {
            ...participant,
            profile
          };
        }) || [];

        console.log('Participants with profiles:', participantsWithProfiles);

        const eventWithRelations = {
          ...eventResult,
          location: locationData,
          participants: participantsWithProfiles
        };

        return eventWithRelations;
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to fetch event details');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      return null;
    }
  }, [user]);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<EventTableData>) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const { data: event, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select(`
          id,
          event_type,
          status,
          scheduled_start_time,
          scheduled_end_time,
          created_at,
          updated_at,
          notes,
          location:locations(id, name, address),
          event_participants!event_id!inner(
            id,
            profile_id,
            role,
            invitation_status,
            profile:profiles!profile_id(id, full_name, avatar_url)
          )
        `)
        .single();

      if (error) throw error;

      if (event) {
        const eventWithRelations = event as unknown as EventWithRelations;
        await fetchEvents();
        return mapEventWithRelationsToEvent(eventWithRelations);
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]);

  const updateEventResponse = async (eventId: string, participantId: string, response: InvitationResponse) => {
    if (!user) {
      return { error: 'User not authenticated' };
    }

    try {
      const { error: updateError } = await supabase
        .from('event_participants')
        .update({ invitation_status: response })
        .eq('event_id', eventId)
        .eq('profile_id', participantId);

      if (updateError) throw updateError;

      await fetchEvents();
      return { success: true };
    } catch (err) {
      console.error('Error updating event response:', err);
      return { error: err instanceof Error ? err.message : 'Failed to update event response' };
    }
  };

  const updateEventStatus = useCallback(async (eventId: string, status: EventStatus) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const { data: event, error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId)
        .select(`
          id,
          event_type,
          status,
          scheduled_start_time,
          scheduled_end_time,
          created_at,
          updated_at,
          notes,
          location:locations(id, name, address),
          event_participants!event_id!inner(
            id,
            profile_id,
            role,
            invitation_status,
            profile:profiles!profile_id(id, full_name, avatar_url)
          )
        `)
        .single();

      if (error) throw error;

      if (event) {
        const eventWithRelations = event as unknown as EventWithRelations;
        await fetchEvents();
        return mapEventWithRelationsToEvent(eventWithRelations);
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event status';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventResponse,
    updateEventStatus,
    refreshEvents: fetchEvents,
  };
}