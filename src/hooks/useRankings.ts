import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Ranking {
  id: string;
  profile_id: string;
  ranking_type: 'singles' | 'doubles';
  points: number;
  points_change: number;
  rank: number;
  calculation_date: string;
  profile: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
    rating_status: 'Provisional' | 'Established';
  };
}

export interface RankingHistory {
  id: string;
  profile_id: string;
  ranking_type: 'singles' | 'doubles';
  points: number;
  rank: number;
  calculation_date: string;
  points_change: number;
  profile: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

export function useRankings() {
  const [rankings, setRankings] = useState<{
    singles: Ranking[];
    doubles: Ranking[];
    lastUpdated: Date | null;
  }>({
    singles: [],
    doubles: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const initializeRankings = async () => {
    try {
      // Get all profiles 
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Create initial rankings for each profile
      for (const profile of profiles) {
        try {
          // Try to use stored procedure if it exists
          const { error: ratingError } = await supabase.rpc('calculate_initial_rating', {
            p_player_id: profile.id
          } as any);
          
          if (ratingError) {
            // If the function doesn't exist, create default rankings directly in the database
            console.log(`Creating default rankings for profile ${profile.id}`);
            
            // Create a singles ranking record with default values
            const { error: singlesError } = await supabase
              .from('ranking_history')
              .insert({
                profile_id: profile.id,
                ranking_type: 'singles',
                points: 1200, // Default starting ELO rating
                rank: 0, // Will be calculated later
                calculation_date: new Date().toISOString(),
                points_change: 0
              });
              
            if (singlesError) console.error('Error creating singles ranking:', singlesError);
            
            // Create a doubles ranking record with default values
            const { error: doublesError } = await supabase
              .from('ranking_history')
              .insert({
                profile_id: profile.id,
                ranking_type: 'doubles',
                points: 1200, // Default starting ELO rating
                rank: 0, // Will be calculated later
                calculation_date: new Date().toISOString(),
                points_change: 0
              });
              
            if (doublesError) console.error('Error creating doubles ranking:', doublesError);
          }
        } catch (err) {
          console.error('Error initializing ratings for profile:', profile.id, err);
        }
      }
    } catch (error) {
      console.error('Error initializing rankings:', error);
      throw new Error('Failed to initialize rankings');
    }
  };

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rankingsError } = await supabase
        .from('ranking_history')
        .select(`
          id,
          profile_id,
          ranking_type,
          points,
          rank,
          calculation_date,
          points_change,
          profile:profiles!ranking_history_profile_id_fkey (
            id,
            full_name,
            username,
            avatar_url,
            created_at
          )
        `)
        .order('calculation_date', { ascending: false })
        .limit(100);

      if (rankingsError) throw rankingsError;

      if (data) {
        // Separate singles and doubles rankings
        const singles = data
          .filter((r: any) => r.ranking_type === 'singles')
          .map((r: any) => ({
            ...r,
            profile: r.profile ? {
              id: r.profile.id,
              full_name: r.profile.full_name,
              username: r.profile.username,
              avatar_url: r.profile.avatar_url,
              created_at: r.profile.created_at,
              rating_status: 'Provisional' as const
            } : null
          })) as Ranking[];

        const doubles = data
          .filter((r: any) => r.ranking_type === 'doubles')
          .map((r: any) => ({
            ...r,
            profile: r.profile ? {
              id: r.profile.id,
              full_name: r.profile.full_name,
              username: r.profile.username,
              avatar_url: r.profile.avatar_url,
              created_at: r.profile.created_at,
              rating_status: 'Provisional' as const
            } : null
          })) as Ranking[];

        setRankings({
          singles,
          doubles,
          lastUpdated: new Date()
        });
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching rankings');
    } finally {
      setLoading(false);
    }
  };

  return {
    rankings,
    loading,
    error,
    initializeRankings,
    fetchRankings,
  };
}