import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, Circle, Clock } from 'lucide-react';
import type { Event } from '../../hooks/useEvents';

interface PlacementMatchTrackerProps {
  matches: Event[];
  onScheduleMatch: () => void;
}

export function PlacementMatchTracker({
  matches,
  onScheduleMatch,
}: PlacementMatchTrackerProps) {
  const completedMatches = matches.filter(match => match.status === 'completed');
  const pendingMatches = matches.filter(match => match.status === 'pending_confirmation');
  const remainingMatches = 3 - (completedMatches.length + pendingMatches.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-accent" />
        <div>
          <h2 className="text-xl font-bold">Placement Matches</h2>
          <p className="text-sm opacity-80">
            Complete 3 matches to determine your initial ranking
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress Indicators */}
        <div className="flex justify-between items-center">
          {[1, 2, 3].map((matchNumber) => {
            const isCompleted = completedMatches.length >= matchNumber;
            const isPending = !isCompleted && pendingMatches.length >= matchNumber;

            return (
              <div
                key={matchNumber}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-accent text-primary'
                      : isPending
                      ? 'bg-yellow-500 bg-opacity-20 text-yellow-500'
                      : 'bg-surface'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={24} />
                  ) : isPending ? (
                    <Clock size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </div>
                <span className="text-sm font-medium">Match {matchNumber}</span>
              </div>
            );
          })}
        </div>

        {/* Match List */}
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="glass p-4 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {match.status === 'completed' ? (
                    <CheckCircle size={20} className="text-accent" />
                  ) : (
                    <Clock size={20} className="text-yellow-500" />
                  )}
                  <span className="font-medium">
                    vs {match.participants?.[1]?.profile.full_name}
                  </span>
                </div>
                <span className="text-sm opacity-80 capitalize">
                  {match.status.replace(/_/g, ' ')}
                </span>
              </div>
              {match.location && (
                <p className="text-sm opacity-80">
                  at {match.location.name}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        {remainingMatches > 0 && (
          <button
            onClick={onScheduleMatch}
            className="w-full px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Schedule Next Match
          </button>
        )}

        {remainingMatches === 0 && completedMatches.length === 3 && (
          <div className="text-center text-success">
            <p>All placement matches completed!</p>
            <p className="text-sm">Your initial ranking will be calculated soon.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}