import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Player {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  skill_level: number | null;
  is_coach: boolean;
  is_favorite?: boolean;
}

export function usePlayers() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchPlayers();
  }, [user]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure supabase client is initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // First, fetch all players except the current user
      const { data: allPlayers, error: playersError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .order('full_name');

      if (playersError) {
        throw new Error(
          playersError.message === 'Failed to fetch'
            ? 'Network error: Could not fetch players. Please check your internet connection.'
            : playersError.message
        );
      }

      // Then, fetch favorite players
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorite_players')
        .select('favorite_player_id')
        .eq('user_id', user?.id || '');

      if (favoritesError) {
        throw new Error(
          favoritesError.message === 'Failed to fetch'
            ? 'Network error: Could not fetch favorites. Please check your internet connection.'
            : favoritesError.message
        );
      }

      const favoriteIds = new Set(favorites?.map(f => f.favorite_player_id));

      // Combine the data
      const playersWithFavorites = allPlayers?.map(player => ({
        ...player,
        is_favorite: favoriteIds.has(player.id)
      })) || [];

      setPlayers(playersWithFavorites as Player[]);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (playerId: string) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return { error: 'Player not found' };

      if (player.is_favorite) {
        // Remove from favorites
        const { error: deleteError } = await supabase
          .from('favorite_players')
          .delete()
          .eq('user_id', user?.id || '')
          .eq('favorite_player_id', playerId);

        if (deleteError) throw deleteError;
      } else {
        // Add to favorites
        const { error: insertError } = await supabase
          .from('favorite_players')
          .insert([
            {
              user_id: user?.id || '',
              favorite_player_id: playerId
            }
          ]);

        if (insertError) throw insertError;
      }

      // Update local state
      setPlayers(players.map(p => 
        p.id === playerId 
          ? { ...p, is_favorite: !p.is_favorite }
          : p
      ));

      return { error: null };
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const searchPlayers = (query: string) => {
    if (!query) return players;
    
    const searchLower = query.toLowerCase();
    return players.filter(player => 
      player.full_name?.toLowerCase().includes(searchLower) ||
      player.username?.toLowerCase().includes(searchLower) ||
      player.skill_level?.toString().includes(searchLower)
    );
  };

  return {
    players,
    loading,
    error,
    toggleFavorite,
    searchPlayers,
    refresh: fetchPlayers,
  };
}