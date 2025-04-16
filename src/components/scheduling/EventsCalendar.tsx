import { useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, List, Users, MapPin, Clock } from 'lucide-react';
import type { Event } from '../../hooks/useEvents';
import "react-big-calendar/lib/css/react-big-calendar.css";

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

interface EventsCalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function EventsCalendar({ events, onEventClick }: EventsCalendarProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: `${event.event_type.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    start: new Date(event.scheduled_start_time ?? Date.now()),
    end: new Date(event.scheduled_end_time ?? Date.now()),
    resource: event,
  }));

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'pending_confirmation':
        return 'text-yellow-500';
      case 'scheduled':
        return 'text-blue-500';
      case 'in_progress':
        return 'text-purple-500';
      case 'completed':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      case 'disputed':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="glass rounded-xl p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Scheduled Events</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-colors focus:ring-2 focus:ring-accent ${
              viewMode === 'calendar' ? 'bg-accent text-primary' : 'hover:bg-surface-hover'
            }`}
          >
            <CalendarIcon size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors focus:ring-2 focus:ring-accent ${
              viewMode === 'list' ? 'bg-accent text-primary' : 'hover:bg-surface-hover'
            }`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={(event) => onEventClick(event.resource)}
            defaultView={Views.WEEK}
            views={['month', 'week', 'day']}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onEventClick(event)}
              className="glass p-4 rounded-lg cursor-pointer hover:bg-surface-hover transition-all"
            >
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">
                    {event.event_type.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <span className={`text-sm font-medium ${getStatusColor(event.status)} capitalize`}>
                    {event.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {event.participants?.map((participant) => (
                    <div
                      key={participant.id}
                      className="w-8 h-8 rounded-full bg-surface flex items-center justify-center"
                      title={`${participant.profile?.full_name || 'Unknown'} (${participant.role.replace(/_/g, ' ')})`}
                    >
                      {participant.profile?.full_name ? participant.profile.full_name.charAt(0) : '?'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  <span>
                    {format(new Date(event.scheduled_start_time), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" />
                    <span>{event.location.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users size={16} className="text-accent" />
                  <span>
                    {event.participants?.length || 0} participants
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {events.length === 0 && (
            <p className="text-center opacity-80 py-8">No events scheduled</p>
          )}
        </motion.div>
      )}
    </div>
  );
}