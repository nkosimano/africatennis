import { create } from 'zustand';

interface ScoreState {
  scoreA: number;
  scoreB: number;
  history: { scoreA: number; scoreB: number }[];
  setScoreA: (score: number) => void;
  setScoreB: (score: number) => void;
  resetScores: () => void;
  undoLastScore: () => void;
  addToHistory: () => void;
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  scoreA: 0,
  scoreB: 0,
  history: [],
  setScoreA: (score: number) => set({ scoreA: score }),
  setScoreB: (score: number) => set({ scoreB: score }),
  resetScores: () => set({ scoreA: 0, scoreB: 0, history: [] }),
  undoLastScore: () => {
    const { history } = get();
    if (history.length > 0) {
      const lastScore = history[history.length - 1];
      set({
        scoreA: lastScore.scoreA,
        scoreB: lastScore.scoreB,
        history: history.slice(0, -1),
      });
    }
  },
  addToHistory: () => {
    const { scoreA, scoreB, history } = get();
    set({
      history: [...history, { scoreA, scoreB }],
    });
  },
}));
