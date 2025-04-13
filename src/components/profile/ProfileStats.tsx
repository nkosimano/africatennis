// src/components/profile/PlayerStats.tsx
import React from 'react';
import { motion } from 'framer-motion';
// Assuming Trophy, Star, Award, Target are imported correctly from lucide-react
import { Trophy, Star, Award, Target, LineChart as LineChartIcon } from 'lucide-react'; // Added LineChartIcon for consistency
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend // Added Legend for clarity
} from 'recharts';

// **FIX 1: Update the interface to expect averageWinners**
interface PlayerStatsProps {
  stats: {
    currentRank: number;
    totalPoints: number;
    winLossRecord: {
      wins: number;
      losses: number;
    };
    winRate: number;
    averageWinners: number; // <-- Changed from averageAces
    rankHistory: Array<{
      date: string;
      rank: number;
      points: number;
    }>;
  } | null; // Allow stats to be null if loading or error
}

export function PlayerStats({ stats }: PlayerStatsProps) {

  // Handle loading or error state where stats might be null
  if (!stats) {
    // Optional: Render a loading state or null/message
    // console.log("PlayerStats Component - Stats prop is null.");
    // return <div>Loading stats...</div>; // Or return null;
    // For now, let's prevent rendering if stats is null to avoid errors
    return null;
  }

  // **FIX 2: Remove redundant winRate calculation - use the one from props**
  // const winRate = Math.round( ... ); // Remove this calculation

  // Optional: Add a check for total matches if displaying win rate requires it
   const totalMatches = stats.winLossRecord.wins + stats.winLossRecord.losses;

  // Log the stats object received by the component for debugging
  console.log("PlayerStats Component - Received Stats:", stats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // Use theme variables if available, otherwise fallback or use Tailwind directly
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 shadow-md" // Adjusted padding/styling
    >
      <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Player Statistics (Singles)</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Current Rank */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Trophy size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Current Rank</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text)]">
            {stats.currentRank > 0 ? `#${stats.currentRank}` : 'N/A'} {/* Handle rank 0 */}
          </p>
          <p className="text-xs text-[var(--color-text)] opacity-70">{stats.totalPoints} points</p>
        </div>

        {/* Win Rate */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Star size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Win Rate</span>
          </div>
          {/* **FIX 2: Use stats.winRate directly** */}
          <p className="text-2xl font-bold text-[var(--color-text)]">
            {totalMatches > 0 ? `${stats.winRate}%` : 'N/A'} {/* Display N/A if no matches */}
          </p>
          <p className="text-xs text-[var(--color-text)] opacity-70">
            {stats.winLossRecord.wins}W - {stats.winLossRecord.losses}L
          </p>
        </div>

        {/* Average Winners */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            {/* **FIX 3: Update Label** */}
            <Award size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Avg. Winners</span>
          </div>
          {/* **FIX 3: Use stats.averageWinners** */}
          <p className="text-2xl font-bold text-[var(--color-text)]">{stats.averageWinners}</p>
          <p className="text-xs text-[var(--color-text)] opacity-70">per match</p>
        </div>

        {/* Next Rank Placeholder */}
        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1 text-[var(--color-text)] opacity-80">
            <Target size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">Next Rank</span>
          </div>
           {/* This part is still a placeholder - needs real logic if desired */}
          <p className="text-2xl font-bold text-[var(--color-text)]">
             {stats.currentRank > 1 ? `#${stats.currentRank - 1}` : '-'} {/* Handle rank 1 */}
          </p>
          <p className="text-xs text-[var(--color-text)] opacity-70">Points needed varies</p>
        </div>
      </div>

      {/* Rank History Chart */}
      <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
        <h3 className="font-medium mb-4 text-[var(--color-text)]">Rank History (Points)</h3>
        <div className="h-64"> {/* Fixed height container */}
          {stats.rankHistory && stats.rankHistory.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={stats.rankHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}> {/* Adjusted margins */}
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5}/> {/* Themed grid */}
                 <XAxis
                   dataKey="date"
                   tick={{ fill: 'var(--color-text)', fontSize: 10 }} // Themed ticks, smaller font
                   tickLine={{ stroke: 'var(--color-text)' }}
                   axisLine={{ stroke: 'var(--color-text)' }}
                 />
                 <YAxis
                   tick={{ fill: 'var(--color-text)', fontSize: 10 }} // Themed ticks, smaller font
                   tickLine={{ stroke: 'var(--color-text)' }}
                   axisLine={{ stroke: 'var(--color-text)' }}
                   // Domain might need adjustment based on typical point values
                   domain={['dataMin - 50', 'dataMax + 50']} // Adjusted domain padding
                   allowDataOverflow={false}
                 />
                 <Tooltip
                   // Use theme variables for tooltip style
                   contentStyle={{
                     backgroundColor: 'var(--color-background)',
                     border: '1px solid var(--color-border)',
                     borderRadius: '8px',
                     color: 'var(--color-text)' // Ensure text color contrasts
                   }}
                   itemStyle={{ color: 'var(--color-text)' }} // Style for text inside tooltip
                   labelStyle={{ color: 'var(--color-text)', fontWeight: 'bold' }} // Style for date label
                 />
                 <Legend />
                 <Line
                   type="monotone"
                   dataKey="points"
                   name="Points" // Legend name
                   stroke="var(--color-accent)" // Use theme accent color
                   strokeWidth={2}
                   dot={{ stroke: 'var(--color-accent)', strokeWidth: 1, r: 3, fill: 'var(--color-background)' }} // Themed dots
                   activeDot={{ r: 6, stroke: 'var(--color-background)', fill: 'var(--color-accent)' }} // Themed active dot
                 />
                  {/* Optionally add another line for Rank */}
                  {/* <Line type="monotone" dataKey="rank" name="Rank" stroke="#8884d8" yAxisId="rankAxis" /> */}
                  {/* If adding Rank, you might need a second YAxis */}
               </LineChart>
             </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full">
                 <p className="text-sm text-[var(--color-text)] opacity-70">No ranking history available.</p>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}