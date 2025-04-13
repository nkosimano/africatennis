import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useRankingHistory } from '../../hooks/useRankingHistory';

interface RankingHistoryChartProps {
  profileId: string;
  rankingType: 'singles' | 'doubles';
}

export function RankingHistoryChart({
  profileId,
  rankingType,
}: RankingHistoryChartProps) {
  const { history, loading, error } = useRankingHistory(profileId, rankingType);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center opacity-80 py-8">
        <p>No ranking history available</p>
      </div>
    );
  }

  const data = history.map(entry => ({
    date: format(new Date(entry.calculation_date), 'MMM d'),
    points: entry.points,
    rank: entry.rank,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold mb-4">
        {rankingType === 'singles' ? 'Singles' : 'Doubles'} ATR History
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-text)' }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: 'none',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} ATR points`, 'Points']}
            />
            <Line
              type="monotone"
              dataKey="points"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-accent)' }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}