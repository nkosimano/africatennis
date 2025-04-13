import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, X, Calendar, User, Star, AlertTriangle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { Player } from '../../hooks/usePlayers';
import "react-datepicker/dist/react-datepicker.css";

interface MatchLoggingFormProps {
  players: Player[];
  onSubmit: (matchData: {
    type: 'ranked' | 'friendly';
    format: 'best_of_3' | 'best_of_1' | 'pro_set' | 'doubles';
    playerA: string;
    playerB: string;
    scores: Array<{ setNumber: number, playerA: number, playerB: number }>;
    acesPlayerA: number;
    acesPlayerB: number;
    matchDate: Date;
    result: 'completed' | 'retirement' | 'walkover';
    retirementScores?: Array<{ setNumber: number, playerA: number, playerB: number }>;
  }) => Promise<{ error: string | null }>;
  onClose: () => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
};

export function MatchLoggingForm({ players, onSubmit, onClose }: MatchLoggingFormProps) {
  const [matchType, setMatchType] = useState<'ranked' | 'friendly'>('ranked');
  const [format, setFormat] = useState<'best_of_3' | 'best_of_1' | 'pro_set' | 'doubles'>('best_of_3');
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [scores, setScores] = useState<Array<{ setNumber: number, playerA: number, playerB: number }>>([
    { setNumber: 1, playerA: 0, playerB: 0 },
    { setNumber: 2, playerA: 0, playerB: 0 },
    { setNumber: 3, playerA: 0, playerB: 0 },
  ]);
  const [acesPlayerA, setAcesPlayerA] = useState(0);
  const [acesPlayerB, setAcesPlayerB] = useState(0);
  const [matchDate, setMatchDate] = useState(new Date());
  const [result, setResult] = useState<'completed' | 'retirement' | 'walkover'>('completed');
  const [retirementScores, setRetirementScores] = useState<Array<{ setNumber: number, playerA: number, playerB: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = players.filter(player => {
    const searchLower = searchQuery.toLowerCase();
    return (
      player.full_name?.toLowerCase().includes(searchLower) ||
      player.username?.toLowerCase().includes(searchLower)
    );
  });

  const calculateWinner = () => {
    if (result === 'walkover') return playerA;

    let setsPlayerA = 0;
    let setsPlayerB = 0;
    const scoresToUse = result === 'retirement' ? retirementScores : scores;

    scoresToUse.forEach(set => {
      if (set.playerA > set.playerB) setsPlayerA++;
      if (set.playerB > set.playerA) setsPlayerB++;
    });

    if (setsPlayerA > setsPlayerB) return playerA;
    if (setsPlayerB > setsPlayerA) return playerB;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!playerA || !playerB) {
        throw new Error('Both players must be selected');
      }

      if (playerA === playerB) {
        throw new Error('Players must be different');
      }

      const { error: submitError } = await onSubmit({
        type: matchType,
        format,
        playerA,
        playerB,
        scores,
        acesPlayerA,
        acesPlayerB,
        matchDate,
        result,
        retirementScores: result === 'retirement' ? retirementScores : undefined,
      });

      if (submitError) throw new Error(submitError);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      data-testid="match-logging-modal"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" data-testid="match-logging-title">Log Match</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            data-testid="match-logging-close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="match-logging-form">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Trophy size={16} className="inline mr-2" />
              Match Type
            </label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as 'ranked' | 'friendly')}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              data-testid="match-type-select"
            >
              <option value="ranked">Ranked Match (Counts towards Leaderboard)</option>
              <option value="friendly">Friendly Match (Does not count)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Award size={16} className="inline mr-2" />
              Match Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
            >
              <option value="best_of_3">Best of 3 Sets</option>
              <option value="best_of_1">Best of 1 Set</option>
              <option value="pro_set">8-Game Pro Set</option>
              <option value="doubles">Doubles - Best of 3</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User size={16} className="inline mr-2" />
                Player A
              </label>
              <select
                value={playerA}
                onChange={(e) => setPlayerA(e.target.value)}
                className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              >
                <option value="">Select Player A</option>
                {filteredPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.full_name}
                    {player.skill_level && ` (Level ${player.skill_level})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <User size={16} className="inline mr-2" />
                Player B
              </label>
              <select
                value={playerB}
                onChange={(e) => setPlayerB(e.target.value)}
                className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              >
                <option value="">Select Player B</option>
                {filteredPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.full_name}
                    {player.skill_level && ` (Level ${player.skill_level})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {matchType === 'ranked' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                <AlertTriangle size={16} className="inline mr-2" />
                Match Result
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as typeof result)}
                className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              >
                <option value="completed">Completed</option>
                <option value="retirement">Retirement</option>
                <option value="walkover">Walkover</option>
              </select>
            </div>
          )}

          {result !== 'walkover' && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Score</h3>
                {scores.map((set, index) => (
                  <div key={set.setNumber} className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs opacity-80 mb-1">
                        Set {set.setNumber} - Player A
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={set.playerA}
                        onChange={(e) => {
                          const newScores = [...scores];
                          newScores[index].playerA = parseInt(e.target.value) || 0;
                          setScores(newScores);
                        }}
                        className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs opacity-80 mb-1">
                        Set {set.setNumber} - Player B
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={set.playerB}
                        onChange={(e) => {
                          const newScores = [...scores];
                          newScores[index].playerB = parseInt(e.target.value) || 0;
                          setScores(newScores);
                        }}
                        className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Star size={16} className="inline mr-2" />
                    Player A Aces
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={acesPlayerA}
                    onChange={(e) => setAcesPlayerA(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Star size={16} className="inline mr-2" />
                    Player B Aces
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={acesPlayerB}
                    onChange={(e) => setAcesPlayerB(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-2" />
              Match Date
            </label>
            <DatePicker
              selected={matchDate}
              onChange={(date) => setMatchDate(date || new Date())}
              maxDate={new Date()}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              dateFormat="MMMM d, yyyy"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm" data-testid="match-logging-error">{error}</p>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors"
              data-testid="match-logging-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              data-testid="match-logging-submit"
            >
              {loading ? 'Saving...' : 'Log Match'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}