import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../hooks/usePlayerChallenges';

interface ChallengesDisplayProps {
  challenges: Challenge[];
  onUpdateProgress: (challengeId: string, progress: number) => Promise<{ error: string | null }>;
}

export function ChallengesDisplay({
  challenges,
  onUpdateProgress,
}: ChallengesDisplayProps) {
  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed);

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">Active Challenges</h2>

      <div className="space-y-6">
        {activeChallenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-4 rounded-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{challenge.description}</h3>
                <p className="text-sm opacity-80">
                  Ends on {new Date(challenge.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">{challenge.reward_points} pts</p>
                <p className="text-sm opacity-80">Reward</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{challenge.current_value} / {challenge.target_value}</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(challenge.current_value, challenge.target_value)} transition-all`}
                  style={{
                    width: `${Math.min(100, (challenge.current_value / challenge.target_value) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => onUpdateProgress(challenge.id, challenge.current_value + 1)}
                className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Update Progress
              </button>
            </div>
          </motion.div>
        ))}

        {activeChallenges.length === 0 && (
          <p className="text-center opacity-80 py-4">
            No active challenges. Check back later for new challenges!
          </p>
        )}
      </div>

      {completedChallenges.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Completed Challenges</h3>
          <div className="space-y-4">
            {completedChallenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 glass rounded-lg bg-opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium">{challenge.description}</p>
                    <p className="text-sm opacity-80">
                      Completed on {new Date(challenge.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-accent">+{challenge.reward_points} pts</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}