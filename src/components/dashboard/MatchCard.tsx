import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

interface MatchCardProps {
  opponent: string;
  date: string;
  time: string;
  location: string | null;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'live' | 'disputed';
  onClick?: () => void;
}

export function MatchCard({ opponent, date, time, location, type, status, onClick }: MatchCardProps) {
  const statusColors = {
    scheduled: 'text-[var(--color-info)]',
    completed: 'text-[var(--color-success)]',
    cancelled: 'text-[var(--color-error)]',
    live: 'text-[var(--color-warning)]',
    disputed: 'text-orange-500',
  };

  const statusBadgeColors = {
    scheduled: 'bg-[var(--color-info)] bg-opacity-10',
    completed: 'bg-[var(--color-success)] bg-opacity-10',
    cancelled: 'bg-[var(--color-error)] bg-opacity-10',
    live: 'bg-[var(--color-warning)] bg-opacity-20 animate-pulse',
    disputed: 'bg-orange-500 bg-opacity-10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderColor: 'var(--color-accent)'
      }}
      transition={{ duration: 0.2 }}
      className="glass p-3 sm:p-4 rounded-lg mb-1 hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer overflow-hidden border border-[var(--color-border)] relative group"
      onClick={onClick}
    >
      {/* Subtle indicator that shows on hover */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="h-5 w-5 text-[var(--color-accent)]" />
      </div>
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <h3 className="font-semibold text-lg sm:text-xl truncate group-hover:text-[var(--color-accent)] transition-colors">{opponent}</h3>
          <p className="text-base opacity-80 capitalize break-words">{type.replace(/_/g, ' ')}</p>
        </div>
        <span className={`text-sm font-medium ${statusColors[status]} capitalize whitespace-nowrap px-2 py-1 rounded-full ${statusBadgeColors[status]}`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center text-base">
          <Calendar size={18} className="mr-2 text-[var(--color-accent)] flex-shrink-0" />
          <span className="truncate">{date}</span>
        </div>
        <div className="flex items-center text-base">
          <Clock size={18} className="mr-2 text-[var(--color-accent)] flex-shrink-0" />
          <span className="truncate">{time}</span>
        </div>
        <div className="flex items-center text-base">
          <MapPin size={18} className="mr-2 text-[var(--color-accent)] flex-shrink-0" />
          <span className="truncate">{location || 'Unknown Location'}</span>
        </div>
      </div>
    </motion.div>
  );
}
