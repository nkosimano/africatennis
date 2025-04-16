import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ActivityCard } from "@/components/dashboard/ActivityCard"
import { MatchCard } from "@/components/dashboard/MatchCard"
import { RequestsSection } from '../components/dashboard/RequestsSection'
import { FavoritePlayers } from '../components/dashboard/FavoritePlayers'
import { useMatches } from '../hooks/useMatches'
import { useProfile } from '../hooks/useProfile'
import { useEvents } from '../hooks/useEvents'
import { usePlayers } from '../hooks/usePlayers'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, AlertCircle, ChevronRight, Activity, Trophy, Award } from 'lucide-react'
import { EventDetailsModal } from '../components/scheduling/EventDetailsModal'
import type { Event } from '../hooks/useEvents'
import type { EventStatus, InvitationResponse, EventResponse } from '../types/events'
import { toast } from 'react-hot-toast'

// Helper function to convert Match to Event
const convertMatchToEvent = (match: any): Event => {
  const startTime = new Date(match.scheduled_start_time);
  const endTime = new Date(match.scheduled_end_time || startTime.getTime() + 60 * 60 * 1000);

  const isRanked = match.event_type.includes('ranked');
  const eventType = isRanked ? 'match_singles_ranked' : 'match_singles_friendly';

  return {
    id: match.id,
    event_type: eventType,
    status: match.status === 'scheduled' ? 'scheduled' : 
            match.status === 'completed' ? 'completed' : 'cancelled',
    scheduled_start_time: startTime.toISOString(),
    scheduled_end_time: endTime.toISOString(),
    actual_start_time: null,
    actual_end_time: null,
    location_id: null,
    location_details: null,
    created_by: '',
    notes: null,
    location: match.location ? {
      id: '1',
      name: match.location.name,
      address: '22 Century Blvd, Riverside View, Fourways',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      court_surface: null,
      number_of_courts: null,
      latitude: 0,
      longitude: 0
    } : undefined,
    participants: (match.participants ?? []).map((p: any) => ({
      id: '1',
      profile_id: p.profile_id,
      role: p.role,
      invitation_status: p.invitation_status,
      event_id: match.id,
      check_in_time: null,
      score_confirmation_status: 'pending',
      profile: {
        id: '1',
        username: 'nathi',
        full_name: p.profile.full_name,
        avatar_url: null,
        bio: null,
        date_of_birth: null,
        gender: null,
        skill_level: null,
        playing_style: null,
        preferred_hand: null,
        is_coach: false,
        is_guest: false,
        coach_hourly_rate: null,
        coach_specialization: null,
        current_ranking_points_singles: 0,
        current_ranking_points_doubles: 0,
        home_latitude: null,
        home_location_description: null,
        home_longitude: null,
        search_radius_km: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })),
    created_at: match.created_at ?? new Date().toISOString(),
    updated_at: match.updated_at ?? new Date().toISOString()
  };
};

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  };
}

const isErrorResponse = (obj: unknown): obj is ErrorResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    typeof (obj as any).error === 'object' &&
    'message' in (obj as any).error
  );
};

