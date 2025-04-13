import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MatchStatistics } from '../../hooks/useMatchStatistics';

interface MatchStatisticsDisplayProps {
  statistics: MatchStatistics[];
  playerAName: string;
  playerBName: string;
}

export function MatchStatisticsDisplay({
  statistics,
  playerAName,
  playerBName,
}: MatchStatisticsDisplayProps) {
  const statsA = statistics[0];
  const statsB = statistics[1];

  const chartData = [
    {
      name: 'Winners',
      [playerAName]: statsA?.winners || 0,
      [playerBName]: statsB?.winners || 0,
    },
    {
      name: 'Unforced Errors',
      [playerAName]: statsA?.unforced_errors || 0,
      [playerBName]: statsB?.unforced_errors || 0,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">Match Statistics</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: 'none',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey={playerAName}
              fill="var(--color-accent)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={playerBName}
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="font-semibold mb-4">{playerAName}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-80">Winners</span>
              <span>{statsA?.winners || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Unforced Errors</span>
              <span>{statsA?.unforced_errors || 0}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">{playerBName}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-80">Winners</span>
              <span>{statsB?.winners || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Unforced Errors</span>
              <span>{statsB?.unforced_errors || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}