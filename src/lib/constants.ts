export const EVENT_STATUS = {
  PENDING: 'pending_confirmation',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
} as const;

export const EVENT_TYPE = {
  SINGLES_FRIENDLY: 'match_singles_friendly',
  SINGLES_RANKED: 'match_singles_ranked',
  DOUBLES_FRIENDLY: 'match_doubles_friendly',
  DOUBLES_RANKED: 'match_doubles_ranked',
  COACHING: 'coaching_session',
  HITTING: 'hitting_session',
  TOURNAMENT: 'tournament_match'
} as const;

export const PARTICIPANT_ROLE = {
  CHALLENGER: 'challenger',
  OPPONENT: 'opponent',
  UMPIRE: 'umpire',
  COACH: 'coach',
  STUDENT: 'student'
} as const;

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined'
} as const;

export const SCORE_CONFIRMATION_STATUS = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DISPUTED: 'disputed'
} as const;