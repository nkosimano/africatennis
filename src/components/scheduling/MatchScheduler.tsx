import React, { useState, useEffect } from 'react'; // Added useEffect import
import { motion } from 'framer-motion';
// Assuming Check is imported from lucide-react if you use the checkmark visual
import { Calendar, MapPin, X, Search, Check, Loader } from 'lucide-react';
import DatePicker from 'react-datepicker';
// Assuming Profile type isn't directly used, removing to avoid unused import errors if applicable
// import type { Profile } from '../../hooks/useProfile';
import type { Location } from '../../hooks/useLocations';
import type { Player } from '../../hooks/usePlayers';
import { useLocation, useNavigate } from 'react-router-dom';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../../contexts/AuthContext'; // ** Ensure useAuth is imported **

interface MatchSchedulerProps {
  locations: Location[];
  players: Player[];
  // Ensure the onSchedule prop matches the signature of createEvent from useEvents
  onSchedule: (eventData: {
    event_type: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    location_id: string | null; // Allow null for location_id
    notes: string | null;       // Allow null for notes
  }, participants: { profile_id: string; role: string }[]) => Promise<{ data: any | null; error: string | null }>; // Match return type of createEvent
  onClose: () => void;
}

export function MatchScheduler({
  locations,
  players,
  onSchedule,
  onClose,
}: MatchSchedulerProps) {
  const routerLocation = useLocation(); // Renamed to avoid conflict with Location type
  const navigate = useNavigate(); // Add navigation hook
  const { user } = useAuth(); // ** Get the authenticated user **

  // --- State Variables ---
  const [eventType, setEventType] = useState<'match_singles_friendly' | 'match_singles_ranked' | 'match_doubles_friendly' | 'match_doubles_ranked'>('match_singles_friendly');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [locationId, setLocationId] = useState<string>(''); // Use empty string for initial/unselected state
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedOpponentPartner, setSelectedOpponentPartner] = useState<string>('');
  const [selectedUmpire, setSelectedUmpire] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opponentSearchQuery, setOpponentSearchQuery] = useState('');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [opponentPartnerSearchQuery, setOpponentPartnerSearchQuery] = useState('');
  const [umpireSearchQuery, setUmpireSearchQuery] = useState('');

  // --- Effect for Pre-filling Opponent ---
  useEffect(() => { // Changed React.useEffect to useEffect
    // Use routerLocation here
    if (routerLocation.state?.selectedOpponent) {
      setSelectedOpponent(routerLocation.state.selectedOpponent); // Pre-fill opponent state
      if (routerLocation.state.selectedOpponentName) {
        setNotes(`Match with ${routerLocation.state.selectedOpponentName}`);
      }
    }
  }, [routerLocation.state]);

  // --- Filter Players for Selection ---
  const getAvailablePlayers = (searchQuery: string) => {
    return players
      .filter(player => {
        // Always exclude current user
        if (player.id === user?.id) return false;

        // For each role, exclude players already selected in other roles
        if (player.id === selectedPartner || 
            player.id === selectedOpponentPartner || 
            player.id === selectedUmpire) return false;
        if (player.id === selectedOpponent) return false;

        return true;
      })
      .filter(player => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          player.full_name?.toLowerCase().includes(searchLower) ||
          player.username?.toLowerCase().includes(searchLower)
        );
      });
  };

  // --- Player Selection Handlers ---
  const handlePlayerSelection = (playerId: string, role: 'opponent' | 'partner' | 'opponentPartner' | 'umpire') => {
    switch (role) {
      case 'opponent':
        setSelectedOpponent(prevId => prevId === playerId ? '' : playerId);
        break;
      case 'partner':
        setSelectedPartner(prevId => prevId === playerId ? '' : playerId);
        break;
      case 'opponentPartner':
        setSelectedOpponentPartner(prevId => prevId === playerId ? '' : playerId);
        break;
      case 'umpire':
        setSelectedUmpire(prevId => prevId === playerId ? null : playerId);
        break;
    }
  };

  // --- Validation Functions ---
  const validateDoublesSelection = () => {
    if (!eventType.includes('doubles')) return null;
    
    // Check if any player is selected for both teams
    if (selectedPartner === selectedOpponent || 
        selectedPartner === selectedOpponentPartner ||
        selectedOpponentPartner === selectedOpponent) {
      return 'A player cannot be selected for both teams';
    }
    
    return null;
  };

  const validateUmpireSelection = () => {
    if (!eventType.includes('ranked')) return null;
    
    if (!selectedUmpire) {
      return 'An umpire is required for ranked matches';
    }
    
    // Check if umpire is already selected as a player
    if (selectedUmpire === selectedOpponent || 
        selectedUmpire === selectedPartner || 
        selectedUmpire === selectedOpponentPartner) {
      return 'The umpire cannot be a player in the match';
    }
    
    return null;
  };

  // --- Handle Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error('User is not authenticated.');
      }
      if (!startTime || !locationId || !selectedOpponent) {
        throw new Error('Please select Date/Time, Location, and Opponent.');
      }

      const doublesError = validateDoublesSelection();
      if (doublesError) {
        throw new Error(doublesError);
      }

      const umpireError = validateUmpireSelection();
      if (umpireError) {
        throw new Error(umpireError);
      }

      const isDoublesMatch = eventType.includes('doubles');
      if (isDoublesMatch && (!selectedPartner || !selectedOpponentPartner)) {
        throw new Error('Please select all players for doubles match.');
      }

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      const participants = isDoublesMatch ? [
        { profile_id: user?.id, role: 'team_a' },
        { profile_id: selectedPartner, role: 'team_a' },
        { profile_id: selectedOpponent, role: 'team_b' },
        { profile_id: selectedOpponentPartner, role: 'team_b' }
      ] : [
        { profile_id: user?.id, role: 'challenger' },
        { profile_id: selectedOpponent, role: 'opponent' }
      ];

      if (eventType.includes('ranked') && selectedUmpire) {
        participants.push({ profile_id: selectedUmpire, role: 'umpire' });
      }

      // Debug log to verify participants
      console.log('Match participants:', JSON.stringify(participants));
      console.log('Selected opponent ID:', selectedOpponent);

      const eventData = {
         event_type: eventType,
         scheduled_start_time: startTime.toISOString(),
         scheduled_end_time: endTime.toISOString(),
         location_id: locationId,
         notes: notes || null
      };

      const result = await onSchedule(eventData, participants);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Add this code to navigate to scoring
      if (result.data && result.data.id) {
        const eventId = result.data.id;
        onClose();
        // Navigate to scoring page with the event ID
        navigate(`/scoring/${eventId}`);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error scheduling match:', error);
      setError(error instanceof Error ? error.message : 'Failed to schedule match');
    }
    setLoading(false);
  };

  // --- Player Selection UI Component ---
  const PlayerSelectionList = ({ 
    players, 
    selectedId, 
    onSelect, 
    title,
    required = false,
    searchQuery,
    onSearchChange
  }: { 
    players: Player[], 
    selectedId: string | null, 
    onSelect: (id: string) => void,
    title: string,
    required?: boolean,
    searchQuery: string,
    onSearchChange: (query: string) => void
  }) => (
    <div>
      <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">
        {title} {required && '*'}
      </label>
      {/* Search input for each player list */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text)] opacity-50" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
            placeholder={`Search ${title.toLowerCase()}...`}
          />
        </div>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg p-2 bg-[var(--color-surface)]">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
              selectedId === player.id 
                ? 'bg-[var(--color-accent-dark)] text-[var(--color-primary-dark)]' 
                : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]'
            }`}
            onClick={() => onSelect(player.id)}
          >
            <div className="flex items-center gap-3">
              <img
                src={player.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${player.full_name || player.username || player.id}`}
                alt={player.full_name || 'Player avatar'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className={`font-medium ${
                  selectedId === player.id 
                    ? 'text-[var(--color-primary-dark)]' 
                    : 'text-[var(--color-text)]'
                }`}>
                  {player.full_name || player.username}
                </p>
                <p className={`text-xs ${
                  selectedId === player.id 
                    ? 'text-[var(--color-primary-dark)] opacity-80' 
                    : 'text-[var(--color-text)] opacity-70'
                }`}>
                  {player.username && `@${player.username}`}
                </p>
              </div>
            </div>
            {selectedId === player.id && (
              <Check size={20} className="text-[var(--color-primary-dark)]" />
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text)] opacity-70 p-4">No players available</p>
        )}
      </div>
    </div>
  );

  // --- Render JSX ---
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Schedule a Match</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text)] opacity-70 hover:opacity-100 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">Match Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as typeof eventType)}
              className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
            >
              <option value="match_singles_friendly">Singles - Friendly</option>
              <option value="match_singles_ranked">Singles - Ranked</option>
              <option value="match_doubles_friendly">Doubles - Friendly</option>
              <option value="match_doubles_ranked">Doubles - Ranked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">
              <Calendar size={16} className="inline mr-1 relative -top-px" />
              Date & Time *
            </label>
            <div className="relative">
              <DatePicker
                selected={startTime}
                onChange={(date: Date | null) => setStartTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
                placeholderText="Select date and time"
                minDate={new Date()}
                popperPlacement="bottom-start"
                wrapperClassName="w-full"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">
              <MapPin size={16} className="inline mr-1 relative -top-px" />
              Location *
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
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

          {/* Player Selection Section */}
          <div className="space-y-4">
            <PlayerSelectionList
              players={getAvailablePlayers(opponentSearchQuery)}
              selectedId={selectedOpponent}
              onSelect={(id) => handlePlayerSelection(id, 'opponent')}
              title="Opponent"
              required={true}
              searchQuery={opponentSearchQuery}
              onSearchChange={setOpponentSearchQuery}
            />

            {eventType.includes('doubles') && (
              <>
                <PlayerSelectionList
                  players={getAvailablePlayers(partnerSearchQuery)}
                  selectedId={selectedPartner}
                  onSelect={(id) => handlePlayerSelection(id, 'partner')}
                  title="Your Partner"
                  required={true}
                  searchQuery={partnerSearchQuery}
                  onSearchChange={setPartnerSearchQuery}
                />

                <PlayerSelectionList
                  players={getAvailablePlayers(opponentPartnerSearchQuery)}
                  selectedId={selectedOpponentPartner}
                  onSelect={(id) => handlePlayerSelection(id, 'opponentPartner')}
                  title="Opponent's Partner"
                  required={true}
                  searchQuery={opponentPartnerSearchQuery}
                  onSearchChange={setOpponentPartnerSearchQuery}
                />
              </>
            )}

            {eventType.includes('ranked') && (
              <PlayerSelectionList
                players={getAvailablePlayers(umpireSearchQuery)}
                selectedId={selectedUmpire}
                onSelect={(id) => handlePlayerSelection(id, 'umpire')}
                title="Umpire"
                required={true}
                searchQuery={umpireSearchQuery}
                onSearchChange={setUmpireSearchQuery}
              />
            )}
          </div>

          {/* --- Notes --- */}
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)] opacity-90">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all outline-none"
              rows={2} // Reduced rows
              placeholder="Optional notes (e.g., court number, warm-up time)"
            />
          </div>

          {/* --- Action Buttons --- */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Match</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Optional CSS for DatePicker Popper Theme (place in a global CSS file like index.css)
/*
.themed-datepicker-popper {
  z-index: 1001 !important;
}
.themed-datepicker-popper .react-datepicker {
  background-color: var(--color-dropdown-bg) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text) !important;
}
.themed-datepicker-popper .react-datepicker__header {
  background-color: var(--color-surface) !important;
  border-bottom-color: var(--color-border) !important;
}
.themed-datepicker-popper .react-datepicker__current-month,
.themed-datepicker-popper .react-datepicker-time__header,
.themed-datepicker-popper .react-datepicker__day-name,
.themed-datepicker-popper .react-datepicker__day {
  color: var(--color-text) !important;
}
.themed-datepicker-popper .react-datepicker__day--outside-month { opacity: 0.4; }
.themed-datepicker-popper .react-datepicker__navigation-icon::before { border-color: var(--color-text) !important; opacity: 0.7; }
.themed-datepicker-popper .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { opacity: 1; }
.themed-datepicker-popper .react-datepicker__day:hover { background-color: var(--color-surface-hover) !important; }
.themed-datepicker-popper .react-datepicker__day--selected,
.themed-datepicker-popper .react-datepicker__day--keyboard-selected { background-color: var(--color-accent) !important; color: var(--color-primary) !important; }
.themed-datepicker-popper .react-datepicker__time-container { background-color: var(--color-surface) !important; border-left-color: var(--color-border) !important; }
.themed-datepicker-popper .react-datepicker__time-container .react-datepicker__time { background-color: var(--color-dropdown-bg) !important; }
.themed-datepicker-popper .react-datepicker__time-container .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item { color: var(--color-text) !important; padding: 5px 10px !important; }
.themed-datepicker-popper .react-datepicker__time-container .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover { background-color: var(--color-surface-hover) !important; }
.themed-datepicker-popper .react-datepicker__time-container .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected { background-color: var(--color-accent) !important; color: var(--color-primary) !important; font-weight: bold; }
*/