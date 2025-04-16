import { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  email: string;
  rating_status: 'Provisional' | 'Established';
  singles_matches_played: number;
  singles_matches_won: number;
  doubles_matches_played: number;
  doubles_matches_won: number;
};

export type EventParticipantTableData = Database['public']['Tables']['event_participants']['Row'] & {
  profile: Profile;
};

export type ParticipantRole = Database['public']['Enums']['participant_role_enum'];
export type InvitationStatus = Database['public']['Enums']['invitation_status_enum'];
export type ScoreConfirmationStatus = Database['public']['Enums']['confirmation_status_enum']; 