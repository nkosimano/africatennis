import { create } from 'zustand';

interface TennisScore {
  games: number;
  sets: number;
  points: number;
  aces: number;
}

interface TennisState {
  playerA: TennisScore;
  playerB: TennisScore;
  currentSet: number;
  history: { playerA: TennisScore; playerB: TennisScore }[];
  addPoint: (player: 'A' | 'B') => void;
  addAce: (player: 'A' | 'B') => void;
  undoLastPoint: () => void;
  resetScore: () => void;
}

const initialScore: TennisScore = {
  games: 0,
  sets: 0,
  points: 0,
  aces: 0,
};

export const useTennisStore = create<TennisState>((set) => ({
  playerA: { ...initialScore },
  playerB: { ...initialScore },
  currentSet: 1,
  history: [],

  addPoint: (player) => set((state) => {
    // Save current state to history
    const newHistory = [...state.history, {
      playerA: { ...state.playerA },
      playerB: { ...state.playerB }
    }];

    const scorer = player === 'A' ? 'playerA' : 'playerB';
    const opponent = player === 'A' ? 'playerB' : 'playerA';
    let newState = { ...state, history: newHistory };

    // Handle deuce and advantage
    if (newState[scorer].points === 3 && newState[opponent].points === 3) {
      newState[scorer].points = 4; // Advantage
    } else if (newState[scorer].points === 3 && newState[opponent].points === 4) {
      newState[scorer].points = 3; // Back to deuce
      newState[opponent].points = 3;
    } else if (newState[scorer].points === 4 || 
              (newState[scorer].points === 3 && newState[opponent].points < 3)) {
      // Win game
      newState[scorer].games += 1;
      newState[scorer].points = 0;
      newState[opponent].points = 0;

      // Check for set win
      if (newState[scorer].games >= 6 && 
          (newState[scorer].games - newState[opponent].games >= 2)) {
        newState[scorer].sets += 1;
        newState[scorer].games = 0;
        newState[opponent].games = 0;
        newState.currentSet += 1;
      }
    } else {
      newState[scorer].points += 1;
    }

    return newState;
  }),

  addAce: (player) => set((state) => {
    // Save current state to history
    const newHistory = [...state.history, {
      playerA: { ...state.playerA },
      playerB: { ...state.playerB }
    }];

    const scorer = player === 'A' ? 'playerA' : 'playerB';
    const opponent = player === 'A' ? 'playerB' : 'playerA';
    let newState = { ...state, history: newHistory };

    // Increment aces count
    newState[scorer].aces += 1;

    // Handle point scoring like a normal point
    if (newState[scorer].points === 3 && newState[opponent].points === 3) {
      newState[scorer].points = 4; // Advantage
    } else if (newState[scorer].points === 3 && newState[opponent].points === 4) {
      newState[scorer].points = 3; // Back to deuce
      newState[opponent].points = 3;
    } else if (newState[scorer].points === 4 || 
              (newState[scorer].points === 3 && newState[opponent].points < 3)) {
      // Win game
      newState[scorer].games += 1;
      newState[scorer].points = 0;
      newState[opponent].points = 0;

      // Check for set win
      if (newState[scorer].games >= 6 && 
          (newState[scorer].games - newState[opponent].games >= 2)) {
        newState[scorer].sets += 1;
        newState[scorer].games = 0;
        newState[opponent].games = 0;
        newState.currentSet += 1;
      }
    } else {
      newState[scorer].points += 1;
    }

    return newState;
  }),

  undoLastPoint: () => set((state) => {
    if (state.history.length === 0) return state;
    
    const newHistory = [...state.history];
    const lastState = newHistory.pop();
    
    if (!lastState) return state;
    
    return {
      ...state,
      playerA: lastState.playerA,
      playerB: lastState.playerB,
      history: newHistory,
    };
  }),

  resetScore: () => set(() => ({
    playerA: { ...initialScore },
    playerB: { ...initialScore },
    currentSet: 1,
    history: [],
  })),
}));
