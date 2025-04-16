import { motion } from 'framer-motion';
import { Trophy, Award, Star, Crown, Target, Zap } from 'lucide-react';
import type { Achievement } from '../../hooks/usePlayerAchievements';

interface AchievementDisplayProps {
  achievements: Achievement[];
}

export function AchievementDisplay({ achievements }: AchievementDisplayProps) {
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

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'first_win':
        return Trophy;
      case 'ace_machine':
        return Star;
      case 'marathon_match':
        return Zap;
      case 'comeback_kid':
        return Crown;
      case 'consistent_player':
        return Target;
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
      variants={container}
      initial="hidden"
      animate="show"
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">Achievements</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const Icon = getAchievementIcon(achievement.achievement_type);
          const levelColor = getLevelColor(achievement.achievement_level);

          return (
            <motion.div
              key={achievement.id}
              variants={item}
              className="glass p-4 rounded-lg hover:bg-surface-hover transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${levelColor} bg-opacity-10`}>
                  <Icon className={levelColor} size={24} />
                </div>
                <div>
                  <p className="font-medium">{achievement.description}</p>
                  <p className="text-sm opacity-80 capitalize">
                    {achievement.achievement_level} Level
                  </p>
                </div>
              </div>
              <p className="text-sm opacity-80">
                Achieved on {new Date(achievement.achieved_at).toLocaleDateString()}
              </p>
            </motion.div>
          );
        })}

        {achievements.length === 0 && (
          <div className="col-span-full text-center py-8 opacity-80">
            <p>No achievements yet. Keep playing to earn badges!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}