import { useState, useMemo, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { Location } from '../../hooks/useLocations';
import type { Profile } from '../../types';
import { useTournaments } from '../../hooks/useTournaments';
import { useUmpires } from '../../hooks/useUmpires';
import { Database } from '../../types/supabase';
import { toast } from 'react-hot-toast';

type TournamentFormat = Database['public']['Enums']['tournament_format_enum'];

interface TournamentCreateFormProps {
  locations: Location[];
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

export function TournamentCreateForm({
  locations,
  onClose,
  onSuccess,
}: TournamentCreateFormProps) {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    format: 'single_elimination',
    location_id: '',
    max_participants: 32,
    is_ranked: false
  });

  const { createTournament, loading } = useTournaments();

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

    if (formData.is_ranked && !formData.umpire_id) {
      toast.error('Ranked tournaments require an umpire');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createTournament({
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        format: formData.format,
        location_id: formData.location_id,
        max_participants: formData.max_participants,
        registration_deadline: formData.registration_deadline,
        is_ranked: formData.is_ranked,
        umpire_id: formData.umpire_id,
      });
      toast.success('Tournament created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
    }
  };

  function UmpireSearchSelector({ selectedUmpireId, onSelectUmpire }) {
    const { umpires, loading } = useUmpires();
    const [search, setSearch] = useState('');
    const filtered = search
      ? umpires.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
      : umpires;
    return (
      <div>
        <input
          type="text"
          placeholder="Search umpire by name or username"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <div className="max-h-40 overflow-y-auto border rounded">
          {loading ? (
            <div className="p-2 text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No umpires found</div>
          ) : (
            filtered.map(umpire => (
              <div
                key={umpire.id}
                className={`p-2 cursor-pointer hover:bg-accent/10 ${selectedUmpireId === umpire.id ? 'bg-accent/20 font-bold' : ''}`}
                onClick={() => onSelectUmpire(umpire.id)}
              >
                <span>{umpire.full_name} </span>
                <span className="text-muted-foreground">@{umpire.username}</span>
              </div>
            ))
          )}
        </div>
        {selectedUmpireId && (
          <div className="mt-1 text-xs text-muted-foreground">Selected: {filtered.find(u => u.id === selectedUmpireId)?.full_name || selectedUmpireId}</div>
        )}
      </div>
    );
  }

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
                <UmpireSearchSelector
                  selectedUmpireId={formData.umpire_id}
                  onSelectUmpire={umpireId => setFormData(prev => ({ ...prev, umpire_id: umpireId }))}
                />
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