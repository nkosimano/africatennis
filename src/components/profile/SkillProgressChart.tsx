import React from 'react';
import { motion } from 'framer-motion';
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
import type { SkillHistoryEntry } from '../../hooks/usePlayerSkillHistory';

interface SkillProgressChartProps {
  history: SkillHistoryEntry[];
}

export function SkillProgressChart({ history }: SkillProgressChartProps) {
  const data = history.map(entry => ({
    date: format(new Date(entry.changed_at), 'MMM d'),
    skill: entry.new_skill_level,
    reason: entry.reason,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">Skill Progress</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text)' }}
            />
            <YAxis
              domain={[1, 7]}
              ticks={[1, 2, 3, 4, 5, 6, 7]}
              tick={{ fill: 'var(--color-text)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: 'none',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="skill"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-accent)' }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {history.length === 0 && (
        <p className="text-center opacity-80 py-4">
          No skill history available yet. Play matches to track your progress!
        </p>
      )}
    </motion.div>
  );
}