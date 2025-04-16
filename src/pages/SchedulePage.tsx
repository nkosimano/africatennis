import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EventsCalendar } from '../components/scheduling/EventsCalendar';
import { MatchScheduler } from '../components/scheduling/MatchScheduler';
import { EventDetailsModal } from '../components/scheduling/EventDetailsModal';
import { AvailabilityCalendar } from '../components/availability/AvailabilityCalendar';
import { useAvailability } from '../hooks/useAvailability';
import { useEvents } from '../hooks/useEvents';
import { useLocations } from '../hooks/useLocations';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../hooks/useEvents';

export function SchedulePage() {
  const { user } = useAuth();
  
  // Safely access availability data with defaults
  const {
    availabilities = [],
    loading: availabilityLoading = false,
    error: availabilityError = null,
    addAvailability = async () => ({ error: null }),
  } = useAvailability() || {};

  // Safely access events data with defaults
  const {
    events = [],
    loading: eventsLoading = false,
    error: eventsError = null,
    createEvent = async () => null,
    updateEventStatus = async () => false,
    updateEventResponse = async () => ({}),
    deleteEvent = async () => false,
    fetchEvent = async () => null,
    fetchEvents = async () => [],
  } = useEvents() || {};

  // Safely access locations data with defaults
  const {
    locations = [],
    loading: locationsLoading = false,
    error: locationsError = null
  } = useLocations() || {};

  // Safely access players data with defaults
  const {
    players = [],
    loading: playersLoading = false,
    error: playersError = null
  } = usePlayers() || {};

  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showAddFavorite] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  // Load event details when event ID is selected
  const fetchSelectedEvent = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      setIsLoadingEvent(true);
      console.log("Fetching event details for ID:", eventId);
      const eventData = await fetchEvent(eventId);
      console.log("Fetched event data:", eventData);
      
      if (eventData) {
        setSelectedEvent(eventData);
      } else {
        console.error("Failed to fetch event details for ID:", eventId);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setIsLoadingEvent(false);
    }
  };

  // When selectedEventId changes, fetch the event details
  useEffect(() => {
    if (selectedEventId) {
      fetchSelectedEvent(selectedEventId);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId]);

  const handleScheduleMatch = async (eventData: any, participants: any[]) => {
    try {
      console.log("Creating event with data:", { eventData, participants });
      const result = await createEvent(eventData, participants);
      if (result) {
        setShowScheduler(false);
        return { data: result, error: null };
      }
      // If result is null, log the error from useEvents
      console.error('Failed to create event:', { eventData, participants });
      return { data: null, error: 'Failed to create event (see console for details)' };
    } catch (err) {
      // Catch and log any unexpected errors
      console.error('Unexpected error in handleScheduleMatch:', err, { eventData, participants });
      return { data: null, error: err instanceof Error ? err.message : 'Unexpected error' };
    }
  };

  const handleEventClick = (event: Event) => {
    console.log("Event clicked:", event);
    setSelectedEventId(event.id);
  };

  const handleEventResponse = async (status: 'accepted' | 'declined'): Promise<{ error: string | null }> => {
    try {
      if (!selectedEvent) return { error: 'No event selected' };
      if (!user?.id) return { error: 'User not authenticated' };
      
      console.log("Updating event response:", { eventId: selectedEvent.id, userId: user.id, status });
      const result = await updateEventResponse(selectedEvent.id, user.id, status);
      
      if ('error' in result && result.error) {
        console.error("Error updating event response:", result.error);
        return { error: typeof result.error === 'string' ? result.error : 'Failed to update event response' };
      }
      
      setSelectedEvent(null);
      setSelectedEventId(null);
      return { error: null };
    } catch (error) {
      console.error("Unexpected error in handleEventResponse:", error);
      return { error: error instanceof Error ? error.message : 'Unexpected error' };
    }
  };

  const handleStatusUpdate = async (status: Event['status']): Promise<{ error: string | null }> => {
    try {
      if (!selectedEvent) return { error: 'No event selected' };
      
      console.log("Updating event status:", { eventId: selectedEvent.id, status });
      const result = await updateEventStatus(selectedEvent.id, status);
      
      if (result) {
        setSelectedEvent(null);
        setSelectedEventId(null);
        return { error: null };
      }
      
      return { error: 'Failed to update event status' };
    } catch (error) {
      console.error("Unexpected error in handleStatusUpdate:", error);
      return { error: error instanceof Error ? error.message : 'Unexpected error' };
    }
  };

  const handleDeleteEvent = async (): Promise<{ error: string | null }> => {
    try {
      if (!selectedEvent) return { error: 'No event selected' };
      
      console.log("Deleting event:", selectedEvent.id);
      const success = await deleteEvent(selectedEvent.id);
      
      if (success) {
        setSelectedEvent(null);
        setSelectedEventId(null);
        return { error: null };
      }
      
      return { error: 'Failed to delete event' };
    } catch (error) {
      console.error("Unexpected error in handleDeleteEvent:", error);
      return { error: error instanceof Error ? error.message : 'Unexpected error' };
    }
  };

  const loading = availabilityLoading || eventsLoading || locationsLoading || playersLoading || isLoadingEvent;
  const error = availabilityError || eventsError || locationsError || playersError;

  return (
    <div>
      {/* Debug info - remove in production */}
      <div className="bg-yellow-100 dark:bg-yellow-900 text-black dark:text-yellow-100 p-3 rounded text-sm mb-4">
        <details>
          <summary className="cursor-pointer font-semibold">Debug Info (Click to expand)</summary>
          <div className="mt-2 overflow-auto max-h-80 border-t pt-2">
            <div><b>User:</b> {user ? JSON.stringify({id: user.id}) : "No user"}</div>
            <div><b>Loading:</b> {String(loading)}</div>
            <div><b>Errors:</b> {error || "None"}</div>
            <div><b>Events count:</b> {events?.length || 0}</div>
            <div><b>Selected Event ID:</b> {selectedEventId || "None"}</div>
            <div><b>Selected Event loaded:</b> {selectedEvent ? "Yes" : "No"}</div>
          </div>
        </details>
      </div>

      {loading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      )}

      {!loading && error && (
        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg mb-6">
          <p>Error loading data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-accent text-white rounded hover:bg-opacity-90"
          >
            Reload Page
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Schedule</h1>
              <p className="text-base sm:text-lg opacity-80">Manage your availability and schedule matches</p>
            </motion.div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowScheduler(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
              >
                <Plus size={20} className="flex-shrink-0" />
                <span>Schedule Match</span>
              </motion.button>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6">
            <EventsCalendar
              events={events || []}
              onEventClick={handleEventClick}
            />

            <AvailabilityCalendar
              availabilities={availabilities || []}
              loading={availabilityLoading}
              onAdd={addAvailability}
            />
          </div>
        </>
      )}

      {showScheduler && (
        <MatchScheduler
          locations={locations || []}
          players={players || []}
          onSchedule={handleScheduleMatch}
          onClose={() => setShowScheduler(false)}
        />
      )}

      {selectedEventId && user && fetchEvent && (
        <EventDetailsModal
          event={selectedEvent || {} as Event}
          onClose={() => {
            setSelectedEvent(null);
            setSelectedEventId(null);
          }}
          onRespond={handleEventResponse}
          onUpdateStatus={handleStatusUpdate}
          onDelete={handleDeleteEvent}
          currentUserId={user.id}
          isOpen={!!selectedEventId}
          eventId={selectedEventId}
          fetchEvent={fetchEvent}
          setEvent={setSelectedEvent}
        />
      )}
    </div>
  );
}