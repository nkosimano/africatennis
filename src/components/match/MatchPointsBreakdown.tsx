import { motion } from 'framer-motion';
import { Trophy, Star, Award, Target, X } from 'lucide-react';

interface MatchPointsBreakdownProps {
  breakdown: {
    participationPoints: number;
    acePoints: number;
    numAces: number;
    pointsPerAce: number;
    gamePoints: number;
    numGames: number;
    pointsPerGame: number;
    setPoints: number;
    numSets: number;
    pointsPerSet: number;
    winBonus: number;
    opponentStrengthModifier: number;
    totalPoints: number;
  };
  onClose: () => void;
}

export function MatchPointsBreakdown({
  breakdown,
  onClose,
}: MatchPointsBreakdownProps) {
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
          <h2 className="text-2xl font-bold">Points Breakdown</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-accent" />
                  <span>Participation Points</span>
                </div>
                <span className="font-bold">{breakdown.participationPoints}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-accent" />
                  <div>
                    <span>Serve Aces</span>
                    <p className="text-xs opacity-80">
                      {breakdown.numAces} × {breakdown.pointsPerAce}
                    </p>
                  </div>
                </div>
                <span className="font-bold">{breakdown.acePoints}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-accent" />
                  <div>
                    <span>Games Won</span>
                    <p className="text-xs opacity-80">
                      {breakdown.numGames} × {breakdown.pointsPerGame}
                    </p>
                  </div>
                </div>
                <span className="font-bold">{breakdown.gamePoints}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-accent" />
                  <div>
                    <span>Sets Won</span>
                    <p className="text-xs opacity-80">
                      {breakdown.numSets} × {breakdown.pointsPerSet}
                    </p>
                  </div>
                </div>
                <span className="font-bold">{breakdown.setPoints}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-accent" />
                  <span>Match Win Bonus</span>
                </div>
                <span className="font-bold">{breakdown.winBonus}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={20} className="text-accent" />
                  <span>Opponent Strength Modifier</span>
                </div>
                <span className="font-bold">
                  {breakdown.opponentStrengthModifier}x
                </span>
              </div>
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Points Earned</span>
              <span>{breakdown.totalPoints}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}