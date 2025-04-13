import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Search, UserPlus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../../hooks/usePlayers';

interface FavoritePlayersProps {
  players: Player[];
  onToggleFavorite: (playerId: string) => Promise<{ error: string | null }>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export function FavoritePlayers({
  players,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: FavoritePlayersProps) {
  const navigate = useNavigate();
  
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

  const favoritePlayers = players.filter(player => player.is_favorite);
  const nonFavoritePlayers = players.filter(player => !player.is_favorite);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/profile/${playerId}`);
  };

  const handleScheduleMatch = (e: React.MouseEvent, player: Player) => {
    e.stopPropagation(); // Prevent player profile navigation
    navigate('/schedule', { 
      state: { 
        selectedOpponent: player.id,
        selectedOpponentName: player.full_name 
      }
    });
  };

  if (players.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent bg-opacity-10 rounded-lg">
            <Users size={24} className="text-accent" />
          </div>
          <h2 className="text-xl font-bold">Players</h2>
        </div>
        <p className="text-center opacity-80 py-4">
          No players found. Try adjusting your search.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="glass rounded-xl p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent bg-opacity-10 rounded-lg">
            <Users size={24} className="text-accent" />
          </div>
          <h2 className="text-xl font-bold">Players</h2>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
            placeholder="Search players..."
          />
        </div>
      </div>

      {favoritePlayers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Favorites</h3>
          <div className="grid gap-4">
            {favoritePlayers.map((player) => (
              <motion.div
                key={player.id}
                variants={item}
                onClick={() => handlePlayerClick(player.id)}
                className="flex items-center justify-between p-3 sm:p-4 glass rounded-lg hover:bg-surface-hover transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                  <img
                    src={player.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${player.full_name}`}
                    alt={player.full_name || 'Player avatar'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.full_name}</p>
                    <p className="text-xs sm:text-sm opacity-80 truncate">
                      {player.username ? `@${player.username}` : 'No username'}
                      {player.skill_level && ` • Level ${player.skill_level}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleScheduleMatch(e, player)}
                    className="p-2 text-accent hover:bg-accent hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <Calendar size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(player.id);
                    }}
                    className="p-2 text-yellow-500 hover:bg-yellow-500 hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <Star size={20} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {nonFavoritePlayers.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">All Players</h3>
          <div className="grid gap-4">
            {nonFavoritePlayers.map((player) => (
              <motion.div
                key={player.id}
                variants={item}
                onClick={() => handlePlayerClick(player.id)}
                className="flex items-center justify-between p-3 sm:p-4 glass rounded-lg hover:bg-surface-hover transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                  <img
                    src={player.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${player.full_name}`}
                    alt={player.full_name || 'Player avatar'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.full_name}</p>
                    <p className="text-xs sm:text-sm opacity-80 truncate">
                      {player.username ? `@${player.username}` : 'No username'}
                      {player.skill_level && ` • Level ${player.skill_level}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleScheduleMatch(e, player)}
                    className="p-2 text-accent hover:bg-accent hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <Calendar size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(player.id);
                    }}
                    className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500 hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <UserPlus size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}