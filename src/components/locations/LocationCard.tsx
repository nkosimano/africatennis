import React from 'react';
import { MapPin, Users, Circle } from 'lucide-react';
import type { Location } from '../../hooks/useLocations';

interface LocationCardProps {
  location: Location;
  onSelect?: () => void;
  selected?: boolean;
}

export function LocationCard({ location, onSelect, selected }: LocationCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 glass rounded-lg transition-all ${
        selected 
          ? 'ring-2 ring-accent' 
          : 'hover:bg-surface-hover'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg mb-1">{location.name}</h3>
          <div className="flex items-center text-sm opacity-80 mb-2">
            <MapPin size={16} className="mr-1" />
            <span>{location.address}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {location.number_of_courts && (
          <div className="flex items-center">
            <Users size={16} className="text-accent mr-1" />
            <span>{location.number_of_courts} courts</span>
          </div>
        )}
        <div className="flex items-center">
          <Circle size={16} className="text-accent mr-1" />
          <span className="capitalize">{location.court_surface} surface</span>
        </div>
      </div>
    </button>
  );
}