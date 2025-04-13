import { useState, useEffect } from "react"
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
import { Calendar, Loader, AlertCircle, ChevronRight, Activity, Trophy, Award } from 'lucide-react'
import { EventDetailsModal } from '../components/scheduling/EventDetailsModal'
import type { Event } from '../hooks/useEvents'

// Helper function to convert Match to Event
const convertMatchToEvent = (match: any): any => {
  const startTime = new Date(match.scheduled_start_time);
  const endTime = new Date(match.scheduled_end_time || startTime.getTime() + 60 * 60 * 1000); // Add 1 hour if no end time

  // Check if it's a ranked match based on the event_type
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
      id: '1', // Default ID for converted matches
      name: match.location.name,
      address: '22 Century Blvd, Riverside View, Fourways',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      court_surface: null,
      number_of_courts: null,
      latitude: 0,
      longitude: 0
    } : null,
    participants: match.participants.map(p => ({
      id: '1',
      profile_id: p.profile_id,
      role: p.role as 'challenger' | 'opponent' | 'player_team_a1' | 'player_team_a2' | 'player_team_b1' | 'player_team_b2' | 'student' | 'coach' | 'umpire' | 'witness' | 'organizer' | 'player',
      invitation_status: p.invitation_status as 'pending' | 'accepted' | 'declined',
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
    }))
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
  const [isLoaded, setIsLoaded] = useState(false)
  const navigate = useNavigate()
  const { upcomingMatches, recentActivity, loading: matchesLoading, error: matchesError } = useMatches()
  const { user } = useAuth()
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  const { loading: profileLoading, error: profileError } = useProfile(user?.id);
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError, 
    deleteEvent,
    updateEventStatus,
    updateEventResponse,
    fetchEvents 
  } = useEvents();
  const { loading: playersLoading, error: playersError, toggleFavorite, searchPlayers } = usePlayers();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEventResponse = async (status: 'accepted' | 'declined'): Promise<{ error: string | null }> => {
    if (!selectedEvent) return { error: 'No event selected' };
    const result = await updateEventResponse(selectedEvent.id, user?.id || '', status);
    if ('error' in result) {
      return { error: result.error ?? null };
    }
    setSelectedEvent(null);
    return { error: null };
  };

  const handleStatusUpdate = async (status: Event['status']): Promise<{ error: string | null }> => {
    if (!selectedEvent) return { error: 'No event selected' };
    const result = await updateEventStatus(selectedEvent.id, status);
    if (result) {
      setSelectedEvent(null);
      return { error: null };
    }
    return { error: 'Failed to update event status' };
  };

  const handleDeleteEvent = async (): Promise<{ error: string | null }> => {
    if (!selectedEvent) return { error: 'No event selected' };
    const success = await deleteEvent(selectedEvent.id);
    if (success) {
      setSelectedEvent(null);
      return { error: null };
    }
    return { error: 'Failed to delete event' };
  };

  const handleAcceptRequest = async (eventId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Find the event and convert to the expected format
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Set the selected event for use in the status update function
      setSelectedEvent(event);
      
      // Update the invitation status
      const result = await handleEventResponse('accepted');
      if (result.error) {
        console.error('Error accepting invitation:', result.error);
      } else {
        // Success handling if needed
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
      // Find the event
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Set the selected event
      setSelectedEvent(event);
      
      // Update the invitation status
      const result = await handleEventResponse('declined');
      if (result.error) {
        console.error('Error declining invitation:', result.error);
      } else {
        // Success handling if needed
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = matchesLoading || profileLoading || eventsLoading || playersLoading;
  const combinedError = eventsError || profileError || matchesError || playersError;

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

  const filteredPlayers = searchPlayers(searchQuery);

  if (loading && !combinedError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-[var(--color-accent)]" size={48} />
      </div>
    );
  }

  if (combinedError && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-3xl font-bold text-[#00ffaa]">24</h2>
        <h2 className="text-xl font-bold text-red-500 mb-2">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mb-4">We encountered an error while loading your dashboard data:</p>
        <p className="text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 px-3 py-2 rounded-md text-sm mb-6 max-w-md">
          {getErrorMessage(combinedError)}
        </p>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors"
          disabled={isSubmitting || loading}
        >
          {loading ? <Loader className="animate-spin mr-2" size={16}/> : null}
          Try Again
        </button>
      </div>
    );
  }

  return (
    // Main container with consistent spacing
    <div className="space-y-6 w-full">
      {/* Page header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-accent">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/schedule/new')} 
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule Match</span>
          </button>
        </div>
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
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">{1250}</div>
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
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">{upcomingMatches.length}</div>
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
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">{0}</div>
            <p className="text-sm md:text-base text-muted-foreground">Matches Played</p>
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
                    <Loader className="animate-spin h-8 w-8 md:h-10 md:w-10 text-accent" />
                  </div>
                ) : upcomingMatches.length === 0 ? (
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
                    {upcomingMatches.map((match) => {
                      const event = convertMatchToEvent(match);
                      const opponent = match.participants.find(p => p.profile_id !== user?.id);
                      const opponentName = opponent?.profile.full_name || 'Unknown';
                      
                      let displayStatus = match.status;
                      if (match.status === 'scheduled') {
                        const now = new Date();
                        const matchTime = new Date(match.scheduled_start_time);
                        if (matchTime <= now && now <= new Date(match.scheduled_end_time || matchTime.getTime() + 60 * 60 * 1000)) {
                          displayStatus = 'live';
                        }
                      }

                      return (
                        <MatchCard
                          key={match.id}
                          opponent={opponentName}
                          date={new Date(match.scheduled_start_time).toLocaleDateString()}
                          time={new Date(match.scheduled_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          location={match.location?.name || null}
                          type={match.event_type}
                          status={displayStatus as 'scheduled' | 'completed' | 'cancelled' | 'live' | 'disputed'}
                          onClick={() => {
                            console.log('Match clicked:', event.id);
                            setSelectedEvent(event);
                          }}
                        />
                      );
                    })}
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const opponent = activity.participants.find(p => p.profile_id !== user?.id)?.profile.full_name || 'Unknown';
                    const playerParticipant = activity.participants.find(p => p.profile_id === user?.id);
                    const isWinner = playerParticipant?.role === 'winner';
                    return (
                      <ActivityCard
                        key={activity.id}
                        opponent={opponent}
                        result={isWinner ? 'win' : 'loss'}
                        score="6-4, 6-2" // This should come from match_scores table
                        date={new Date(activity.scheduled_start_time).toLocaleDateString()}
                      />
                    );
                  })
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
              events={events.filter(e => e.status === 'scheduled')}
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
            <FavoritePlayers
              players={filteredPlayers}
              onToggleFavorite={toggleFavorite}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={playersLoading}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Event Details Modal */}
      {selectedEvent && user && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRespond={handleEventResponse}
          onUpdateStatus={handleStatusUpdate}
          onDelete={handleDeleteEvent}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
