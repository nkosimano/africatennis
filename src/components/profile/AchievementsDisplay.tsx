import { motion } from 'framer-motion';
import { Trophy, Award, Star, Crown } from 'lucide-react';
import type { Achievement } from '../../hooks/usePlayerAchievements';

interface AchievementsDisplayProps {
  achievements: Achievement[];
}

export function AchievementsDisplay({ achievements }: AchievementsDisplayProps) {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'tournament_win':
        return Trophy;
      case 'skill_milestone':
        return Star;
      case 'ranking_milestone':
        return Crown;
      default:
        return Award;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'text-amber-700';
      case 'silver':
        return 'text-gray-400';
      case 'gold':
        return 'text-yellow-500';
      default:
        return 'text-accent';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">Achievements</h2>

      <div className="grid gap-4">
        {achievements.map((achievement) => {
          const Icon = getAchievementIcon(achievement.achievement_type);
          const levelColor = getLevelColor(achievement.achievement_level);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-4 glass rounded-lg"
            >
              <div className={`p-2 rounded-lg ${levelColor} bg-opacity-10`}>
                <Icon className={levelColor} size={24} />
              </div>
              <div>
                <p className="font-medium">{achievement.description}</p>
                <p className="text-sm opacity-80">
                  Achieved on {new Date(achievement.achieved_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          );
        })}

        {achievements.length === 0 && (
          <p className="text-center opacity-80 py-4">
            No achievements yet. Keep playing to earn badges and rewards!
          </p>
        )}
      </div>
    </motion.div>
  );
}