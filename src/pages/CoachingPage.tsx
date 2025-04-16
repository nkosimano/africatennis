import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { useLocations } from '../hooks/useLocations';
import { useCoaches } from '../hooks/useCoaches';
import { CoachList } from '../components/coaching/CoachList';
import { CoachingSessionForm } from '../components/coaching/CoachingSessionForm';
import type { Coach } from '../hooks/useCoaches';

export function CoachingPage() {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const { coaches, loading: coachesLoading } = useCoaches();
  const { locations } = useLocations();

  // Filter coaches based on search query and location
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = searchQuery.toLowerCase().trim() === '' ||
      coach.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.coach_specialization?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !selectedLocation || 
      (coach.preferred_locations && coach.preferred_locations.includes(selectedLocation));

    return matchesSearch && matchesLocation;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">Tennis Coaching</h1>

      {coachesLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <>
          <CoachList
            coaches={filteredCoaches}
            onCoachSelect={setSelectedCoach}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedLocation={selectedLocation}
            onClearLocation={() => setSelectedLocation(null)}
          />

          {selectedCoach && (
            <CoachingSessionForm
              coach={selectedCoach}
              locations={locations}
              onSchedule={async () => {
                // Handle session scheduling
                return { error: null };
              }}
              onClose={() => setSelectedCoach(null)}
            />
          )}
        </>
      )}
    </motion.div>
  );
}