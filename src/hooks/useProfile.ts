import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';

export function useProfile(profileId: string | undefined) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [profileId, user]);

  const fetchProfile = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);

      // First check if the profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile not found, create it if it's the current user
          if (profileId === user?.id) {
            await createProfile();
            return;
          }
          setError('Profile not found');
        } else {
          console.error('Profile fetch error:', profileError);
          setError('Failed to fetch profile');
        }
        return;
      }

      if (!profileData) {
        if (profileId === user?.id) {
          await createProfile();
          return;
        }
        setError('Profile not found');
        return;
      }

      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) {
      setError('User must be authenticated to create profile');
      return;
    }

    try {
      // First check if the profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile as Profile);
        return;
      }

      const now = new Date().toISOString();
      const newProfile = {
        id: user.id,
        created_at: now,
        updated_at: now,
        email: user.email || '',
        username: user.email?.split('@')[0] || `player_${user.id.substring(0, 8)}`,
        full_name: user.user_metadata?.full_name || 'New Player',
        avatar_url: null,
        bio: null,
        playing_style: null,
        preferred_hand: null,
        is_coach: false,
        coach_hourly_rate: null,
        coach_specialization: null,
        skill_level: null,
        location_id: null,
        current_ranking_points_singles: 1000,
        current_ranking_points_doubles: 1000,
        rating_status: 'Provisional' as const,
        singles_matches_played: 0,
        doubles_matches_played: 0,
        singles_matches_won: 0,
        doubles_matches_won: 0,
        last_ranking_update: now,
        is_guest: false,
        date_of_birth: null,
        gender: null,
        home_latitude: null,
        home_longitude: null,
        home_location_description: null,
        search_radius_km: 25
      } satisfies Profile;

      const { data, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        if (createError.code === '23505') { // Unique violation
          // Profile might have been created by another request, try fetching it again
          await fetchProfile();
          return;
        }
        setError('Failed to create profile');
        return;
      }

      if (data) {
        setProfile(data as Profile);
        return;
      }

      setError('Failed to create profile');
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    if (!user) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      if (data) {
        setProfile(data);
        return { data, error: null };
      }

      return { data: null, error: 'Failed to update profile' };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update profile' };
    }
  };

  const isCurrentUser = user?.id === profileId;

  return {
    profile,
    loading,
    error,
    updateProfile,
    isCurrentUser,
    refresh: fetchProfile,
  };
}