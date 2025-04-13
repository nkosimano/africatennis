import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { validateEventData, validateParticipants } from '../lib/validation';
import { supabase } from '../lib/supabase';

type Tables = Database['public']['Tables'];
type Events = Tables['events']['Row'];
type Locations = Tables['locations']['Row'];
type Profiles = Tables['profiles']['Row'];
type EventParticipants = Tables['event_participants']['Row'];

export type EventType = Database['public']['Enums']['event_type_enum'];
export type EventStatus = Database['public']['Enums']['event_status_enum'];
export type InvitationStatus = Database['public']['Enums']['invitation_status_enum'];
export type ParticipantRole = Database['public']['Enums']['participant_role_enum'];

export type Profile = Profiles;
export type Location = Locations;

export interface EventParticipantWithProfile extends Omit<EventParticipants, 'created_at'> {
  profile: Profile | null;
}

export interface Event extends Omit<Events, 'created_at' | 'updated_at'> {
  location: Location | null;
  participants: EventParticipantWithProfile[];
  creator?: Profile | null;
}

interface EventTableData {
  event_type: EventType;
  status?: EventStatus;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  location_id: string | null;
  location_details: string | null;
  notes: string | null;
}

interface Participant {
    profile_id: string;
    role: string;
}

interface ValidatedEventData extends EventTableData {
  created_by: string;
}

type EventParticipantResponse = {
  id: string;
  event_id: string;
  profile_id: string;
  role: string;
  invitation_status: InvitationStatus;
  profile: Pick<Profiles, 'full_name' | 'username'> | null;
};

type EventQueryResponse = {
  data: Event[] | null;
  error: PostgrestError | null;
};

type EventWithRelations = Events & {
  location: Location | null;
  event_participants: Array<EventParticipants & {
    profile: Profile | null;
  }>;
  profiles?: Profile | null;
};

type EventParticipantWithProfileResponse = EventParticipants & {
  profile: Profile | null;
};

interface ErrorResponse {
  message: string;
  code?: string;
  details?: string;
}

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorResponse).message === 'string'
  );
}

const mapEventWithRelationsToEvent = (event: EventWithRelations): Event => ({
  ...event,
  participants: event.event_participants.map(ep => ({
    ...ep,
    profile: ep.profile
  })),
  creator: event.profiles || null
});

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping events fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting events fetch for user:', user.id);
      
      // Ensure supabase client is initialized
      if (!supabase) {
        console.error('Supabase client is not initialized');
        throw new Error('Supabase client is not initialized');
      }
      
      // First, fetch the events with basic information
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('scheduled_start_time', { ascending: true });

      console.log('Events query response:', { eventsData, eventsError });

      if (eventsError) {
        console.error('Events query error:', eventsError);
        throw eventsError;
      }

      if (!eventsData || eventsData.length === 0) {
        console.log('No events found');
        setEvents([]);
        setLoading(false);
        return;
      }

      // Then, fetch the related data for each event
      const eventsWithRelations = await Promise.all(
        eventsData.map(async (event) => {
          // Fetch location
          const { data: locationData } = await supabase
            .from('locations')
            .select('*')
            .eq('id', event.location_id || '')
            .single();

          // Fetch participants with their profiles
          const { data: participantsData } = await supabase
            .from('event_participants')
            .select(`
              *,
              profile:profiles(*)
            `)
            .eq('event_id', event.id);

          return {
            ...event,
            location: locationData || null,
            participants: participantsData || []
          };
        })
      );

      console.log('Processed events with relations:', eventsWithRelations);
      setEvents(eventsWithRelations);
    } catch (err) {
      console.error('Error in fetchEvents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      console.log('No user in useEffect, skipping events fetch');
      setLoading(false);
      return;
    }
    console.log('Fetching events in useEffect for user:', user.id);
    fetchEvents();
  }, [user, fetchEvents]);

  /**
   * Creates a new event and adds participants.
   * @param eventData - Object containing details for the 'events' table (type, times, location, notes).
   * @param participants - Array of participant objects { profile_id, role }.
   * **Important:** The frontend calling this must ensure this array includes
   * the current user (creator) with the appropriate role (e.g., 'challenger')
   * and the opponent(s)/umpire as needed for the event type.
   */
  const createEvent = useCallback(async (eventData: Omit<Events, 'id' | 'created_at' | 'updated_at'>, participants: Omit<EventParticipants, 'id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const { data: event, error } = await supabase
        .from('events')
        .insert([{ ...eventData, organizer_id: user.id }])
        .select(`
          *,
          location:locations(*),
          event_participants(
            *,
            profile:profiles(*)
          )
        `)
        .single();

      if (error) throw error;

      if (event) {
        const eventWithRelations = event as EventWithRelations;
        const participantData = participants.map(p => ({
          ...p,
          event_id: eventWithRelations.id
        }));

        const { error: participantError } = await supabase
          .from('event_participants')
          .insert(participantData);

        if (participantError) throw participantError;

        await fetchEvents();
        return {
          ...eventWithRelations,
          location: eventWithRelations.location,
          participants: eventWithRelations.event_participants.map((participant: EventParticipantWithProfileResponse) => ({
            ...participant,
            profile: participant.profile
          }))
        } as Event;
      }
      return null;
    } catch (err) {
      const errorMessage = isErrorResponse(err) ? err.message : 'Failed to create event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Events>) => {
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
          *,
          location:locations(*),
          event_participants(
            *,
            profile:profiles(*)
          )
        `)
        .single();

      if (error) throw error;

      if (event) {
        const eventWithRelations = event as EventWithRelations;
        await fetchEvents();
        return {
          ...eventWithRelations,
          location: eventWithRelations.location,
          participants: eventWithRelations.event_participants.map((participant: EventParticipantWithProfileResponse) => ({
            ...participant,
            profile: participant.profile
          }))
        } as Event;
      }
      return null;
    } catch (err) {
      const errorMessage = isErrorResponse(err) ? err.message : 'Failed to update event';
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
      const errorMessage = isErrorResponse(err) ? err.message : 'Failed to delete event';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]);

  const updateEventResponse = async (eventId: string, participantId: string, response: InvitationStatus) => {
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
          *,
          location:locations(*),
          event_participants(
            *,
            profile:profiles(*)
          )
        `)
        .single();

      if (error) throw error;

      if (event) {
        const eventWithRelations = event as EventWithRelations;
        await fetchEvents();
        return {
          ...eventWithRelations,
          location: eventWithRelations.location,
          participants: eventWithRelations.event_participants.map((participant: EventParticipantWithProfileResponse) => ({
            ...participant,
            profile: participant.profile
          }))
        } as Event;
      }
      return null;
    } catch (err) {
      const errorMessage = isErrorResponse(err) ? err.message : 'Failed to update event status';
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
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventResponse,
    updateEventStatus,
    refreshEvents: fetchEvents,
  };
}