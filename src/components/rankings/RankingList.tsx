import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import type { Ranking } from '../../hooks/useRankings';

interface RankingListProps {
  rankings: Ranking[];
  type: 'singles' | 'doubles';
}

export function RankingList({ rankings, type }: RankingListProps) {
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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-700" size={24} />;
      default:
        return <Award className="text-accent" size={24} />;
    }
  };

  const getDefaultAvatar = (name: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">
        {type === 'singles' ? 'Singles' : 'Doubles'} Rankings
      </h2>

      <div className="space-y-4">
        {rankings.map((ranking) => (
          <motion.div
            key={ranking.id}
            variants={item}
            className="flex items-center gap-4 p-4 glass rounded-lg"
          >
            <div className="flex items-center justify-center w-12">
              {getRankIcon(ranking.rank)}
            </div>

            <div className="flex items-center gap-3 flex-1">
              <img
                src={ranking.profile.avatar_url || getDefaultAvatar(ranking.profile.full_name)}
                alt={ranking.profile.full_name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{ranking.profile.full_name}</p>
                <p className="text-sm opacity-80">@{ranking.profile.username}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold">{ranking.points}</p>
              <p className="text-sm opacity-80">points</p>
            </div>
          </motion.div>
        ))}

        {rankings.length === 0 && (
          <p className="text-center opacity-80 py-8">No rankings available</p>
        )}
      </div>
    </motion.div>
  );
}