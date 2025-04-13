export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  playing_style: string | null;
  preferred_hand: 'left' | 'right' | 'ambidextrous' | null;
  is_coach: boolean;
  coach_hourly_rate: number | null;
  coach_specialization: string | null;
  skill_level: string | null;
  location_id: string | null;
  current_ranking_points_singles: number;
  current_ranking_points_doubles: number;
  rating_status: 'Provisional' | 'Established';
  singles_matches_played: number;
  doubles_matches_played: number;
  singles_matches_won: number;
  doubles_matches_won: number;
  last_ranking_update: string;
  is_guest: boolean;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  home_latitude: number | null;
  home_longitude: number | null;
  home_location_description: string | null;
  search_radius_km: number;
} 