import React, { useState, useMemo, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, X, Crown, Search, Check, Shield } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { Event } from '../../hooks/useEvents';
import type { Location } from '../../hooks/useLocations';
import type { Player } from '../../hooks/usePlayers';
import { useAuth } from '../../contexts/AuthContext';
import "react-datepicker/dist/react-datepicker.css";
import { EventDetailsModal } from '../scheduling/EventDetailsModal';
import { useEvents } from '../../hooks/useEvents';
import { useTournaments } from '../../hooks/useTournaments';
import { Database } from '../../types/supabase';
import { Combobox } from '@headlessui/react';
import { toast } from 'react-hot-toast';

type TournamentFormat = Database['public']['Enums']['tournament_format_enum'];

interface TournamentCreateFormProps {
  locations: Location[];
  players: Player[];
  onSchedule: (
    eventData: {
      event_type: Event['event_type'];
      scheduled_start_time: string;
      scheduled_end_time: string;
      location_id: string | null;
      notes: string | null;
    }, 
    participants: { profile_id: string; role: string }[]
  ) => Promise<{ data: any | null; error: string | null }>;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TournamentFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  format: TournamentFormat;
  location_id?: string;
  max_participants?: number;
  registration_deadline?: string;
  is_ranked?: boolean;
  umpire_id?: string;
}

interface TournamentParticipant {
  profile_id: string;
  role: 'player' | 'umpire';
  seed?: number;
}

export function TournamentCreateForm({
  locations,
  players,
  onSchedule,
  onClose,
  onSuccess,
}: TournamentCreateFormProps) {
  const { user } = useAuth();
  const { createTournament, loading, error: tournamentError } = useTournaments();
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    format: 'single_elimination',
    location_id: '',
    max_participants: 32,
    registration_deadline: new Date().toISOString(),
    is_ranked: true,
    umpire_id: undefined
  });
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [playerQuery, setPlayerQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    const searchLower = playerQuery.toLowerCase();
    return players.filter(player => 
      (player.full_name?.toLowerCase().includes(searchLower) ||
      player.username?.toLowerCase().includes(searchLower)) &&
      !participants.some(p => p.profile_id === player.id)
    ).slice(0, 100); // Limit to 100 results for performance
  }, [players, playerQuery, participants]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleDateChange = (field: keyof Pick<TournamentFormData, 'start_date' | 'end_date' | 'registration_deadline'>, date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date.toISOString()
      }));
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    handleDateChange('start_date', date);
  };

  const handleEndDateChange = (date: Date | null) => {
    handleDateChange('end_date', date);
  };

  const handleRegistrationDeadlineChange = (date: Date | null) => {
    handleDateChange('registration_deadline', date);
  };

  const handlePlayerSelect = (playerId: string, role: 'player' | 'umpire' = 'player') => {
    if (role === 'umpire') {
      // Remove previous umpire if exists
      setParticipants(prev => prev.filter(p => p.role !== 'umpire'));
      setFormData(prev => ({ ...prev, umpire_id: playerId }));
    }
    
    setParticipants(prev => [
      ...prev.filter(p => p.profile_id !== playerId),
      { profile_id: playerId, role }
    ]);
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      toast.error('Tournament name is required');
      return false;
    }

    if (!formData.location_id) {
      toast.error('Please select a location');
      return false;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const registrationDeadline = formData.registration_deadline 
      ? new Date(formData.registration_deadline)
      : null;

    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return false;
    }

    if (registrationDeadline && registrationDeadline >= startDate) {
      toast.error('Registration deadline must be before start date');
      return false;
    }

    const playerCount = participants.filter(p => p.role === 'player').length;
    if (playerCount < 4) {
      toast.error('Minimum 4 players required');
      return false;
    }

    if (formData.is_ranked && !participants.some(p => p.role === 'umpire')) {
      toast.error('Ranked tournaments require an umpire');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createTournament({
        ...formData,
        participants: participants,
      });
      toast.success('Tournament created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
    }
  };

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
          <h2 className="text-2xl font-bold">Create Tournament</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Tournament Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <DatePicker
                selected={new Date(formData.start_date)}
                onChange={handleStartDateChange}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker
                selected={new Date(formData.end_date)}
                onChange={handleEndDateChange}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Registration Deadline</label>
            <DatePicker
              selected={formData.registration_deadline ? new Date(formData.registration_deadline) : null}
              onChange={handleRegistrationDeadlineChange}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <select
              name="format"
              value={formData.format}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
              <option value="swiss">Swiss System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              name="location_id"
              value={formData.location_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Maximum Participants</label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleInputChange}
              min={4}
              max={128}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_ranked"
                checked={formData.is_ranked}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <span className="text-sm font-medium">Ranked Tournament</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Players ({participants.filter(p => p.role === 'player').length} selected)
            </label>
            <Combobox
              as="div"
              className="relative mt-1"
              onChange={(playerId: string) => handlePlayerSelect(playerId, 'player')}
            >
              <Combobox.Input
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onChange={(event) => setPlayerQuery(event.target.value)}
                placeholder="Search players..."
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredPlayers.map((player) => (
                  <Combobox.Option
                    key={player.id}
                    value={player.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    {player.full_name || player.username}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Combobox>
            <p className="text-sm text-gray-500 mt-1">
              Minimum 4 players required
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                name="is_ranked"
                checked={formData.is_ranked}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <span className="text-sm font-medium">Ranked Tournament</span>
            </label>
            
            {formData.is_ranked && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span>Tournament Umpire (Required)</span>
                  </div>
                </label>
                <Combobox
                  as="div"
                  className="relative mt-1"
                  onChange={(playerId: string) => handlePlayerSelect(playerId, 'umpire')}
                >
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={(event) => setPlayerQuery(event.target.value)}
                    placeholder="Search for umpire..."
                  />
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredPlayers.map((player) => (
                      <Combobox.Option
                        key={player.id}
                        value={player.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-blue-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {player.full_name || player.username}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}