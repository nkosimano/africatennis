import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Player {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  is_favorite: boolean;
}

export function usePlayers() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPlayers([]);
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Fetch profiles directly instead of going through players table
        const { data: profiles, error: profilesError, status: profileStatus } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .neq('id', user.id);

        if (profilesError) {
          if (profileStatus === 403) throw new Error('You do not have access to player profiles.');
          throw profilesError;
        }

        // Optionally fetch favorite IDs for the current user
        const { data: favData, error: favError, status: favStatus } = await supabase
          .from('favorite_players')
          .select('profile_id')
          .eq('user_id', user.id);

        if (favError) {
          if (favStatus === 403) throw new Error('You do not have access to favorite players.');
          throw favError;
        }

        const favoriteIds = new Set((favData || []).map(f => f.profile_id));
        const playersWithFavorites = (profiles || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          username: profile.username || '',
          avatar_url: profile.avatar_url || '',
          is_favorite: favoriteIds.has(profile.id)
        })).sort((a, b) => a.full_name.localeCompare(b.full_name));

        setPlayers(playersWithFavorites);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setPlayers([]);
        setLoading(false);
      }
    })();
  }, [user]);

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
          .eq('profile_id', playerId);

        if (deleteError) throw deleteError;
      } else {
        // Add to favorites
        const { error: insertError } = await supabase
          .from('favorite_players')
          .insert([
            {
              user_id: user?.id || '',
              profile_id: playerId
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
      player.username?.toLowerCase().includes(searchLower)
    );
  };

  return {
    players,
    loading,
    error,
    toggleFavorite,
    searchPlayers,
    refresh: () => setLoading(true),
  };
}