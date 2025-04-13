import { useState } from 'react';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../lib/supabase';
import { PlusCircle, MinusCircle, RotateCcw, CheckCircle } from 'lucide-react';

// Props for the component
type SimpleScoreBoardProps = {
  eventId: string;
  playerA: string;
  playerB: string;
  currentUserId: string;
  playerAId: string;
  playerBId: string;
  onClose: () => void;
};

export const SimpleScoreBoard = ({
  eventId,
  playerA,
  playerB,
  currentUserId,
  playerAId,
  playerBId,
  onClose
}: SimpleScoreBoardProps) => {
  // State for scores
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle score changes
  const incrementScore = (player: 'A' | 'B') => {
    if (player === 'A') {
      setScoreA(prev => prev + 1);
    } else {
      setScoreB(prev => prev + 1);
    }
  };
  
  const decrementScore = (player: 'A' | 'B') => {
    if (player === 'A') {
      setScoreA(prev => Math.max(0, prev - 1));
    } else {
      setScoreB(prev => Math.max(0, prev - 1));
    }
  };
  
  const resetScores = () => {
    setScoreA(0);
    setScoreB(0);
  };
  
  // Submit final score
  const submitScore = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Create score object
      const scoreData = {
        event_id: eventId,
        set_number: 1, // Assuming this is the first set
        score_team_a: scoreA,
        score_team_b: scoreB,
        recorded_by: currentUserId,
        created_at: new Date().toISOString()
      };
      
      // Save to database
      const { error } = await supabase
        .from('match_scores')
        .insert(scoreData);
        
      if (error) {
        throw error;
      }
      
      toast.success('Score saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error(`Failed to save score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-8">Simple Score Tracker</h2>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Player A */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">{playerA}</h3>
          <div className="text-5xl font-bold mb-4">{scoreA}</div>
          <div className="flex gap-2">
            <button 
              onClick={() => incrementScore('A')}
              className="p-2 bg-green-600 rounded-full hover:bg-green-700 transition-colors"
              disabled={isSubmitting}
            >
              <PlusCircle size={24} />
            </button>
            <button 
              onClick={() => decrementScore('A')}
              className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              disabled={isSubmitting || scoreA === 0}
            >
              <MinusCircle size={24} />
            </button>
          </div>
        </div>
        
        {/* Player B */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">{playerB}</h3>
          <div className="text-5xl font-bold mb-4">{scoreB}</div>
          <div className="flex gap-2">
            <button 
              onClick={() => incrementScore('B')}
              className="p-2 bg-green-600 rounded-full hover:bg-green-700 transition-colors"
              disabled={isSubmitting}
            >
              <PlusCircle size={24} />
            </button>
            <button 
              onClick={() => decrementScore('B')}
              className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              disabled={isSubmitting || scoreB === 0}
            >
              <MinusCircle size={24} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={resetScores}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          disabled={isSubmitting}
        >
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
        
        <button
          onClick={submitScore}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              <span>Save Score</span>
            </>
          )}
        </button>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};
