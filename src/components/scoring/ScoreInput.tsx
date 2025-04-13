import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Save, X } from 'lucide-react';
import { GameScoreInput } from './GameScoreInput';

interface ScoreInputProps {
  onSave: (scores: {
    set_number: number;
    score_team_a: number;
    score_team_b: number;
    tiebreak_score_team_a?: number;
    tiebreak_score_team_b?: number;
    game_score_detail_json?: {
      games: Array<{
        winner: 'A' | 'B';
        game_number: number;
      }>;
    };
  }) => Promise<{ error: string | null }>;
  onClose: () => void;
  setNumber: number;
  teamAName: string;
  teamBName: string;
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

export function ScoreInput({
  onSave,
  onClose,
  setNumber,
  teamAName,
  teamBName,
}: ScoreInputProps) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [tiebreakA, setTiebreakA] = useState<number | undefined>(undefined);
  const [tiebreakB, setTiebreakB] = useState<number | undefined>(undefined);
  const [gameHistory, setGameHistory] = useState<Array<{ winner: 'A' | 'B'; game_number: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGameScore, setShowGameScore] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: saveError } = await onSave({
        set_number: setNumber,
        score_team_a: scoreA,
        score_team_b: scoreB,
        tiebreak_score_team_a: tiebreakA,
        tiebreak_score_team_b: tiebreakB,
        game_score_detail_json: {
          games: gameHistory,
        },
      });

      if (saveError) throw new Error(saveError);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGameWin = async (winner: 'A' | 'B') => {
    setLoading(true);
    setError(null);

    try {
      const newGameHistory = [
        ...gameHistory,
        { winner, game_number: gameHistory.length + 1 },
      ];
      setGameHistory(newGameHistory);

      if (winner === 'A') {
        setScoreA(prev => prev + 1);
      } else {
        setScoreB(prev => prev + 1);
      }

      const { error: saveError } = await onSave({
        set_number: setNumber,
        score_team_a: winner === 'A' ? scoreA + 1 : scoreA,
        score_team_b: winner === 'B' ? scoreB + 1 : scoreB,
        tiebreak_score_team_a: tiebreakA,
        tiebreak_score_team_b: tiebreakB,
        game_score_detail_json: {
          games: newGameHistory,
        },
      });

      if (saveError) throw new Error(saveError);
      setShowGameScore(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const adjustScore = (team: 'A' | 'B', increment: boolean) => {
    if (team === 'A') {
      setScoreA(prev => Math.max(0, increment ? prev + 1 : prev - 1));
    } else {
      setScoreB(prev => Math.max(0, increment ? prev + 1 : prev - 1));
    }
  };

  const adjustTiebreak = (team: 'A' | 'B', increment: boolean) => {
    if (team === 'A') {
      setTiebreakA(prev => prev === undefined ? 0 : Math.max(0, increment ? prev + 1 : prev - 1));
    } else {
      setTiebreakB(prev => prev === undefined ? 0 : Math.max(0, increment ? prev + 1 : prev - 1));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[50]"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text">Set {setNumber} Score</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-medium mb-2 text-text">{teamAName}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => adjustScore('A', false)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold text-text">{scoreA}</span>
                  <button
                    onClick={() => adjustScore('A', true)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-3xl font-bold text-text">-</span>
              </div>

              <div className="text-center">
                <p className="font-medium mb-2 text-text">{teamBName}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => adjustScore('B', false)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold text-text">{scoreB}</span>
                  <button
                    onClick={() => adjustScore('B', true)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {scoreA === 6 && scoreB === 6 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-text">Tiebreak Score</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => adjustTiebreak('A', false)}
                        className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="text-2xl font-bold text-text">{tiebreakA ?? 0}</span>
                      <button
                        onClick={() => adjustTiebreak('A', true)}
                        className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="text-3xl font-bold text-text">-</span>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => adjustTiebreak('B', false)}
                        className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="text-2xl font-bold text-text">{tiebreakB ?? 0}</span>
                      <button
                        onClick={() => adjustTiebreak('B', true)}
                        className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGameScore(true)}
              className="w-full px-4 py-2 bg-accent bg-opacity-10 text-accent rounded-lg hover:bg-opacity-20 transition-colors"
            >
              Score Current Game
            </button>

            {gameHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Game History</h3>
                <div className="flex flex-wrap gap-2">
                  {gameHistory.map((game, index) => (
                    <div
                      key={index}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        game.winner === 'A'
                          ? 'bg-green-500 bg-opacity-20 text-green-500'
                          : 'bg-blue-500 bg-opacity-20 text-blue-500'
                      }`}
                    >
                      Game {game.game_number}: {game.winner === 'A' ? teamAName : teamBName}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors text-text"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span>Save Score</span>
            </button>
          </div>
        </div>
      </motion.div>

      {showGameScore && (
        <GameScoreInput
          onSave={handleGameWin}
          onClose={() => setShowGameScore(false)}
          teamAName={teamAName}
          teamBName={teamBName}
        />
      )}
    </motion.div>
  );
}