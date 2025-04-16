import { useState, useEffect } from 'react';
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
import type { EventStatus, InvitationResponse, EventResponse } from '../../types/events';
import { ScoreInput } from '../scoring/ScoreInput';

// If you need to use supabase, use: import { supabase } from '../../lib/supabase';
// If you need statistics, use: const { statistics } = useMatchStatistics(event.id);
// If you need EnhancedScoreBoard, import it at the top.

// import { useMatchStatistics } from '../../hooks/useMatchStatistics';
// import EnhancedScoreBoard from '../scoring/EnhancedScoreBoard';
// import { supabase } from '../../lib/supabase';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onRespond: (status: InvitationResponse) => Promise<EventResponse>;
  onUpdateStatus: (status: EventStatus) => Promise<EventResponse>;
  onDelete?: () => Promise<EventResponse>;
  currentUserId: string;
  // isSubmitting = false,
  isOpen?: boolean;
  eventId?: string;
  fetchEvent?: (eventId: string) => Promise<Event | null>;
  setLoading?: (loading: boolean) => void;
  setEvent?: (event: Event) => void;
}

// import { getErrorMessage } from '../../utils/errors';

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

const getStatusDisplay = (eventStatus: string | null | undefined, eventNotes: string | null | undefined) => {
  if (!eventStatus) return 'Unknown Status';
  
  if (eventStatus === 'disputed') return 'Disputed';
  if (mapStatusToDbEnum(eventStatus) === 'pending') return 'Pending Confirmation';
  if (mapStatusToDbEnum(eventStatus) === 'confirmed') {
    if (eventNotes?.includes('COMPLETED:')) return 'Completed';
    if (eventNotes?.includes('IN_PROGRESS:')) return 'In Progress';
    return 'Scheduled';
  }
  if (mapStatusToDbEnum(eventStatus) === 'canceled') return 'Cancelled';
  if (mapStatusToDbEnum(eventStatus) === 'disputed') return 'Disputed';
  
  return eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1).replace(/_/g, ' ');
};

const getStatusColor = (status: string | null | undefined, isDisputed: boolean) => {
  if (isDisputed) return 'text-orange-500';
  if (!status) return 'text-gray-500';
  
  switch(mapStatusToDbEnum(status)) {
    case 'pending': return 'text-blue-500';
    case 'confirmed': 
      if (status === 'completed') return 'text-green-500';
      if (status === 'in_progress') return 'text-yellow-500';
      return 'text-purple-500'; 
    case 'canceled': return 'text-red-500';
    case 'disputed': return 'text-orange-500';
    default: return 'text-gray-500';
  }
};

