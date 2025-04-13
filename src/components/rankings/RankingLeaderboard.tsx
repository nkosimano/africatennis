import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Ranking } from '../../hooks/useRankings';

interface RankingLeaderboardProps {
  rankings: Ranking[];
  type: 'singles' | 'doubles';
  onPlayerClick: (playerId: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

export function RankingLeaderboard({
  rankings,
  type,
  onPlayerClick,
  searchQuery,
  onSearch,
}: RankingLeaderboardProps) {
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-700" size={24} />;
      default:
        return <Trophy className="text-accent" size={24} />;
    }
  };

  const getDefaultAvatar = (name: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Player')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const isNewPlayer = (joinedDate: string) => {
    const joined = new Date(joinedDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return joined > oneMonthAgo;
  };

  const getPointsChangeDisplay = (change: number) => {
    if (change === 0) return <Minus className="text-gray-400" size={16} />;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp size={16} className="mr-1" />
          <span>+{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-red-500">
        <TrendingDown size={16} className="mr-1" />
        <span>{change}</span>
      </div>
    );
  };

  // Get the most recent date from rankings
  const getMostRecentDate = () => {
    if (rankings.length === 0) return null;
    
    const dates = rankings.map(r => r.calculation_date);
    return dates.reduce((a, b) => a > b ? a : b);
  };

  const mostRecentDate = getMostRecentDate();

  // Filter rankings based on search query
  const filteredRankings = searchQuery
    ? rankings.filter(ranking => {
        const fullName = ranking.profile?.full_name?.toLowerCase() || '';
        const username = ranking.profile?.username?.toLowerCase() || '';
        const searchLower = searchQuery.toLowerCase();
        return fullName.includes(searchLower) || username.includes(searchLower);
      })
    : rankings;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="glass rounded-xl p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {type === 'singles' ? 'Singles' : 'Doubles'} ATR
        </h2>
        {mostRecentDate && (
          <div className="flex items-center text-sm opacity-80">
            <Calendar size={16} className="mr-1" />
            <span>Updated {formatDate(mostRecentDate)}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredRankings.map((ranking) => {
          try {
            const { profile } = ranking;
            if (!profile?.id) return null;
            
            const displayName = profile.full_name || `Player ${ranking.rank}`;
            const username = profile.username || '';
            const avatarUrl = profile.avatar_url || getDefaultAvatar(displayName);
            const isNew = isNewPlayer(profile.joined_date);

            return (
              <motion.div
                key={ranking.id}
                variants={item}
                onClick={() => onPlayerClick(profile.id)}
                className="flex items-center justify-between p-4 glass rounded-lg hover:bg-surface-hover transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(ranking.rank)}
                    <span className="font-bold">#{ranking.rank}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getDefaultAvatar(displayName);
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{displayName}</p>
                        {isNew && (
                          <span className="px-2 py-0.5 text-xs bg-accent text-white rounded-full">
                            New
                          </span>
                        )}
                        {profile.rating_status === 'Provisional' && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                            Provisional
                          </span>
                        )}
                      </div>
                      {username && <p className="text-sm opacity-80">@{username}</p>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-2xl font-bold">{ranking.points}</p>
                    {getPointsChangeDisplay(ranking.points_change)}
                  </div>
                  <p className="text-sm opacity-80">ATR points</p>
                </div>
              </motion.div>
            );
          } catch (error) {
            console.error('Error rendering ranking:', error);
            return null;
          }
        })}

        {filteredRankings.length === 0 && (
          <div className="text-center py-8 opacity-80">
            <p>No ATR ratings available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}