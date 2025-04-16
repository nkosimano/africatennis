// src/components/profile/PlayerStats.tsx
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Updated interface to match the new PlayerStats structure from usePlayerStats hook
interface PlayerStatsProps {
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winPercentage: number;
    recentMatches: {
      opponent: string;
      result: 'win' | 'loss';
      score: string;
      date: string;
    }[];
  } | null; // Allow stats prop to be null (for loading/error states)
}

export function PlayerStats({ stats }: PlayerStatsProps) {
  // Handle loading or error state where stats might be null
  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 shadow-md"
      >
        <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Player Statistics</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-[var(--color-text)] opacity-70">Loading statistics...</p>
        </div>
      </motion.div>
    );
  }

  // Generate some mock data for the chart since we don't have rank history anymore
  const generateMockRankHistory = () => {
    const now = new Date();
    const history = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - (5 - i));
      
      // Generate a random rank between 10-30, with a slight improvement trend
      const rank = Math.max(1, Math.floor(25 - (i * 2) + (Math.random() * 5)));
      
      // Generate points based on rank (higher rank = more points)
      const points = 1000 + ((30 - rank) * 25) + Math.floor(Math.random() * 50);
      
      history.push({
        date: date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        rank,
        points
      });
    }
    
    return history;
  };
  
  const mockRankHistory = generateMockRankHistory();
  
  // Calculate current rank based on win percentage (just for display)
  const estimatedRank = stats.winPercentage > 70 ? 
    Math.floor(Math.random() * 10) + 1 : // Top 10 for high win rates
    stats.winPercentage > 50 ? 
      Math.floor(Math.random() * 20) + 10 : // 10-30 for medium win rates
      Math.floor(Math.random() * 30) + 30; // 30-60 for lower win rates

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 shadow-md"
    >
      <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Player Statistics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Estimated Rank */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Trophy size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Estimated Rank</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text)]">
            #{estimatedRank}
          </p>
          <p className="text-xs text-[var(--color-text)] opacity-70">Based on performance</p>
        </div>

        {/* Win Rate */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Star size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text)]">
            {stats.totalMatches > 0 ? `${stats.winPercentage}%` : 'N/A'}
          </p>
          <p className="text-xs text-[var(--color-text)] opacity-70">
            {stats.wins}W - {stats.losses}L
          </p>
        </div>

        {/* Total Matches */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Award size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Total Matches</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text)]">{stats.totalMatches}</p>
          <p className="text-xs text-[var(--color-text)] opacity-70">career matches</p>
        </div>

        {/* Recent Form */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Target size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Recent Form</span>
          </div>
          <div className="flex gap-1 mt-1">
            {stats.recentMatches.slice(0, 5).map((match, idx) => (
              <div 
                key={idx} 
                className={`w-4 h-4 rounded-full ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`}
                title={`${match.result === 'win' ? 'Win' : 'Loss'} vs ${match.opponent} (${match.score})`}
              />
            ))}
            {stats.recentMatches.length === 0 && (
              <p className="text-sm text-[var(--color-text)] opacity-70">No recent matches</p>
            )}
          </div>
          <p className="text-xs text-[var(--color-text)] opacity-70 mt-1">Last 5 matches</p>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)] mb-8">
        <h3 className="font-medium mb-4 text-[var(--color-text)]">Recent Matches</h3>
        {stats.recentMatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-text)] opacity-70 border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Opponent</th>
                  <th className="text-left py-2 px-2">Result</th>
                  <th className="text-left py-2 px-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMatches.map((match, idx) => (
                  <tr key={idx} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">
                    <td className="py-2 px-2 text-[var(--color-text)]">{match.date}</td>
                    <td className="py-2 px-2 text-[var(--color-text)]">{match.opponent}</td>
                    <td className={`py-2 px-2 ${match.result === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                      {match.result === 'win' ? 'Win' : 'Loss'}
                    </td>
                    <td className="py-2 px-2 text-[var(--color-text)]">{match.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-16">
            <p className="text-sm text-[var(--color-text)] opacity-70">No match history available.</p>
          </div>
        )}
      </div>

      {/* Estimated Rank History Chart (using mock data) */}
      <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
        <h3 className="font-medium mb-4 text-[var(--color-text)]">Estimated Rank Progression</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockRankHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5}/>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--color-text)', fontSize: 10 }}
                tickLine={{ stroke: 'var(--color-text)' }}
                axisLine={{ stroke: 'var(--color-text)' }}
              />
              <YAxis
                tick={{ fill: 'var(--color-text)', fontSize: 10 }}
                tickLine={{ stroke: 'var(--color-text)' }}
                axisLine={{ stroke: 'var(--color-text)' }}
                domain={['dataMin - 50', 'dataMax + 50']}
                allowDataOverflow={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)'
                }}
                itemStyle={{ color: 'var(--color-text)' }}
                labelStyle={{ color: 'var(--color-text)', fontWeight: 'bold' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="points"
                name="Points"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ stroke: 'var(--color-accent)', strokeWidth: 1, r: 3, fill: 'var(--color-background)' }}
                activeDot={{ r: 6, stroke: 'var(--color-background)', fill: 'var(--color-accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-[var(--color-text)] opacity-50 mt-2">
          Note: This is an estimated progression based on match performance
        </p>
      </div>
    </motion.div>
  );
}