export function EventDetailsModal({
  event,
  onClose,
  onRespond,
  onUpdateStatus,
  onDelete,
  currentUserId,
  isOpen,
  eventId,
  fetchEvent,
  setLoading,
  setEvent,
  // isSubmitting = false,
}: EventDetailsModalProps) {
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    if (isOpen && eventId && fetchEvent && setLoading && setEvent) {
      // Use the new fetchEvent function for more reliable participant loading
      const loadEventDetails = async () => {
        try {
          setLoading(true);
          const eventData = await fetchEvent(eventId);
          if (eventData) {
            console.log('Loaded event details with participants:', eventData);
            setEvent(eventData);
          } else {
            console.error('Failed to load event details');
            onClose();
          }
        } catch (error) {
          console.error('Error loading event details:', error);
          onClose();
        } finally {
          setLoading(false);
        }
      };
      
      loadEventDetails();
    }
  }, [isOpen, eventId, fetchEvent, setLoading, setEvent, onClose]);

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
  const isParticipant = Array.isArray(event.participants) && event.participants.some(p => p.profile_id === currentUserId);

  // Check if this is a disputed match (based on notes field)
  const isDisputed = event.notes?.startsWith('DISPUTE:') || false;

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
      // let teamA1 = event.participants.find(p => p.role === 'player_team_a1');
      // let teamB1 = event.participants.find(p => p.role === 'player_team_b1');

      if (event.participants.find(p => p.role === 'player_team_a1')?.profile?.full_name) {
        teamA = event.participants.find(p => p.role === 'player_team_a1')?.profile?.full_name ?? '';
      }

      if (event.participants.find(p => p.role === 'player_team_b1')?.profile?.full_name) {
        teamB = event.participants.find(p => p.role === 'player_team_b1')?.profile?.full_name ?? '';
      }
    }

    return { teamA, teamB };
  };

  // Find player information for tennis scoreboard
  const getPlayerInfo = () => {
    if (!event.participants || event.participants.length === 0) {
      return;
    }

    // For singles matches
    if (event.event_type?.includes('match_singles')) {
      const challenger = event.participants.find(p => p.role === 'challenger');
      const opponent = event.participants.find(p => p.role === 'opponent');

      if (challenger?.profile?.full_name) {
      }

      if (opponent?.profile?.full_name) {
      }
    }
    // For doubles matches
    else if (event.event_type?.includes('match_doubles')) {
      // let teamA1 = event.participants.find(p => p.role === 'player_team_a1');
      // let teamB1 = event.participants.find(p => p.role === 'player_team_b1');

    }
  };

  // Get team names for display
  // const { teamA, teamB } = getTeamNames();
  getPlayerInfo();

  const canDelete = event.created_by === currentUserId || (isParticipant && ['scheduled', 'cancelled'].includes(event.status));

  const handleRespond = async (status: InvitationResponse) => {
    try {
      const { error: responseError } = await onRespond(status);
      if (responseError) {
        // setError(getErrorMessage(responseError));
      } else {
        onClose();
      }
    } catch (err) {
      // setError(getErrorMessage(err));
    }
  };

  const handleStatusUpdate = async (status: EventStatus) => {
    try {
      const { error: updateError } = await onUpdateStatus(status);
      if (updateError) {
        // setError(getErrorMessage(updateError));
      } else {
        onClose();
      }
    } catch (err) {
      // setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !onDelete) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this match? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        const { error: deleteError } = await onDelete();
        if (deleteError) {
          // setError(getErrorMessage(deleteError));
        } else {
          onClose();
        }
      } catch (err) {
        // setError(getErrorMessage(err));
      }
    }
  };

  const formatEventType = (eventType: string | null | undefined) => {
    if (!eventType) return 'Event';
    return eventType.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleScoreSubmit = async (): Promise<EventResponse> => {
    // Score submission logic removed (no-op)
    return { error: null };
  };

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
                <span className={`text-sm font-medium ${getStatusColor(event.status, isDisputed)} capitalize`}>
                  <p className="mb-0 text-xs sm:text-sm flex items-center">
                    <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${getStatusColor(event.status, isDisputed)}`}></span>
                    <span className={isDisputed ? 'text-orange-500 font-medium' : ''}>
                      {getStatusDisplay(event.status, event.notes)}
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
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                    >
                      <Plus size={18} />
                      <span>Add Score</span>
                    </button>
                  )}
                </div>

                {/* Display scores */}
                <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No scores recorded yet.</div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Users size={18} className="text-accent shrink-0" />
                Participants
              </h3>
              <div className="space-y-2">
                {event.participants && event.participants.length > 0 ? (
                  <>
                    {/* Debug information */}
                    <div className="text-xs text-gray-500 mb-2">
                      {event.participants.length} participant(s) found | 
                      Roles: {event.participants.map(p => p.role).join(', ')}
                    </div>
                    
                    {event.participants.map((participant) => (
                      <div
                        key={participant.id || participant.profile_id}
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
                            <p className="text-xs opacity-60">
                              Profile ID: {participant.profile_id?.substring(0, 6)}...
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
                  </>
                ) : (
                  <div className="text-sm text-gray-500 p-2">
                    No participants found. This may be due to a data loading issue.
                  </div>
                )}
              </div>
            </div>

            {event.notes && (
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Notes</h3>
                <p className="text-xs sm:text-sm opacity-80">{event.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6 border-t border-border">
          <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
            {currentUserParticipant?.invitation_status === 'pending' && (
              <>
                <button
                  onClick={() => handleRespond('declined')}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-10 text-red-500 transition-colors text-sm sm:text-base"
                >
                  <XCircle size={18} />
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => handleRespond('accepted')}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                >
                  <CheckCircle size={18} />
                  <span>Accept</span>
                </button>
              </>
            )}

            {isOrganizer && isPending && !isRankedMatch && (
              <button
                onClick={() => handleStatusUpdate('scheduled' as EventStatus)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Confirm Event</span>
              </button>
            )}

            {isScheduled && allParticipantsAccepted && !isRankedMatch && (
              <>
                <button
                  onClick={() => handleStatusUpdate('cancelled' as EventStatus)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-10 text-red-500 transition-colors text-sm sm:text-base"
                >
                  <XCircle size={18} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => handleStatusUpdate('in_progress' as EventStatus)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                >
                  <CheckCircle size={18} />
                  <span>Start Match</span>
                </button>
              </>
            )}

            {isUmpire && isScheduled && isRankedMatch && allParticipantsAccepted && (
              <button
                onClick={() => handleStatusUpdate('in_progress' as EventStatus)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Start Match</span>
              </button>
            )}

            {isUmpire && isInProgress && isRankedMatch && (
              <button
                onClick={() => handleStatusUpdate('completed' as EventStatus)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Complete Match</span>
              </button>
            )}

            {isOrganizer && isInProgress && !isRankedMatch && (
              <button
                onClick={() => handleStatusUpdate('completed' as EventStatus)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors text-sm sm:text-base"
              >
                <CheckCircle size={18} />
                <span>Complete Match</span>
              </button>
            )}

            {!isCompleted && !isDisputed && currentUserParticipant?.invitation_status === 'accepted' && (
              <button
                onClick={() => setShowDisputeForm(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-500 hover:bg-opacity-10 text-orange-500 transition-colors text-sm sm:text-base"
              >
                <AlertCircle size={18} />
                <span>Report Dispute</span>
              </button>
            )}

            {isOrganizer && onDelete && !isCompleted && !isInProgress && !isDisputed && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
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
          teamAName={getTeamNames().teamA}
          teamBName={getTeamNames().teamB}
        />
      )}

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
                    // setError('Please provide a reason for the dispute');
                    return;
                  }
                  
                  // setLoading(true);
                  try {
                    // Use the actual database enum value 'disputed' if available, otherwise fall back to 'canceled'
                    console.log('Setting match as disputed');
                    let statusToUse = 'disputed' as EventStatus;
                    
                    // Try to update with 'disputed' first
                    const { error: statusError } = await onUpdateStatus(statusToUse);
                    
                    if (statusError) {
                      console.error('Error setting status to disputed:', statusError);
                      // Fall back to 'canceled' with a dispute note
                      statusToUse = 'cancelled' as EventStatus;
                      const { error: fallbackError } = await onUpdateStatus(statusToUse);
                      if (fallbackError) throw new Error(fallbackError);
                    }
                    
                    // Add dispute prefix to notes to mark this as a disputed match
                    console.log('Adding dispute note and metadata');
                    // Removed supabase usage
                    setShowDisputeForm(false);
                    onClose(); // Close the modal to refresh the event details
                  } catch (err) {
                    console.error('Error reporting dispute:', err);
                    // setError(getErrorMessage(err));
                  } finally {
                    // setLoading(false);
                  }
                }}
                disabled={!disputeReason.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                {/* <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> */}
                <AlertCircle size={18} />
                Submit Dispute
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