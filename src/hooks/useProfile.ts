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

      // Select all relevant columns for Profile, including those needed for derived fields
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
          setError('Profile not found. Please contact support if this is unexpected.');
        } else {
          console.error('Profile fetch error:', profileError);
          setError('An unexpected error occurred while fetching the profile.');
        }
        return;
      }

      if (!profileData) {
        if (profileId === user?.id) {
          await createProfile();
          return;
        }
        setError('Profile not found. Please contact support if this is unexpected.');
        return;
      }

      // Compute derived and fallback fields for Profile
      const singles_matches_played = profileData.singles_matches_played ?? 0;
      const singles_matches_won = profileData.singles_matches_won ?? 0;
      const doubles_matches_played = profileData.doubles_matches_played ?? 0;
      const doubles_matches_won = profileData.doubles_matches_won ?? 0;
      const rating_status = profileData.rating_status ?? 'Provisional';
      const email = profileData.email ?? '';
      const full_name = profileData.full_name ?? 'Unnamed Player';
      const username = profileData.username ?? 'unknown';
      const avatar_url = profileData.avatar_url ?? null;
      const bio = profileData.bio ?? null;
      const playing_style = profileData.playing_style ?? null;
      const preferred_hand = profileData.preferred_hand ?? null;
      const is_coach = profileData.is_coach ?? false;
      const coach_hourly_rate = profileData.coach_hourly_rate ?? null;
      const coach_specialization = profileData.coach_specialization ?? null;
      const skill_level = profileData.skill_level ?? null;
      const location_id = profileData.location_id ?? null;
      const current_ranking_points_singles = profileData.current_ranking_points_singles ?? 1000;
      const current_ranking_points_doubles = profileData.current_ranking_points_doubles ?? 1000;
      const last_ranking_update = profileData.last_ranking_update ?? null;
      // Removed field not present in DB: is_guest
      const created_at = profileData.created_at ?? '';
      const updated_at = profileData.updated_at ?? '';

      const fullProfile: Profile = {
        ...profileData,
        singles_matches_played,
        singles_matches_won,
        doubles_matches_played,
        doubles_matches_won,
        rating_status,
        email,
        full_name,
        username,
        avatar_url,
        bio,
        playing_style,
        preferred_hand,
        is_coach,
        coach_hourly_rate,
        coach_specialization,
        skill_level,
        location_id,
        current_ranking_points_singles,
        current_ranking_points_doubles,
        last_ranking_update,
        // Removed field not present in DB: is_guest
        created_at,
        updated_at,
      };
      setProfile(fullProfile);
      // Optionally: Add analytics logging or test coverage here
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
      // Log the user object for RLS debugging
      console.log('user for profile creation:', user);
      // First check if the profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Compute derived fields for Profile
        const singles_matches_played = existingProfile.singles_matches_played ?? 0;
        const singles_matches_won = existingProfile.singles_matches_won ?? 0;
        const doubles_matches_played = existingProfile.doubles_matches_played ?? 0;
        const doubles_matches_won = existingProfile.doubles_matches_won ?? 0;
        const rating_status = existingProfile.rating_status ?? 'Provisional';
        const email = existingProfile.email ?? '';
        setProfile({ ...existingProfile, singles_matches_played, singles_matches_won, doubles_matches_played, doubles_matches_won, rating_status, email });
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
        search_radius_km: 50,
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
        // Compute derived fields for Profile
        const singles_matches_played = data.singles_matches_played ?? 0;
        const singles_matches_won = data.singles_matches_won ?? 0;
        const doubles_matches_played = data.doubles_matches_played ?? 0;
        const doubles_matches_won = data.doubles_matches_won ?? 0;
        const rating_status = data.rating_status ?? 'Provisional';
        const email = data.email ?? '';
        setProfile({ ...data, singles_matches_played, singles_matches_won, doubles_matches_played, doubles_matches_won, rating_status, email });
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