export function DashboardPage() {
  const navigate = useNavigate()
  
  // Wrap data fetching in try/catch blocks with default values
  const [dataError, setDataError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Safely fetch matches data with defaults
  const { 
    upcomingMatches = [], 
    recentActivity = [], 
    loading: matchesLoading = false, 
    error: matchesError = null 
  } = useMatches() || {};
  
  // Safely fetch profile data with defaults
  const { 
    profile = null, 
    loading: profileLoading = false, 
    error: profileError = null 
  } = user?.id ? useProfile(user.id) : { profile: null, loading: false, error: null };
  
  // Safely fetch events data with defaults
  const { 
    events = [], 
    loading: eventsLoading = false, 
    error: eventsError = null,
    deleteEvent = async () => false,
    updateEventStatus = async () => null,
    updateEventResponse = async () => ({ error: null }),
    fetchEvents = async () => {} 
  } = useEvents() || {};
  
  const { loading: playersLoading = false, error: playersError = null } = usePlayers() || {};

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEventResponse = async (status: InvitationResponse): Promise<EventResponse> => {
    try {
      if (!selectedEvent || !user) {
        return { error: 'No event or user found' };
      }
      
      const result = await updateEventResponse(selectedEvent.id, user.id, status === 'accepted' ? 'accepted' : 'declined');
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      
      toast.success(`Event ${status.toLowerCase()}`);
      setSelectedEvent(null);
      return { error: null, success: true };
    } catch (error) {
      console.error("Error handling event response:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const handleEventStatusUpdate = async (status: EventStatus): Promise<EventResponse> => {
    try {
      if (!selectedEvent) {
        return { error: 'No event selected' };
      }
      
      const result = await updateEventStatus(selectedEvent.id, status.toLowerCase() as EventStatus);
      if (!result) {
        const error = 'Failed to update event status';
        toast.error(error);
        return { error };
      }
      
      toast.success(`Event status updated to ${status}`);
      setSelectedEvent(null);
      return { error: null, success: true };
    } catch (error) {
      console.error("Error updating event status:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const handleDeleteEvent = async (): Promise<EventResponse> => {
    try {
      if (!selectedEvent) {
        return { error: 'No event selected' };
      }
      
      const success = await deleteEvent(selectedEvent.id);
      if (success) {
        setSelectedEvent(null);
        return { error: null, success: true };
      }
      
      return { error: 'Failed to delete event' };
    } catch (error) {
      console.error("Error deleting event:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  };

  const handleAcceptRequest = async (eventId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const event = events.find((e: any) => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      setSelectedEvent(event);
      const result = await handleEventResponse('accepted');
      if (result.error) {
        console.error('Error accepting invitation:', result.error);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineRequest = async (eventId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const event = events.find((e: any) => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      setSelectedEvent(event);
      const result = await handleEventResponse('declined');
      if (result.error) {
        console.error('Error declining invitation:', result.error);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = matchesLoading || profileLoading || eventsLoading || playersLoading;
  const combinedError = eventsError || profileError || matchesError || playersError || dataError;

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (isErrorResponse(error)) {
      return error.error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  };

  // Always render the main content, with appropriate fallbacks for missing data
  return (
    <div className="space-y-6 w-full">
      {/* Debug info - remove in production */}
      <div className="bg-yellow-100 dark:bg-yellow-900 text-black dark:text-yellow-100 p-3 rounded text-sm mb-4">
        <details>
          <summary className="cursor-pointer font-semibold">Debug Info (Click to expand)</summary>
          <div className="mt-2 overflow-auto max-h-80 border-t pt-2">
            <div><b>User:</b> {user ? JSON.stringify({id: user.id}) : "No user"}</div>
            <div><b>Loading:</b> {String(loading)}</div>
            <div><b>Errors:</b> {combinedError ? getErrorMessage(combinedError) : "None"}</div>
          </div>
        </details>
      </div>

      {/* Page header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-accent">Dashboard</h1>
      </div>

      {/* Stats cards - always full width on mobile, row on larger screens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          className="glass rounded-lg p-4 sm:p-5 md:p-6 border border-border flex flex-col justify-center items-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ boxShadow: '0 0 15px rgba(var(--color-accent-rgb)/0.2)' }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 opacity-10 blur-xl rounded-lg"></div>
          <div className="relative z-10 text-center">
            <Trophy className="h-8 w-8 md:h-10 md:w-10 text-accent mx-auto mb-2 md:mb-3" />
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold" data-cy="dashboard-atr-points">
              {profile?.current_ranking_points_singles ?? 1200}
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Ranking Points</p>
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-lg p-4 sm:p-5 md:p-6 border border-border flex flex-col justify-center items-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ boxShadow: '0 0 15px rgba(var(--color-accent-rgb)/0.2)' }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 opacity-10 blur-xl rounded-lg"></div>
          <div className="relative z-10 text-center">
            <Award className="h-8 w-8 md:h-10 md:w-10 text-accent mx-auto mb-2 md:mb-3" />
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">{24}</div>
            <p className="text-sm md:text-base text-muted-foreground">Matches Played</p>
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-lg p-4 sm:p-5 md:p-6 border border-border flex flex-col justify-center items-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ boxShadow: '0 0 15px rgba(var(--color-accent-rgb)/0.2)' }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 opacity-10 blur-xl rounded-lg"></div>
          <div className="relative z-10 text-center">
            <Calendar className="h-8 w-8 md:h-10 md:w-10 text-accent mx-auto mb-2 md:mb-3" />
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">{upcomingMatches?.length || 0}</div>
            <p className="text-sm md:text-base text-muted-foreground">Upcoming</p>
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-lg p-4 sm:p-5 md:p-6 border border-border flex flex-col justify-center items-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ boxShadow: '0 0 15px rgba(var(--color-accent-rgb)/0.2)' }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 opacity-10 blur-xl rounded-lg"></div>
          <div className="relative z-10 text-center">
            <Activity className="h-8 w-8 md:h-10 md:w-10 text-accent mx-auto mb-2 md:mb-3" />
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">{recentActivity?.length || 0}</div>
            <p className="text-sm md:text-base text-muted-foreground">Recent Activities</p>
          </div>
        </motion.div>
      </div>

      {/* Main content area - 2 column grid on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left column - Matches and Activity (takes 2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <motion.div
            className="glass rounded-lg border border-border relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ boxShadow: '0 0 15px rgba(var(--color-accent-rgb)/0.2)' }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 opacity-10 blur-xl rounded-lg"></div>
            <div className="relative z-10 p-4 sm:p-5 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                  <h2 className="text-xl md:text-2xl font-bold">Upcoming Matches</h2>
                </div>
                <button 
                  onClick={() => navigate('/schedule')}
                  className="text-sm md:text-base text-accent hover:underline flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {matchesLoading ? (
                  <div className="flex justify-center py-8 md:py-12">
                    <div className="animate-spin h-8 w-8 md:h-10 md:w-10 text-accent" />
                  </div>
                ) : !upcomingMatches || upcomingMatches.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-surface/50 rounded-lg">
                    <Calendar className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground md:text-lg">No upcoming matches</p>
                    <button 
                      onClick={() => navigate('/schedule/new')}
                      className="mt-4 md:mt-6 px-4 py-2 md:px-6 md:py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors md:text-lg"
                    >
                      Schedule a Match
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {upcomingMatches.map((match: any) => {
                      try {
                        const event = convertMatchToEvent(match);
                        const opponent = match.participants?.find((p: any) => p.profile_id !== user?.id)?.profile?.full_name || 'Unknown';
                        return (
                          <MatchCard
                            key={match.id}
                            opponent={opponent}
                            date={new Date(match.scheduled_start_time).toLocaleDateString()}
                            time={new Date(match.scheduled_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            location={match.location?.name || null}
                            type={match.event_type}
                            status={match.status as 'scheduled' | 'completed' | 'cancelled' | 'live' | 'disputed'}
                            onClick={() => {
                              console.log('Match clicked:', event.id);
                              if (match.status === 'live') {
                                navigate(`/scoring/${event.id}`, { replace: true });
                              } else {
                                setSelectedEvent(event);
                              }
                            }}
                          />
                        );
                      } catch (error) {
                        console.error("Error rendering match card:", error);
                        return null; // Skip rendering this card if there's an error
                      }
                    }).filter(Boolean)} {/* Filter out any null items from errors */}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-lg border border-border relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ boxShadow: '0 0 15px rgba(var(--color-accent-rgb)/0.2)' }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent/50 opacity-10 blur-xl rounded-lg"></div>
            <div className="relative z-10 p-4 sm:p-5 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                  <h2 className="text-xl md:text-2xl font-bold">Recent Activity</h2>
                </div>
                <button
                  onClick={() => navigate('/matches/history')}
                  className="text-sm md:text-base text-accent hover:underline flex items-center gap-1 group"
                >
                  <span>Match History</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[300px] md:max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => {
                    try {
                      const opponent = activity.participants?.find((p: any) => p.profile_id !== user?.id)?.profile?.full_name || 'Unknown';
                      const playerParticipant = activity.participants?.find((p: any) => p.profile_id === user?.id);
                      return (
                        <ActivityCard
                          key={activity.id}
                          opponent={opponent}
                          result={playerParticipant?.role === 'winner' ? 'win' : 'loss'}
                          score="6-4, 6-2" // This should come from match_scores table
                          date={new Date(activity.scheduled_start_time).toLocaleDateString()}
                        />
                      );
                    } catch (error) {
                      console.error("Error rendering activity card:", error);
                      return null; // Skip rendering this card if there's an error
                    }
                  }).filter(Boolean) // Filter out any null items from errors
                ) : (
                  <div className="text-center py-8 md:py-12 bg-surface/50 rounded-lg">
                    <Activity className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground md:text-lg">No recent activity to show</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <RequestsSection
              events={events?.filter((e: any) => e.status === 'scheduled') || []}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
              onViewDetails={setSelectedEvent}
              isLoading={eventsLoading || isSubmitting}
            />
          </motion.div>
        </div>
        
        {/* Right column - Players (takes 1/3 on large screens) */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="h-full"
          >
            <FavoritePlayers />
          </motion.div>
        </div>
      </div>
      
      {/* Event Details Modal */}
      {selectedEvent && user && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRespond={handleEventResponse}
          onUpdateStatus={handleEventStatusUpdate}
          onDelete={handleDeleteEvent}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
