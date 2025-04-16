import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X, Info } from 'lucide-react';

interface PlacementMatchPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function PlacementMatchPrompt({
  onAccept,
  onDecline,
}: PlacementMatchPromptProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Trophy size={24} className="text-accent" />
            <h2 className="text-2xl font-bold">Placement Matches</h2>
          </div>
          <button
            onClick={onDecline}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-lg">
            Would you like to play 3 placement matches to better determine your initial rank?
          </p>

          <div className="glass rounded-lg p-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 text-sm text-accent hover:opacity-80 transition-opacity"
            >
              <Info size={16} />
              <span>What are placement matches?</span>
            </button>

            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm opacity-80"
              >
                <p className="mb-2">
                  Placement matches help us determine your initial skill level and ranking more accurately.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Play 3 matches against different opponents</li>
                  <li>Your performance will determine your starting rank</li>
                  <li>Matches are scheduled at your convenience</li>
                  <li>Results affect initial ranking only</li>
                </ul>
              </motion.div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onDecline}
              className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Start Placement Matches
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}