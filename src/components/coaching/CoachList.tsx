import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import type { Profile } from '../../hooks/useProfile';

interface CoachListProps {
  coaches: Profile[];
  onBookSession: (coachId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: string | null;
  onClearLocation: () => void;
}

export function CoachList({ 
  coaches, 
  onBookSession, 
  searchQuery,
  onSearchChange,
  selectedLocation,
  onClearLocation
}: CoachListProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
            placeholder="Search coaches by name, specialization, or skill level..."
          />
        </div>
        {selectedLocation && (
          <div className="flex items-center gap-2 px-4 py-2 bg-accent bg-opacity-10 rounded-lg">
            <Filter size={20} className="text-accent" />
            <span className="text-sm font-medium">{selectedLocation}</span>
            <button
              onClick={onClearLocation}
              className="ml-2 hover:text-accent transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Coach Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {coaches.map((coach) => (
          <motion.div
            key={coach.id}
            variants={item}
            className="glass rounded-xl overflow-hidden hover:ring-2 hover:ring-accent transition-all"
          >
            {/* Coach Image */}
            <div className="aspect-video relative">
              <img
                src={coach.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${coach.full_name}`}
                alt={coach.full_name || 'Coach'}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <h3 className="text-white text-lg font-semibold">{coach.full_name}</h3>
                <p className="text-white/80 text-sm">@{coach.username}</p>
              </div>
            </div>

            {/* Coach Info */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={18} />
                  <span className="font-medium">Level {coach.skill_level}</span>
                </div>
                <div className="text-lg font-bold text-accent">
                  R{coach.coach_hourly_rate}/hr
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award className="text-accent" size={18} />
                <span className="text-sm line-clamp-1">
                  {coach.coach_specialization || 'General Training'}
                </span>
              </div>

              <p className="text-sm opacity-80 line-clamp-2 min-h-[2.5rem]">
                {coach.bio || 'No bio provided'}
              </p>

              <button
                onClick={() => onBookSession(coach.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <Calendar size={18} />
                <span>Book Session</span>
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {coaches.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg opacity-80">No coaches found matching your criteria</p>
        </div>
      )}
    </div>
  );
}