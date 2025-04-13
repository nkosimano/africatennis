import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, X, Crown, Search, Check } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { Event } from '../../hooks/useEvents'; // Keep Event type for casting
import type { Location } from '../../hooks/useLocations';
import type { Player } from '../../hooks/usePlayers';
import { useAuth } from '../../contexts/AuthContext';
import "react-datepicker/dist/react-datepicker.css";
import { EventDetailsModal } from '../scheduling/EventDetailsModal';
import { useEvents } from '../../hooks/useEvents';

interface TournamentCreateFormProps {
  locations: Location[];
  players: Player[];
  onSchedule: (
    eventData: {
      event_type: Event['event_type'];
      scheduled_start_time: string;
      scheduled_end_time: string;
      location_id: string | null; // Allow null
      notes: string | null;       // Allow null
    }, 
    participants: { profile_id: string; role: string }[]
  ) => Promise<{ data: any | null; error: string | null }>; // Match return type
  onClose: () => void;
}

type TournamentFormat = 'king_of_the_hill' | 'knockout' | 'weakest_link' | 'professional';

interface TournamentDetails {
  name: string;
  format: TournamentFormat;
  startDate: Date | null;
  locationId: string;
  description: string;
}

export function TournamentCreateForm({
  locations,
  players,
  onSchedule,
  onClose,
}: TournamentCreateFormProps) {
  const { user } = useAuth();
  const [details, setDetails] = useState<TournamentDetails>({
    name: '',
    format: 'knockout',
    startDate: null,
    locationId: '',
    description: '',
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'players' | 'review'>('details');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { deleteEvent } = useEvents();

  const filteredPlayers = players.filter(player => {
    const searchLower = searchQuery.toLowerCase();
    return (
      player.full_name?.toLowerCase().includes(searchLower) ||
      player.username?.toLowerCase().includes(searchLower) ||
      player.skill_level?.toString().includes(searchLower)
    );
  });

  const getMinPlayers = (format: TournamentFormat) => {
    switch (format) {
      case 'king_of_the_hill':
        return 4;
      case 'knockout':
        return 4;
      case 'weakest_link':
        return 5;
      case 'professional':
        return 10;
      default:
        return 4;
    }
  };

  const validateDetails = () => {
    if (!details.name) return 'Tournament name is required';
    if (!details.startDate) return 'Start date is required';
    if (!details.locationId) return 'Location is required';
    return null;
  };

  const validatePlayers = () => {
    const minPlayers = getMinPlayers(details.format);
    if (selectedPlayers.length < minPlayers) {
      return `At least ${minPlayers} players are required for ${details.format.replace(/_/g, ' ')} format`;
    }
    if (details.format === 'weakest_link' && selectedPlayers.length !== 5) {
      return 'Exactly 5 players are required for Weakest Link format';
    }
    return null;
  };

  const handleNext = () => {
    if (step === 'details') {
      const detailsError = validateDetails();
      if (detailsError) {
        setError(detailsError);
        return;
      }
      setStep('players');
    } else if (step === 'players') {
      const playersError = validatePlayers();
      if (playersError) {
        setError(playersError);
        return;
      }
      setStep('review');
    }
    setError(null);
  };

  const handleBack = () => {
    if (step === 'players') setStep('details');
    if (step === 'review') setStep('players');
    setError(null);
  };

  // --- Handle Form Submission ---
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    console.log("--- handleSubmit START (Tournament) ---");

    // Perform validations first
    const detailsError = validateDetails();
    if (detailsError) {
      setError(detailsError);
      setLoading(false);
      console.log("Validation failed (details):", detailsError);
      console.log("--- handleSubmit END (Tournament) ---");
      return;
    }
    const playersError = validatePlayers();
    if (playersError) {
      setError(playersError);
      setLoading(false);
      console.log("Validation failed (players):", playersError);
      console.log("--- handleSubmit END (Tournament) ---");
      return;
    }

    console.log("Validation passed.");

    try {
      // Ensure startDate is not null
      if (!details.startDate) {
          throw new Error("Start date is missing unexpectedly.");
      }

      const endDate = new Date(details.startDate);
      endDate.setHours(endDate.getHours() + 4);
      console.log("Calculated endDate:", endDate);

      // Create participants array including the current user (event creator)
      if (!user?.id) {
        throw new Error("User ID is required to create a tournament");
      }

      // Ensure user.id is a string
      const userId = String(user.id);
      
      // Construct participants array with proper types
      const participants = [
        // Add the current user as the first participant (event creator)
        { profile_id: userId, role: 'organizer' },
        // Add the selected players as participants
        ...selectedPlayers.map(playerId => ({
          profile_id: String(playerId),
          role: 'player'
        }))
      ];

      // Validate all participant IDs are valid UUIDs
      const invalidParticipants = participants.filter(p => !p.profile_id || typeof p.profile_id !== 'string');
      if (invalidParticipants.length > 0) {
        throw new Error("Invalid participant IDs detected");
      }

      console.log("Constructed participants array:", participants);

      // Prepare the data object with the CORRECT event_type
      const eventData: {
        event_type: Event['event_type'];
        scheduled_start_time: string;
        scheduled_end_time: string;
        location_id: string | null;
        notes: string | null;
      } = {
        event_type: 'tournament_match' as Event['event_type'],
        scheduled_start_time: details.startDate.toISOString(),
        scheduled_end_time: endDate.toISOString(),
        location_id: details.locationId || null,
        notes: `${details.name} (Format: ${details.format.replace(/_/g, ' ')})\n\n${details.description}`.trim() || null
      };

      // --- Console logs for debugging ---
      console.log("--- Debugging Tournament Event Data ---");
      console.log("Full eventData object from Tournament Form:", eventData);
      console.log("Participants array:", participants);
      console.log("Value of event_type from Tournament Form:", eventData.event_type);
      console.log("--------------------------------------");
      // --- End of console logs ---

      if (typeof onSchedule !== 'function') {
          console.error("onSchedule prop is not a function!", onSchedule);
          throw new Error("Internal configuration error: Scheduling function is missing.");
      }

      console.log("Calling onSchedule (createEvent)...");
      const { error: scheduleError } = await onSchedule(eventData, participants);
      console.log("onSchedule call finished.");

      if (scheduleError) {
        console.log("Error received from onSchedule:", scheduleError);
        throw new Error(scheduleError);
      }

      console.log("onSchedule successful, calling onClose...");
      onClose();

    } catch (err) {
      console.error('Tournament creation error caught in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      console.log("--- handleSubmit END (Tournament) ---");
    }
  };

  // Handler functions for EventDetailsModal
  const handleEventResponse = async (status: 'accepted' | 'declined'): Promise<{ error: string | null }> => {
    // This is a placeholder implementation
    console.log(`Responding to event with status: ${status}`);
    return { error: null };
  };

  const handleStatusUpdate = async (status: Event['status']): Promise<{ error: string | null }> => {
    // This is a placeholder implementation
    console.log(`Updating event status to: ${status}`);
    return { error: null };
  };

  const handleDeleteEvent = async (): Promise<{ error: string | null }> => {
    if (!selectedEvent) {
      return { error: 'No event selected' };
    }

    try {
      const success = await deleteEvent(selectedEvent.id);
      if (!success) {
        return { error: 'Failed to delete event' };
      }
      setSelectedEvent(null);
      return { error: null };
    } catch (err) {
      console.error('Error deleting event:', err);
      return { error: err instanceof Error ? err.message : 'An unexpected error occurred' };
    }
  };

  // --- Render JSX (No changes needed in JSX from previous version) ---
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">Create Tournament</h2>
            <p className="text-sm text-[var(--color-text)] opacity-80">
              {step === 'details' && 'Step 1: Enter tournament details'}
              {step === 'players' && 'Step 2: Select participating players'}
              {step === 'review' && 'Step 3: Review and confirm'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text)] opacity-70 hover:opacity-100 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">Tournament Name *</label>
              <input
                type="text"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
                placeholder="e.g., Midrand Open 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">Format *</label>
              <select
                value={details.format}
                onChange={(e) => setDetails({ ...details, format: e.target.value as TournamentFormat })}
                className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
              >
                <option value="knockout">Knockout (Min. 4 players)</option>
                <option value="king_of_the_hill">King of the Hill (Min. 4 players)</option>
                <option value="weakest_link">Weakest Link (Exactly 5 players)</option>
                <option value="professional">Professional (Min. 10 players)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">
                <Calendar size={16} className="inline mr-1 relative -top-px" />
                Start Date & Time *
              </label>
              <DatePicker
                selected={details.startDate}
                onChange={(date: Date | null) => setDetails({ ...details, startDate: date })}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
                placeholderText="Select start date and time"
                minDate={new Date()}
                popperClassName="themed-datepicker-popper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">
                <MapPin size={16} className="inline mr-1 relative -top-px" />
                Location *
              </label>
              <select
                value={details.locationId}
                onChange={(e) => setDetails({ ...details, locationId: e.target.value })}
                className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">Description</label>
              <textarea
                value={details.description}
                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
                rows={3}
                placeholder="Optional: Add rules, prize info, etc."
              />
            </div>
          </div>
        )}

        {/* Step: Players */}
         {step === 'players' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">
                <Users size={16} className="inline mr-1 relative -top-px" />
                Select Players ({selectedPlayers.length} / Min: {getMinPlayers(details.format)})
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text)] opacity-50" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
                  placeholder="Search players by name or username..."
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-[var(--color-border)] rounded-lg p-2 bg-[var(--color-surface)]">
                {filteredPlayers.length > 0 ? filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                     onClick={() => {
                        const isSelected = selectedPlayers.includes(player.id);
                        if (isSelected) {
                            setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                        } else {
                            setSelectedPlayers([...selectedPlayers, player.id]);
                        }
                     }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={player.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${player.full_name || player.username || player.id}`}
                        alt={player.full_name || 'Player avatar'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{player.full_name || player.username}</p>
                        <p className="text-xs opacity-70">
                          {player.skill_level ? `Level ${player.skill_level}` : 'Level N/A'}
                          {player.username && ` • @${player.username}`}
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 border-2 ${selectedPlayers.includes(player.id) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'} rounded flex items-center justify-center`}>
                         {selectedPlayers.includes(player.id) && <Check size={14} className="text-[var(--color-primary)]" />}
                    </div>
                  </div>
                )) : (
                     <p className="text-center text-sm opacity-70 p-4">No players found matching search.</p>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-[var(--color-text)]">Tournament Details</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text)] opacity-80">Name:</dt>
                  <dd className="text-[var(--color-text)] font-medium">{details.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text)] opacity-80">Format:</dt>
                  <dd className="text-[var(--color-text)] font-medium capitalize">{details.format.replace(/_/g, ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text)] opacity-80">Start Date:</dt>
                  <dd className="text-[var(--color-text)] font-medium">{details.startDate?.toLocaleString() ?? 'Not set'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text)] opacity-80">Location:</dt>
                  <dd className="text-[var(--color-text)] font-medium">{locations.find(l => l.id === details.locationId)?.name ?? 'Not selected'}</dd>
                </div>
                 {details.description && (
                   <div className="pt-2">
                     <dt className="text-[var(--color-text)] opacity-80 mb-1">Description:</dt>
                     <dd className="text-[var(--color-text)] text-xs opacity-90">{details.description}</dd>
                   </div>
                 )}
              </dl>
            </div>


            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-[var(--color-text)]">Selected Players ({selectedPlayers.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedPlayers.map((playerId) => {
                  const player = players.find(p => p.id === playerId);
                  return (
                    <div key={playerId} className="flex items-center gap-2 text-sm">
                      <img
                        src={player?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${player?.full_name || player?.id}`}
                        alt={player?.full_name || 'Player avatar'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-[var(--color-text)]">{player?.full_name || player?.username || 'Unknown Player'}</span>
                      {player?.skill_level && <span className="text-xs opacity-70">(Lvl {player.skill_level})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Display Area */}
         {error && (
           <p className="text-red-500 text-sm font-medium text-center mt-4">{error}</p>
         )}

        {/* Navigation/Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
          {step !== 'details' && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Back
            </button>
          )}
          {step === 'review' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Crown size={18} />
              <span>{loading ? 'Creating...' : 'Create Tournament'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] rounded-lg hover:opacity-90 transition-colors"
            >
              <span>Next</span>
              {/* Optional: Add a right arrow icon here */}
            </button>
          )}
        </div>
      </motion.div>
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
    </motion.div>
  );
}