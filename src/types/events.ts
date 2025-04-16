export type EventStatus = 
  | 'pending_confirmation'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type InvitationResponse = 'accepted' | 'declined';

export type EventResponse = {
  error: string | null;
  success?: boolean;
};

export type EventParticipant = {
  id: string;
  profile_id: string;
  role: 'challenger' | 'opponent' | 'player_team_a1' | 'player_team_a2' | 'player_team_b1' | 'player_team_b2' | 'student' | 'coach' | 'umpire' | 'witness' | 'organizer' | 'player';
  invitation_status: InvitationResponse;
  event_id: string;
  check_in_time: string | null;
  score_confirmation_status: 'pending' | 'confirmed' | 'disputed';
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    [key: string]: any;
  };
}; 