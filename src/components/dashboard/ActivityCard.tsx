import { motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

interface ActivityCardProps {
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  date: string;
}

export function ActivityCard({ opponent, result, score, date }: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-3 sm:p-4 rounded-lg mb-1 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {result === 'win' ? (
            <Trophy size={24} className="text-[var(--color-success)] mr-3" />
          ) : (
            <X size={24} className="text-[var(--color-error)] mr-3" />
          )}
          <span className="font-medium text-lg">vs {opponent}</span>
        </div>
        <span className="text-base opacity-80">{date}</span>
      </div>
      <div className="text-base">
        <span className={result === 'win' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
          {result === 'win' ? 'Won' : 'Lost'}
        </span>
        <span className="mx-2">•</span>
        <span>{score}</span>
      </div>
    </motion.div>
  );
}
