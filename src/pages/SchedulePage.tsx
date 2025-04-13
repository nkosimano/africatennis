import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader } from 'lucide-react';
import { EventsCalendar } from '../components/scheduling/EventsCalendar';
import { MatchScheduler } from '../components/scheduling/MatchScheduler';
import { TournamentCreateForm } from '../components/tournaments/TournamentCreateForm';
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
  const {
    availabilities,
    loading: availabilityLoading,
    error: availabilityError,
    addAvailability,
    updateAvailability,
    deleteAvailability,
  } = useAvailability();

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    createEvent,
    updateEventStatus,
    updateEventResponse,
    deleteEvent,
  } = useEvents();

  const {
    locations,
    loading: locationsLoading,
    error: locationsError
  } = useLocations();

  const {
    players,
    loading: playersLoading,
    error: playersError
  } = usePlayers();

  const [showScheduler, setShowScheduler] = useState(false);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleScheduleMatch = async (eventData: any, participants: any[]) => {
    const result = await createEvent(eventData, participants);
    if (result) {
      setShowScheduler(false);
      return { data: result, error: null };
    }
    return { data: null, error: 'Failed to create event' };
  };

  const handleScheduleTournament = async (eventData: any, participants: any[]) => {
    const result = await createEvent(eventData, participants);
    if (result) {
      setShowTournamentForm(false);
      return { data: result, error: null };
    }
    return { data: null, error: 'Failed to create event' };
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleEventResponse = async (status: 'accepted' | 'declined'): Promise<{ error: string | null }> => {
    if (!selectedEvent) return { error: 'No event selected' };
    const result = await updateEventResponse(selectedEvent.id, user?.id || '', status);
    if ('error' in result) {
      return { error: result.error ?? null };
    }
    setSelectedEvent(null);
    return { error: null };
  };

  const handleStatusUpdate = async (status: Event['status']): Promise<{ error: string | null }> => {
    if (!selectedEvent) return { error: 'No event selected' };
    const result = await updateEventStatus(selectedEvent.id, status);
    if (result) {
      setSelectedEvent(null);
      return { error: null };
    }
    return { error: 'Failed to update event status' };
  };

  const handleDeleteEvent = async (): Promise<{ error: string | null }> => {
    if (!selectedEvent) return { error: 'No event selected' };
    const success = await deleteEvent(selectedEvent.id);
    if (success) {
      setSelectedEvent(null);
      return { error: null };
    }
    return { error: 'Failed to delete event' };
  };

  const loading = availabilityLoading || eventsLoading || locationsLoading || playersLoading;
  const error = availabilityError || eventsError || locationsError || playersError;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div>
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
            onClick={() => setShowTournamentForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
          >
            <Plus size={20} className="flex-shrink-0" />
            <span>Create Tournament</span>
          </motion.button>

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
          events={events}
          onEventClick={handleEventClick}
        />

        <AvailabilityCalendar
          availabilities={availabilities}
          loading={availabilityLoading}
          onAdd={addAvailability}
          onUpdate={updateAvailability}
          onDelete={deleteAvailability}
        />
      </div>

      {showScheduler && (
        <MatchScheduler
          locations={locations}
          players={players}
          onSchedule={handleScheduleMatch}
          onClose={() => setShowScheduler(false)}
        />
      )}

      {showTournamentForm && (
        <TournamentCreateForm
          locations={locations}
          players={players}
          onSchedule={handleScheduleTournament}
          onClose={() => setShowTournamentForm(false)}
        />
      )}

      {selectedEvent && user && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRespond={handleEventResponse}
          onUpdateStatus={handleStatusUpdate}
          onDelete={handleDeleteEvent}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}