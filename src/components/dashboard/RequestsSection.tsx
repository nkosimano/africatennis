import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Bell, Loader } from 'lucide-react';
import type { Event } from '../../hooks/useEvents';
import { useAuth } from '../../contexts/AuthContext';

interface RequestsSectionProps {
  events: Event[];
  onAccept: (eventId: string) => Promise<void>;
  onDecline: (eventId: string) => Promise<void>;
  onViewDetails: (event: Event) => void;
  isLoading?: boolean;
}

export function RequestsSection({
  events,
  onAccept,
  onDecline,
  onViewDetails,
  isLoading = false,
}: RequestsSectionProps) {
  const { user } = useAuth();
  const [respondingEvents, setRespondingEvents] = useState<Set<string>>(new Set());
  const [optimisticEvents, setOptimisticEvents] = useState<Event[]>(events);

  // Filter events where:
  // 1. The user is a participant (not the creator)
  // 2. The user's invitation is pending
  const pendingEvents = optimisticEvents.filter(event => 
    event.created_by !== user?.id && // Exclude events created by the current user
    event.participants?.some(p => 
      p.profile_id === user?.id && 
      p.invitation_status === 'pending'
    )
  );

  const handleAccept = async (eventId: string) => {
    if (respondingEvents.has(eventId)) return;

    setRespondingEvents(prev => new Set([...prev, eventId]));

    // Optimistically update the UI
    setOptimisticEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? {
              ...event,
              participants: event.participants?.map(p =>
                p.profile_id === user?.id
                  ? { ...p, invitation_status: 'accepted' }
                  : p
              ),
            }
          : event
      )
    );

    try {
      await onAccept(eventId);
    } catch (err) {
      console.error('Error accepting request:', err);
      alert(`Failed to accept invitation: ${err}`);

      // Revert the optimistic update on error
      setOptimisticEvents(prev =>
        prev.map(event =>
          event.id === eventId
            ? {
                ...event,
                participants: event.participants?.map(p =>
                  p.profile_id === user?.id
                    ? { ...p, invitation_status: 'pending' }
                    : p
                ),
              }
            : event
        )
      );
    } finally {
      setRespondingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const handleDecline = async (eventId: string) => {
    if (respondingEvents.has(eventId)) return;

    setRespondingEvents(prev => new Set([...prev, eventId]));

    // Optimistically update the UI
    setOptimisticEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? {
              ...event,
              participants: event.participants?.map(p =>
                p.profile_id === user?.id
                  ? { ...p, invitation_status: 'declined' }
                  : p
              ),
            }
          : event
      )
    );

    try {
      await onDecline(eventId);
    } catch (err) {
      console.error('Error declining request:', err);
      alert(`Failed to decline invitation: ${err}`);

      // Revert the optimistic update on error
      setOptimisticEvents(prev =>
        prev.map(event =>
          event.id === eventId
            ? {
                ...event,
                participants: event.participants?.map(p =>
                  p.profile_id === user?.id
                    ? { ...p, invitation_status: 'pending' }
                    : p
                ),
              }
            : event
        )
      );
    } finally {
      setRespondingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const getInvitationStatus = (event: Event) => {
    const participant = event.participants?.find(p => p.profile_id === user?.id);
    return participant?.invitation_status || 'unknown';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 mb-6 border-2 border-accent border-opacity-20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-accent bg-opacity-10 rounded-lg">
          <Bell size={24} className="text-accent animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Pending Requests</h2>
          <p className="text-sm opacity-80">You have {pendingEvents.length} pending invitation{pendingEvents.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-4">
        {pendingEvents.map((event) => {
          const invitationStatus = getInvitationStatus(event);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-4 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer relative overflow-hidden"
              onClick={() => onViewDetails(event)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {event.event_type.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p className="text-sm opacity-80">
                    From: {event.participants?.find(p => p.profile_id === event.created_by)?.profile?.full_name || 'Unknown'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm opacity-80 mt-1">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {format(new Date(event.scheduled_start_time), 'MMM d, yyyy h:mm a')}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-1" />
                        {event.location.name}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users size={16} className="mr-1" />
                      {event.participants?.length || 0} participants
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.participants?.map((participant) => (
                    <div
                      key={participant.id}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        participant.invitation_status === 'pending'
                          ? 'bg-yellow-500 bg-opacity-20 text-yellow-500'
                          : participant.invitation_status === 'accepted'
                          ? 'bg-green-500 bg-opacity-20 text-green-500'
                          : 'bg-red-500 bg-opacity-20 text-red-500'
                      }`}
                      title={`${participant.profile?.full_name || 'Unknown'} (${participant.role.replace(/_/g, ' ')})`}
                    >
                      {participant.profile?.full_name?.charAt(0) || '?'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecline(event.id);
                  }}
                  disabled={respondingEvents.has(event.id) || invitationStatus !== 'pending' || isLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors
                    ${invitationStatus === 'pending'
                      ? 'text-red-500 hover:bg-red-500 hover:bg-opacity-10'
                      : 'text-gray-400 cursor-not-allowed'
                    }
                    ${(respondingEvents.has(event.id) || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {respondingEvents.has(event.id) || isLoading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span>Decline</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(event.id);
                  }}
                  disabled={respondingEvents.has(event.id) || invitationStatus !== 'pending' || isLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors
                    ${invitationStatus === 'pending'
                      ? 'bg-accent text-primary hover:bg-opacity-90'
                      : 'bg-gray-400 text-gray-100 cursor-not-allowed'
                    }
                    ${(respondingEvents.has(event.id) || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {respondingEvents.has(event.id) || isLoading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  <span>Accept</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
