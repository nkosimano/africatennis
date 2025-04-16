import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { Coach } from '../../hooks/useCoaches';
import type { Location } from '../../hooks/useLocations';
import "react-datepicker/dist/react-datepicker.css";

interface CoachingSessionFormProps {
  coach: Coach;
  locations: Location[];
  onSchedule: (sessionData: {
    coach_id: string;
    start_time: Date;
    location_id: string;
    notes: string;
  }) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export function CoachingSessionForm({
  coach,
  locations,
  onSchedule,
  onClose,
}: CoachingSessionFormProps) {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!startTime) {
      return 'Please select a start time';
    }
    if (!locationId) {
      return 'Please select a location';
    }
    if (startTime < new Date()) {
      return 'Start time cannot be in the past';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await onSchedule({
      coach_id: coach.id,
      start_time: startTime!,
      location_id: locationId,
      notes,
    });

    if (error) {
      console.error('Schedule Session Error:', error);
      setError(error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Book Coaching Session</h2>
            <p className="text-sm opacity-80">with {coach.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-2" />
              Date & Time
            </label>
            <DatePicker
              selected={startTime}
              onChange={(date: Date | null) => {
                setStartTime(date || new Date());
                setError(null);
              }}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              placeholderText="Select date and time"
              minDate={new Date()}
              filterTime={(time: Date) => {
                const hour = new Date(time).getHours();
                return hour >= 6 && hour <= 22; // 6 AM to 10 PM
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin size={16} className="inline mr-2" />
              Location
            </label>
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setError(null);
              }}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} - {location.court_surface} courts
                  {location.number_of_courts && ` (${location.number_of_courts} courts)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              rows={3}
              placeholder="Any specific areas you'd like to focus on?"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}