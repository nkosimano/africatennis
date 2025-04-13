import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, X } from 'lucide-react';

type GamePoint = '0' | '15' | '30' | '40' | 'AD';

interface GameScoreInputProps {
  onSave: (winner: 'A' | 'B') => void;
  onClose: () => void;
  teamAName: string;
  teamBName: string;
}

export function GameScoreInput({
  onSave,
  onClose,
  teamAName,
  teamBName,
}: GameScoreInputProps) {
  const [scoreA, setScoreA] = useState<GamePoint>('0');
  const [scoreB, setScoreB] = useState<GamePoint>('0');

  const pointOrder: GamePoint[] = ['0', '15', '30', '40', 'AD'];

  const adjustScore = (team: 'A' | 'B', increment: boolean) => {
    const currentScore = team === 'A' ? scoreA : scoreB;
    const otherScore = team === 'A' ? scoreB : scoreA;
    const setScore = team === 'A' ? setScoreA : setScoreB;
    const setOtherScore = team === 'A' ? setScoreB : setScoreA;

    if (increment) {
      if (currentScore === '40' && otherScore === '40') {
        setScore('AD');
      } else if (currentScore === '40' && otherScore !== 'AD') {
        onSave(team);
      } else if (currentScore === 'AD') {
        onSave(team);
      } else if (otherScore === 'AD') {
        setOtherScore('40');
      } else {
        const nextIndex = pointOrder.indexOf(currentScore) + 1;
        if (nextIndex < pointOrder.length) {
          setScore(pointOrder[nextIndex]);
        }
      }
    } else {
      if (currentScore === 'AD') {
        setScore('40');
      } else {
        const prevIndex = pointOrder.indexOf(currentScore) - 1;
        if (prevIndex >= 0) {
          setScore(pointOrder[prevIndex]);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text">Current Game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
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
                <span className="text-3xl font-bold text-text bg-surface px-4 py-2 rounded-lg min-w-[80px] text-center">{scoreA}</span>
                <button
                  onClick={() => adjustScore('A', true)}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-text">vs</span>
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
                <span className="text-3xl font-bold text-text bg-surface px-4 py-2 rounded-lg min-w-[80px] text-center">{scoreB}</span>
                <button
                  onClick={() => adjustScore('B', true)}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}