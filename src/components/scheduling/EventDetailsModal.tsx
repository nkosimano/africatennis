import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  BarChart,
} from 'lucide-react';
import type { Event } from '../../hooks/useEvents';
import { ScoreInput } from '../scoring/ScoreInput';
import { useMatchStatistics } from '../../hooks/useMatchStatistics';
import EnhancedScoreBoard from '../scoring/EnhancedScoreBoard';
import { supabase } from '../../lib/supabase';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onRespond: (status: 'accepted' | 'declined') => Promise<{ error: string | null }>;
  onUpdateStatus: (status: Event['status']) => Promise<{ error: string | null }>;
  onDelete?: () => Promise<{ error: string | null }>;
  currentUserId: string;
  isSubmitting?: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
};

export function EventDetailsModal({
  event,
  onClose,
  onRespond,
  onUpdateStatus,
  onDelete,
  currentUserId,
  isSubmitting = false,
}: EventDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTennisScoreboard, setShowTennisScoreboard] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const { statistics } = useMatchStatistics(event.id);

  const currentUserParticipant = event.participants?.find(
    (p) => p.profile_id === currentUserId
  );

  const isOrganizer = currentUserParticipant?.role === 'organizer';
  // Check for umpire role - handle the case where it might not be in the database enum
  const isUmpire = currentUserParticipant?.role === 'umpire' || false;
  const isPending = event.status === 'pending_confirmation';
  const isScheduled = event.status === 'scheduled';
  const isInProgress = event.status === 'in_progress';
  const isCompleted = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const isRankedMatch = event.event_type?.includes('ranked') || false;
  const isTennisMatch = event.event_type?.includes('match_singles') || event.event_type?.includes('match_doubles');

  // Check if all participants have accepted
  const allParticipantsAccepted = event.participants?.every(
    p => p.invitation_status === 'accepted'
  );

  // Check if current user is a participant
  const isParticipant = event.participants.some(p => p.profile_id === currentUserId);

  // Check if this is a disputed match (based on notes field)
  const isDisputed = useMemo(() => {
    return event.notes?.startsWith('DISPUTE:') || false;
  }, [event.notes]);

  // Get team names for display
  const getTeamNames = () => {
    let teamA = 'Team A';
    let teamB = 'Team B';

    if (event.event_type?.includes('match_singles')) {
      const challenger = event.participants.find(p => p.role === 'challenger');
      const opponent = event.participants.find(p => p.role === 'opponent');

      if (challenger?.profile?.full_name) {
        teamA = challenger.profile.full_name;
      }

      if (opponent?.profile?.full_name) {
        teamB = opponent.profile.full_name;
      }
    } else if (event.event_type?.includes('match_doubles')) {
      const teamA1 = event.participants.find(p => p.role === 'player_team_a1');
      const teamA2 = event.participants.find(p => p.role === 'player_team_a2');
      const teamB1 = event.participants.find(p => p.role === 'player_team_b1');
      const teamB2 = event.participants.find(p => p.role === 'player_team_b2');

      if (teamA1?.profile?.full_name && teamA2?.profile?.full_name) {
        teamA = `${teamA1.profile.full_name} & ${teamA2.profile.full_name}`;
      }

      if (teamB1?.profile?.full_name && teamB2?.profile?.full_name) {
        teamB = `${teamB1.profile.full_name} & ${teamB2.profile.full_name}`;
      }
    }

    return { teamA, teamB };
  };

  // Find player information for tennis scoreboard
  const getPlayerInfo = () => {
    if (!event.participants || event.participants.length === 0) {
      return { playerA: 'Player A', playerB: 'Player B', playerAId: '', playerBId: '' };
    }

    let playerA = 'Player A';
    let playerB = 'Player B';
    let playerAId = '';
    let playerBId = '';

    // For singles matches
    if (event.event_type?.includes('match_singles')) {
      const challenger = event.participants.find(p => p.role === 'challenger');
      const opponent = event.participants.find(p => p.role === 'opponent');

      if (challenger?.profile?.full_name) {
        playerA = challenger.profile.full_name;
        playerAId = challenger.profile_id;
      }

      if (opponent?.profile?.full_name) {
        playerB = opponent.profile.full_name;
        playerBId = opponent.profile_id;
      }
    }
    // For doubles matches
    else if (event.event_type?.includes('match_doubles')) {
      const teamA1 = event.participants.find(p => p.role === 'player_team_a1');
      const teamA2 = event.participants.find(p => p.role === 'player_team_a2');
      const teamB1 = event.participants.find(p => p.role === 'player_team_b1');
      const teamB2 = event.participants.find(p => p.role === 'player_team_b2');

      const teamANames = [teamA1?.profile?.full_name, teamA2?.profile?.full_name]
        .filter(Boolean)
        .join(' & ');
      
      const teamBNames = [teamB1?.profile?.full_name, teamB2?.profile?.full_name]
        .filter(Boolean)
        .join(' & ');

      playerA = teamANames || 'Team A';
      playerB = teamBNames || 'Team B';
      playerAId = teamA1?.profile_id || '';
      playerBId = teamB1?.profile_id || '';
    }

    return { playerA, playerB, playerAId, playerBId };
  };

  // Get team names for display
  const { teamA, teamB } = useMemo(() => {
    return getTeamNames();
  }, [event.participants]);

  const canDelete = useMemo(() => {
    const isCreator = event.created_by === currentUserId;
    return isCreator || (isParticipant && ['scheduled', 'cancelled'].includes(event.status));
  }, [event, currentUserId, isParticipant]);

  const getStatusActions = () => {
    if (!isParticipant) return [];
    
    switch (event.status) {
      case 'scheduled':
        return [
          { label: 'Start Match', value: 'in_progress' },
          { label: 'Mark as Completed', value: 'completed' },
          { label: 'Cancel Match', value: 'cancelled' },
          { label: 'Report Dispute', value: 'disputed' }
        ];
      case 'cancelled':
        return [];
      case 'disputed':
        return [
          { label: 'Resolve as Completed', value: 'completed' },
          { label: 'Cancel Match', value: 'cancelled' }
        ];
      case 'in_progress':
        return [
          { label: 'Mark as Completed', value: 'completed' },
          { label: 'Cancel Match', value: 'cancelled' },
          { label: 'Report Dispute', value: 'disputed' }
        ];
      default:
        return [];
    }
  };

  const handleRespond = async (status: 'accepted' | 'declined') => {
    setLoading(true);
    setError(null);
    try {
      const { error: responseError } = await onRespond(status);
      if (responseError) {
        setError(getErrorMessage(responseError));
        setLoading(false);
      } else {
        onClose();
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: Event['status']) => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await onUpdateStatus(status);
      if (updateError) {
        setError(getErrorMessage(updateError));
        setLoading(false);
      } else {
        onClose();
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !onDelete) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this match? This action cannot be undone.'
    );
    
    if (confirmed) {
      setLoading(true);
      setError(null);
      try {
        const { error: deleteError } = await onDelete();
        if (deleteError) {
          setError(getErrorMessage(deleteError));
        } else {
          onClose();
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const formatEventType = (eventType: string | null | undefined) => {
    if (!eventType) return 'Event';
    return eventType.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const mapStatusToDbEnum = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending_confirmation': 'pending',
      'scheduled': 'confirmed',
      'in_progress': 'confirmed', // Use 'confirmed' for in-progress as well
      'completed': 'confirmed',   // Use 'confirmed' for completed
      'cancelled': 'canceled',    // Note: database uses 'canceled' (one 'l')
      'disputed': 'disputed'      // New value we're adding
    };
    return statusMap[status] || status;
  };

  const getStatusDisplay = useMemo(() => {
    // If notes indicate this is a disputed match
    if (isDisputed) return 'Disputed';
    
    // Map database status to display text
    switch(mapStatusToDbEnum(event.status)) {
      case 'pending': return 'Pending Confirmation';
      case 'confirmed': 
        // For confirmed status, check if it's actually completed based on scores
        if (event.notes?.includes('COMPLETED:')) return 'Completed';
        // Check if it's in progress based on notes
        if (event.notes?.includes('IN_PROGRESS:')) return 'In Progress';
        return 'Scheduled'; // Default for confirmed status
      case 'canceled': return 'Cancelled';
      case 'disputed': return 'Disputed';
      default: return event.status.charAt(0).toUpperCase() + event.status.slice(1).replace(/_/g, ' ');
    }
  }, [event.status, event.notes, isDisputed]);

  const getStatusColor = (status: string) => {
    // If notes indicate this is a disputed match
    if (isDisputed) return 'text-orange-500';
    
    // Map database status to colors
    switch(mapStatusToDbEnum(status)) {
      case 'pending': return 'text-blue-500';
      case 'confirmed': 
        // For confirmed status, check if it's actually completed based on scores
        if (event.notes?.includes('COMPLETED:')) return 'text-green-500';
        // Check if it's in progress based on notes
        if (event.notes?.includes('IN_PROGRESS:')) return 'text-yellow-500';
        return 'text-purple-500'; // Default for confirmed status
      case 'canceled': return 'text-red-500';
      case 'disputed': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const handleScoreSubmit = async (scores: {
    set_number: number;
    score_team_a: number;
    score_team_b: number;
    tiebreak_score_team_a?: number | null;
    tiebreak_score_team_b?: number | null;
    game_score_detail_json?: {
      games: Array<{
        winner: 'A' | 'B';
        game_number: number;
      }>;
    } | null;
  }): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('match_scores')
      .insert({
        ...scores,
        event_id: event.id,
        created_at: new Date().toISOString(),
        recorded_by: currentUserId,
        tiebreak_score_team_a: scores.tiebreak_score_team_a ?? null,
        tiebreak_score_team_b: scores.tiebreak_score_team_b ?? null,
        game_score_detail_json: scores.game_score_detail_json ?? null
      });
    if (error) {
      setError(typeof error === 'string' ? error : error.message);
    } else {
      setShowScoreInput(false);
      
      // After successfully adding the score, check if we should mark the match as completed
      if (isScheduled || isInProgress) {
        // Get updated list of scores including the new one
        const { data: scoresData, error: fetchError } = await supabase
          .from('match_scores')
          .select('set_number, score_team_a, score_team_b')
          .eq('event_id', event.id);
        
        if (fetchError) {
          setError(typeof fetchError === 'string' ? fetchError : fetchError.message);
        } else {
          const allScores = scoresData || [];
          
          const teamASets = allScores.filter(s => s.score_team_a > s.score_team_b).length;
          const teamBSets = allScores.filter(s => s.score_team_b > s.score_team_a).length;
          
          // If either team has won at least 2 sets (best of 3) in a tennis match, mark as completed
          if ((teamASets >= 2 || teamBSets >= 2) && isTennisMatch) {
            console.log('Match appears to be complete. Updating status to completed...');
            try {
              const { error: updateError } = await onUpdateStatus('completed');
              if (updateError) {
                console.error('Failed to auto-update match status:', updateError);
              } else {
                console.log('Successfully marked match as completed');
              }
            } catch (err) {
              console.error('Error while trying to mark match as completed:', err);
            }
          }
        }
      }
    }
    setLoading(false);
    return { error };
  };

  const { playerA, playerB, playerAId, playerBId } = getPlayerInfo();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        className="bg-background rounded-xl shadow-lg w-full max-w-2xl my-2 sm:my-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 sm:p-6">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-1 truncate">{formatEventType(event.event_type)}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${getStatusColor(event.status)} capitalize`}>
                  <p className="mb-0 text-xs sm:text-sm flex items-center">
                    <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${getStatusColor(event.status)}`}></span>
                    <span className={isDisputed ? 'text-orange-500 font-medium' : ''}>
                      {getStatusDisplay}
                    </span>
                  </p>
                </span>
                {event.created_by === currentUserId && (
                  <span className="text-sm text-muted-foreground">(Organizer)</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-surface rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={18} className="text-accent shrink-0" />
                <span className="text-sm sm:text-base truncate">
                  {event.scheduled_start_time ? format(new Date(event.scheduled_start_time), 'MMM d, yyyy') : 'Date not set'}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={18} className="text-accent shrink-0" />
                <span className="text-sm sm:text-base truncate">
                  {event.scheduled_start_time ? format(new Date(event.scheduled_start_time), 'h:mm a') : 'Time not set'}
                  {event.scheduled_end_time && ` - ${format(new Date(event.scheduled_end_time), 'h:mm a')}`}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={18} className="text-accent shrink-0" />
                  <span className="text-sm sm:text-base truncate">{event.location.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <Users size={18} className="text-accent shrink-0" />
                <span className="text-sm sm:text-base truncate">{event.participants?.length || 0} participants</span>
              </div>
            </div>

            {/* Score section */}
            {isTennisMatch && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <BarChart size={18} className="text-accent shrink-0" />
                  Live Scoring
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Link
                    to={`/scoring/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
                  >
                    <BarChart size={18} />
                    <span>Open Full-Screen Scoreboard</span>
                  </Link>
                </div>
                <p className="text-sm text-gray-500">Record points in real-time during the match</p>
              </div>
            )}

            {/* Score section */}
            {!isTennisMatch && !isPending && !isCancelled && !isDisputed && (
              <div className="mt-4 sm:mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold">Score</h3>
                  
                  {/* Regular Score Input Button */}
                  {(isUmpire || isOrganizer) && isInProgress && (
                    <button
                      onClick={() => setShowScoreInput(true)}
                      disabled={loading}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                    >
                      <Plus size={18} />
                      <span>Add Score</span>
                    </button>
                  )}
                </div>

                {/* Display scores */}
                {statistics.length > 0 ? (
                  <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No scores recorded yet.</div>
                ) : (
                  <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No scores recorded yet.</div>
                )}
              </div>
            )}

            {isInProgress && statistics.length > 0 && (
              <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No statistics recorded yet.</div>
            )}

            <div>
              <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Users size={18} className="text-accent shrink-0" />
                Participants
              </h3>
              <div className="space-y-2">
                {event.participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 sm:p-3 glass rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface flex items-center justify-center text-sm sm:text-base">
                        {participant.profile?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{participant.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs sm:text-sm opacity-80 capitalize">
                          {(participant.role || '').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium capitalize ${
                      participant.invitation_status === 'accepted'
                        ? 'text-green-500'
                        : participant.invitation_status === 'declined'
                        ? 'text-red-500'
                        : 'text-yellow-500'
                    }`}>
                      {participant.invitation_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {event.notes && (
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Notes</h3>
                <p className="text-xs sm:text-sm opacity-80">{event.notes}</p>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs sm:text-sm">{error}</p>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6 border-t border-border">
          <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
            {currentUserParticipant?.invitation_status === 'pending' && (
              <>
                <button
                  onClick={() => handleRespond('declined')}
                  disabled={loading}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-10 text-red-500 transition-colors text-sm sm:text-base"
                >
                  <XCircle size={18} />
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => handleRespond('accepted')}
                  disabled={loading}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                >
                  <CheckCircle size={18} />
                  <span>Accept</span>
                </button>
              </>
            )}

            {isOrganizer && isPending && !isRankedMatch && (
              <button
                onClick={() => handleStatusUpdate('scheduled')}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Confirm Event</span>
              </button>
            )}

            {isScheduled && allParticipantsAccepted && !isRankedMatch && (
              <>
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={loading || isSubmitting}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-10 text-red-500 transition-colors text-sm sm:text-base"
                >
                  <XCircle size={18} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={loading || isSubmitting}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                >
                  <CheckCircle size={18} />
                  <span>Start Match</span>
                </button>
              </>
            )}

            {isUmpire && isScheduled && isRankedMatch && allParticipantsAccepted && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Start Match</span>
              </button>
            )}

            {isUmpire && isInProgress && isRankedMatch && statistics.length >= 2 && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Complete Match</span>
              </button>
            )}

            {isOrganizer && isInProgress && !isRankedMatch && statistics.length >= 2 && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Complete Match</span>
              </button>
            )}

            {!isCompleted && !isDisputed && currentUserParticipant?.invitation_status === 'accepted' && (
              <button
                onClick={() => setShowDisputeForm(true)}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-500 hover:bg-opacity-10 text-orange-500 transition-colors text-sm sm:text-base"
              >
                <AlertCircle size={18} />
                <span>Report Dispute</span>
              </button>
            )}

            {isOrganizer && onDelete && !isCompleted && !isInProgress && !isDisputed && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || isSubmitting}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-10 text-red-500 transition-colors text-sm sm:text-base"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {showScoreInput && (
        <ScoreInput
          onSave={handleScoreSubmit}
          onClose={() => setShowScoreInput(false)}
          setNumber={1}
          teamAName={teamA}
          teamBName={teamB}
        />
      )}

      {/* Tennis Scoreboard Modal */}
      {showTennisScoreboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl mx-2 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Tennis Scoreboard</h3>
              <button
                onClick={() => setShowTennisScoreboard(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <EnhancedScoreBoard
              eventId={event.id}
              playerA={teamA}
              playerB={teamB}
              currentUserId={currentUserId}
              playerAId={playerAId || ''}
              playerBId={playerBId || ''}
              onClose={() => setShowTennisScoreboard(false)}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Dispute Form Modal */}
      {showDisputeForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full relative p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDisputeForm(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Report Match Dispute</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Please provide details about the issue with this match. This will mark the match as disputed and notify all participants.
            </p>
            
            <div className="mb-4">
              <label htmlFor="dispute-reason" className="block text-sm font-medium mb-1">
                Reason for dispute
              </label>
              <textarea
                id="dispute-reason"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                value={disputeReason}
                onChange={(e) => {
                  e.stopPropagation();
                  setDisputeReason(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Explain the issue with this match..."
                style={{ zIndex: 60 }}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDisputeForm(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!disputeReason.trim()) {
                    setError('Please provide a reason for the dispute');
                    return;
                  }
                  
                  setLoading(true);
                  try {
                    // Use the actual database enum value 'disputed' if available, otherwise fall back to 'canceled'
                    console.log('Setting match as disputed');
                    let statusToUse = 'disputed';
                    
                    // Try to update with 'disputed' first
                    const { error: statusError } = await onUpdateStatus(statusToUse);
                    
                    if (statusError) {
                      console.error('Error setting status to disputed:', statusError);
                      // Fall back to 'canceled' with a dispute note
                      statusToUse = 'canceled';
                      const { error: fallbackError } = await onUpdateStatus(statusToUse);
                      if (fallbackError) throw new Error(fallbackError);
                    }
                    
                    // Add dispute prefix to notes to mark this as a disputed match
                    console.log('Adding dispute note and metadata');
                    const { error: noteError } = await supabase
                      .from('events')
                      .update({ 
                        notes: `DISPUTE: ${disputeReason}\n\nReported by: ${currentUserParticipant?.profile?.full_name || 'A participant'} on ${new Date().toLocaleString()}`,
                        dispute_reported_by: currentUserId, 
                        dispute_reported_at: new Date().toISOString() 
                      })
                      .eq('id', event.id);
                    
                    if (noteError) throw new Error(noteError.message);
                    
                    setShowDisputeForm(false);
                    onClose(); // Close the modal to refresh the event details
                  } catch (err) {
                    console.error('Error reporting dispute:', err);
                    setError(getErrorMessage(err));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !disputeReason.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    Submit Dispute
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-xl p-4 sm:p-6 w-full max-w-md mx-2"
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Delete Event</h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 sm:px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <Trash2 size={18} />
                <span>Delete Event</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}