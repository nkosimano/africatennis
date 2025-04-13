import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { LocationCard } from './LocationCard';
import type { Location } from '../../hooks/useLocations';

interface LocationsListProps {
  locations: Location[];
  loading: boolean;
  error: string | null;
  selectedLocationId?: string;
  onLocationSelect?: (location: Location) => void;
}

export function LocationsList({
  locations,
  loading,
  error,
  selectedLocationId,
  onLocationSelect,
}: LocationsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center opacity-80 py-8">
        <p>No locations available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-4"
    >
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          selected={location.id === selectedLocationId}
          onSelect={() => onLocationSelect?.(location)}
        />
      ))}
    </motion.div>
  );
}