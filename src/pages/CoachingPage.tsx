import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader, MapPin } from 'lucide-react';
import { CoachList } from '../components/coaching/CoachList';
import { CoachingSessionForm } from '../components/coaching/CoachingSessionForm';
import { useProfile } from '../hooks/useProfile';
import { useEvents } from '../hooks/useEvents';
import { useLocations } from '../hooks/useLocations';
import { useCoaches } from '../hooks/useCoaches';
import { useAuth } from '../contexts/AuthContext';
import type { Location } from '../hooks/useLocations';
import type { Coach } from '../hooks/useCoaches';

export function CoachingPage() {
  const { user } = useAuth();
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const { createEvent } = useEvents();
  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const { coaches, loading: coachesLoading, error: coachesError } = useCoaches();

  const filteredCoaches = coaches.filter(coach => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      coach.full_name?.toLowerCase().includes(searchLower) ||
      coach.coach_specialization?.toLowerCase().includes(searchLower) ||
      coach.skill_level?.toString().includes(searchLower);

    const matchesLocation = !selectedLocation || 
      coach.preferred_locations?.includes(selectedLocation.id);

    return matchesSearch && matchesLocation;
  });

  const handleBookSession = async (sessionData: any) => {
    try {
      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      const eventData = {
        event_type: 'coaching_session' as const,
        scheduled_start_time: sessionData.start_time.toISOString(),
        scheduled_end_time: new Date(sessionData.start_time.getTime() + 60 * 60 * 1000).toISOString(),
        location_id: sessionData.location_id,
        notes: sessionData.notes,
        actual_start_time: null,
        actual_end_time: null,
        created_by: profile.id,
        location_details: null,
        status: 'pending_confirmation' as const
      };

      const result = await createEvent(
        eventData,
        [
          { 
            profile_id: sessionData.coach_id, 
            role: 'coach' as const,
            invitation_status: 'pending' as const,
            score_confirmation_status: 'not_required' as const,
            check_in_time: null,
            event_id: '' // This will be set by the backend
          },
          { 
            profile_id: profile.id, 
            role: 'student' as const,
            invitation_status: 'pending' as const,
            score_confirmation_status: 'not_required' as const,
            check_in_time: null,
            event_id: '' // This will be set by the backend
          },
        ]
      );

      if (!result) {
        return { error: 'Failed to create event' };
      }
      return { error: null };
    } catch (err) {
      console.error('Book Session Error:', err);
      return { error: err instanceof Error ? err.message : 'An error occurred while booking the session' };
    }
  };

  const loading = profileLoading || locationsLoading || coachesLoading;
  const error = locationsError || coachesError;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="animate-spin text-accent mb-4" size={40} />
        <p className="text-lg opacity-80">Loading coaches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="glass p-6 rounded-xl max-w-md w-full text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Find a Coach</h1>
        <p className="text-lg opacity-80">Book a session with our experienced tennis coaches</p>
      </motion.div>

      {/* Location Filter Dropdown */}
      <div className="mb-8">
        <div className="relative w-full md:w-96">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedLocation?.id || ''}
            onChange={(e) => {
              const location = locations.find(l => l.id === e.target.value);
              setSelectedLocation(location || null);
            }}
            className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all appearance-none"
          >
            <option value="">All Locations</option>
            {locations.map((location) => {
              const coachCount = coaches.filter(c => 
                c.preferred_locations?.includes(location.id)
              ).length;
              
              return (
                <option key={location.id} value={location.id}>
                  {location.name} ({coachCount} {coachCount === 1 ? 'coach' : 'coaches'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <CoachList
        coaches={filteredCoaches}
        onBookSession={(coachId) => {
          const coach = coaches.find(c => c.id === coachId);
          if (coach) {
            setSelectedCoach(coach);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocation={selectedLocation?.name || null}
        onClearLocation={() => setSelectedLocation(null)}
      />

      {selectedCoach && (
        <CoachingSessionForm
          coach={selectedCoach}
          locations={locations}
          onSchedule={handleBookSession}
          onClose={() => setSelectedCoach(null)}
        />
      )}
    </div>
  );
}