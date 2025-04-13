import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Plus, Loader, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { Availability } from '../../hooks/useAvailability';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AvailabilityCalendarProps {
  availabilities: Availability[];
  loading: boolean;
  onAdd: (availability: Omit<Availability, 'id' | 'profile_id'>) => Promise<{ error: string | null }>;
  onUpdate: (id: string, updates: Partial<Availability>) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
}

export function AvailabilityCalendar({
  availabilities,
  loading,
  onAdd,
  onUpdate,
  onDelete,
}: AvailabilityCalendarProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const events = availabilities.map(availability => ({
    id: availability.id,
    title: 'Available',
    start: new Date(availability.start_time),
    end: new Date(availability.end_time),
    resource: availability,
  }));

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Ensure end time is after start time
    const endTime = end <= start ? addHours(start, 1) : end;
    setSelectedSlot({ start, end: endTime });
    setShowAddModal(true);
  };

  const handleStartTimeChange = (date: Date | null) => {
    if (!date) return;
    
    if (selectedSlot?.end && date >= selectedSlot.end) {
      // If new start time is after or equal to end time, adjust end time to be 1 hour later
      setSelectedSlot({
        start: date,
        end: addHours(date, 1),
      });
    } else {
      setSelectedSlot(prev => ({
        start: date,
        end: prev?.end || addHours(date, 1),
      }));
    }
  };

  const handleEndTimeChange = (date: Date | null) => {
    if (!date) return;
    
    if (selectedSlot?.start && date <= selectedSlot.start) {
      // If new end time is before or equal to start time, adjust start time to be 1 hour earlier
      setSelectedSlot({
        start: addHours(date, -1),
        end: date,
      });
    } else {
      setSelectedSlot(prev => ({
        start: prev?.start || addHours(date, -1),
        end: date,
      }));
    }
  };

  const handleAddAvailability = async () => {
    if (!selectedSlot) return;

    const newAvailability = {
      start_time: selectedSlot.start.toISOString(),
      end_time: selectedSlot.end.toISOString(),
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? 'FREQ=WEEKLY' : null,
    };

    const { error } = await onAdd(newAvailability);
    
    if (error) {
      setError(error);
    } else {
      setShowAddModal(false);
      setSelectedSlot(null);
      setIsRecurring(false);
      setError(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="h-[500px] sm:h-[600px] glass rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Availability Calendar</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
        >
          <Plus size={20} className="flex-shrink-0" />
          <span>Add Availability</span>
        </button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView="agenda"
        views={['month', 'week', 'day', 'agenda']}
        className="rounded-lg overflow-hidden"
      />

      {showAddModal && (
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
            className="glass rounded-xl p-4 sm:p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold">Add Availability</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedSlot(null);
                  setError(null);
                }}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <DatePicker
                  selected={selectedSlot?.start}
                  onChange={handleStartTimeChange}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <DatePicker
                  selected={selectedSlot?.end}
                  onChange={handleEndTimeChange}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-accent focus:ring-accent"
                />
                <label htmlFor="recurring" className="text-sm font-medium">
                  Repeat weekly
                </label>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedSlot(null);
                    setError(null);
                  }}
                  className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAvailability}
                  className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}