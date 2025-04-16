import type { Database } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  email: string;
  rating_status: 'Provisional' | 'Established';
  singles_matches_played: number;
  singles_matches_won: number;
  doubles_matches_played: number;
  doubles_matches_won: number;
  // Removed fields not present in DB: is_guest, date_of_birth, gender, home_latitude, home_longitude, home_location_description, search_radius_km
  // Note: last_ranking_update is also not present in this type, as intended
}

export type Event = Database['public']['Tables']['events']['Row'] & {
  participants: EventParticipantWithProfile[]
  location?: Database['public']['Tables']['locations']['Row']
}

export type EventParticipantWithProfile = Database['public']['Tables']['event_participants']['Row'] & {
  profile: Profile
}

export type Tournament = Database['public']['Tables']['tournaments']['Row']
export type TournamentParticipant = Database['public']['Tables']['tournament_participants']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchScore = Database['public']['Tables']['match_scores']['Row']
export type MatchDispute = Database['public']['Tables']['match_disputes']['Row']
export type SystemSettings = Database['public']['Tables']['system_settings']['Row']

export type PaymentMethod = {
  id: string
  user_id: string
  last_four: string
  card_type: string
  created_at: string
}

export type VoucherRedemption = {
  id: string
  voucher_id: string
  user_id: string
  redeemed_at: string
}

export type Voucher = {
  id: string
  code: string
  description: string
  amount_zar: number
  is_percentage: boolean
  expires_at: string | null
  created_at: string
}

export type Challenge = {
  id: string
  player_id: string
  challenge_type: string
  description: string
  target_value: number
  current_value: number | null
  start_date: string
  end_date: string
  completed: boolean | null
  reward_points: number | null
  created_at: string | null
}

export type SkillHistoryEntry = {
  id: string
  player_id: string
  old_skill_level: number | null
  new_skill_level: number
  reason: string | null
  changed_at: string | null
}

export type RankingHistoryEntry = {
  id: string
  profile_id: string
  ranking_type: 'singles' | 'doubles'
  rank: number
  points: number
  calculation_date: string
  created_at: string
  related_event_id: string | null
} 