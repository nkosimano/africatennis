import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useFavoritePlayers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favoritePlayers', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { data, error, status } = await supabase
        .from('favorite_players')
        .select(`
          player:profile_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id);
      if (error) {
        if (status === 403) throw new Error('You do not have access to favorite players.');
        throw error;
      }
      return (data || []).map(item => item.player).filter(Boolean);
    },
    enabled: !!user
  });
}; 