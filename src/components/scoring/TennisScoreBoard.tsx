import { useState, useEffect, useCallback } from 'react';
// @ts-ignore - ToastContainer is used in JSX but TypeScript doesn't detect it
import { toast } from 'react-toastify';
// @ts-ignore - ToastContainer is used in JSX but TypeScript doesn't detect it
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, CheckCircle } from 'lucide-react';



// --- Constants ---
const POINTS_INDEX_40 = 3; // Index corresponding to '40'
const POINTS_INDEX_AD = 4; // Index corresponding to 'AD'
const GAMES_TO_WIN_SET = 6;
const SETS_TO_WIN_MATCH = 2; // Standard best-of-3 sets

// --- Types ---
type Player = 'A' | 'B'; // Represents Player A or Player B

type Score = {
  points: number; // Index in pointsSystem (0=0, 1=15, 2=30, 3=40, 4=AD)
  games: number;  // Games won in the current set
  sets: number;   // Sets won in the match
  aces: number;   // Total aces in the match
};

// Props for the component
type TennisScoreBoardProps = {
  eventId: string;       // Unique ID for the match event
  playerA: string;       // Name of Player A
  playerB: string;       // Name of Player B
  currentUserId: string; // ID of the user recording the score
  playerAId: string;     // Database ID for Player A
  playerBId: string;     // Database ID for Player B - Used in handleMatchSubmission for score updates
};

// Initial state for a player's score
const initialScore: Score = {
  points: 0,
  games: 0,
  sets: 0,
  aces: 0,
};

// --- Helper Functions ---

// Point display is handled inside the component

/**
 * Toggles the serving player.
 * @param current - The current serving player ('A' or 'B').
 * @returns The other player ('B' or 'A').
 */
const toggleServe = (current: Player): Player => {
  return current === 'A' ? 'B' : 'A';
};


// --- React Component ---

export const TennisScoreBoard = ({
  eventId,
  playerA,
  playerB,
  currentUserId,
  playerAId,
  playerBId,
}: TennisScoreBoardProps): JSX.Element => {
  /**
   * Converts a point index to its display value.
   * @param pointIndex - The index of the point (0=0, 1=15, 2=30, 3=40, 4=AD).
   * @returns The string representation of the point for display.
   */
  const getDisplayPoint = (pointIndex: number): string => {
    const pointsSystem = ['0', '15', '30', '40', 'AD'];
    return pointsSystem[pointIndex] || '0';
  };

  // --- State ---
  const [scoreA, setScoreA] = useState<Score>(initialScore);
  const [scoreB, setScoreB] = useState<Score>(initialScore);
  const [servingPlayer, setServingPlayer] = useState<Player>('A'); // Player A serves first by default
  const [matchWinner, setMatchWinner] = useState<Player | null>(null); // Tracks the winner ('A' or 'B') or null
  const [showMatchConfirm, setShowMatchConfirm] = useState(false); // Controls visibility of the match confirmation modal
  const [showUndoConfirm, setShowUndoConfirm] = useState(false); // Controls visibility of the undo confirmation modal
  const [isSubmitting, setIsSubmitting] = useState(false); // Tracks if submission is in progress
  // History for the undo functionality
  const [scoreHistory, setScoreHistory] = useState<{
    scoreA: Score;
    scoreB: Score;
    servingPlayer: Player;
    matchWinner: Player | null;
  }[]>([]);

  // --- Core Game Logic ---

  /**
   * Updates the score based on the latest point change.
   * This function handles game, set, and match completion logic.
   */
  const updateScore = useCallback((): void => {
    let currentScoreA = { ...scoreA };
    let currentScoreB = { ...scoreB };
    let currentServingPlayer = servingPlayer;
    let winner: Player | null = null; // Track if a game/set/match winner occurs in this update

    // --- Game Logic ---
    const playerAPoints = currentScoreA.points;
    const playerBPoints = currentScoreB.points;

    // Check for Advantage/Game win
    if (playerAPoints >= POINTS_INDEX_40 || playerBPoints >= POINTS_INDEX_40) {
      // Deuce: Both players have 40 (index 3)
      if (playerAPoints === POINTS_INDEX_40 && playerBPoints === POINTS_INDEX_40) {
        // Score remains 40-40 (Deuce) - no change needed here, handled by point increment before calling update
      }
      // Advantage Player A: A has AD (index 4), B has 40 (index 3)
      else if (playerAPoints === POINTS_INDEX_AD && playerBPoints === POINTS_INDEX_40) {
        // If A scores again, A wins the game
      }
      // Advantage Player B: B has AD (index 4), A has 40 (index 3)
      else if (playerBPoints === POINTS_INDEX_AD && playerAPoints === POINTS_INDEX_40) {
        // If B scores again, B wins the game
      }
      // Game Player A: A scores on AD or scores when B is 0, 15, or 30
      else if (playerAPoints > POINTS_INDEX_40 || (playerAPoints === POINTS_INDEX_40 && playerBPoints < POINTS_INDEX_40)) {
        winner = 'A';
      }
      // Game Player B: B scores on AD or scores when A is 0, 15, or 30
      else if (playerBPoints > POINTS_INDEX_40 || (playerBPoints === POINTS_INDEX_40 && playerAPoints < POINTS_INDEX_40)) {
        winner = 'B';
      }
      // Back to Deuce: Player with AD loses the point
      else if (playerAPoints === POINTS_INDEX_40 && playerBPoints === POINTS_INDEX_AD) { // B had AD, A scored
          currentScoreB = { ...currentScoreB, points: POINTS_INDEX_40 }; // B back to 40
      } else if (playerBPoints === POINTS_INDEX_40 && playerAPoints === POINTS_INDEX_AD) { // A had AD, B scored
          currentScoreA = { ...currentScoreA, points: POINTS_INDEX_40 }; // A back to 40
      }
    }

    // If a game was won
    if (winner) {
      if (winner === 'A') {
        currentScoreA = { ...currentScoreA, games: currentScoreA.games + 1, points: 0 };
        currentScoreB = { ...currentScoreB, points: 0 };
      } else { // Winner is B
        currentScoreB = { ...currentScoreB, games: currentScoreB.games + 1, points: 0 };
        currentScoreA = { ...currentScoreA, points: 0 };
      }
      currentServingPlayer = toggleServe(currentServingPlayer); // Switch serve after game

      // --- Set Logic ---
      const playerAGames = currentScoreA.games;
      const playerBGames = currentScoreB.games;
      let setWinner: Player | null = null;

      // Standard set win: Reach 6 games with a margin of 2
      if (playerAGames >= GAMES_TO_WIN_SET && playerAGames >= playerBGames + 2) {
        setWinner = 'A';
      } else if (playerBGames >= GAMES_TO_WIN_SET && playerBGames >= playerAGames + 2) {
        setWinner = 'B';
      }
      // Tie-break situation (e.g., 6-6 - simplified here, no tie-break logic implemented)
      // For simplicity, let's assume the first to 7 wins the set in a 6-6 scenario
      else if (playerAGames === GAMES_TO_WIN_SET + 1 && playerBGames === GAMES_TO_WIN_SET) { // 7-6
          setWinner = 'A';
      } else if (playerBGames === GAMES_TO_WIN_SET + 1 && playerAGames === GAMES_TO_WIN_SET) { // 6-7
          setWinner = 'B';
      }
      // Note: A proper tie-break game has its own point system (1, 2, 3...)

      // If a set was won
      if (setWinner) {
        if (setWinner === 'A') {
          currentScoreA = { ...currentScoreA, sets: currentScoreA.sets + 1, games: 0 };
          currentScoreB = { ...currentScoreB, games: 0 };
        } else { // Set winner is B
          currentScoreB = { ...currentScoreB, sets: currentScoreB.sets + 1, games: 0 };
          currentScoreA = { ...currentScoreA, games: 0 };
        }
        // Reset games for the new set

        // --- Match Logic ---
        if (currentScoreA.sets >= SETS_TO_WIN_MATCH) {
          setMatchWinner('A');
        } else if (currentScoreB.sets >= SETS_TO_WIN_MATCH) {
          setMatchWinner('B');
        }
      }
    }

    // Update the state with the calculated scores and serving player
    setScoreA(currentScoreA);
    setScoreB(currentScoreB);
    setServingPlayer(currentServingPlayer);

  }, [scoreA, scoreB, servingPlayer]); // Dependencies for the score update logic


  // --- Effects ---

  // Run score update logic whenever points change
  useEffect(() => {
    // Don't run the update logic if the match is already won
    if (!matchWinner) {
       updateScore();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreA.points, scoreB.points]); // Trigger only when points change

  // Effect to show confirmation modal automatically when a match winner is determined
   useEffect(() => {
    if (matchWinner) {
      setShowMatchConfirm(true);
    }
  }, [matchWinner]);


  // --- Event Handlers ---

  /**
   * Adds a point to the specified player and updates history.
   * @param player - The player ('A' or 'B') who scored the point.
   * @param isAce - Optional flag if the point was an ace.
   */
  const handleAddScore = (player: Player, isAce: boolean = false) => {
    if (matchWinner || isSubmitting) return; // Don't allow score changes if match is over or submitting

    // Save current state BEFORE updating
    setScoreHistory(prev => [...prev, { scoreA, scoreB, servingPlayer, matchWinner }]);

    if (player === 'A') {
      setScoreA(prev => ({
        ...prev,
        points: prev.points + 1,
        aces: isAce ? prev.aces + 1 : prev.aces, // Increment ace count if it was an ace
      }));
    } else { // Player B
      setScoreB(prev => ({
        ...prev,
        points: prev.points + 1,
        aces: isAce ? prev.aces + 1 : prev.aces, // Increment ace count if it was an ace
      }));
    }
    // The useEffect watching scoreA.points/scoreB.points will trigger updateScore()
  };


  /**
   * Toggles the serving player manually.
   */
  const handleToggleServe = () => {
    if (matchWinner || isSubmitting) return;
     // Save current state BEFORE updating serving player manually
    setScoreHistory(prev => [...prev, { scoreA, scoreB, servingPlayer, matchWinner }]);
    setServingPlayer(prev => toggleServe(prev));
  };

  /**
   * Reverts the score to the previous state from history.
   */
  const handleUndo = () => {
     if (isSubmitting) return; // Don't allow undo while submitting

    if (scoreHistory.length > 0) {
      const previousState = scoreHistory[scoreHistory.length - 1];
      setScoreA(previousState.scoreA);
      setScoreB(previousState.scoreB);
      setServingPlayer(previousState.servingPlayer);
      setMatchWinner(previousState.matchWinner); // Restore match winner status
      setScoreHistory(prev => prev.slice(0, -1)); // Remove the last state from history
    }
    setShowUndoConfirm(false); // Close the confirmation modal
  };

  /**
   * Handles the submission of the final match scores to the backend.
   */
  const handleMatchSubmission = async (): Promise<void> => {
    if (!matchWinner || isSubmitting) return; // Only submit if there's a winner and not already submitting

    console.log('Starting match confirmation...', { currentUserId, eventId, playerAId, playerBId });
    setIsSubmitting(true); // Set submitting flag

    try {
      // Validate required data
      if (!eventId || !playerAId || !playerBId) {
        toast.error('Missing required information (event ID or player IDs)');
        setIsSubmitting(false);
        return;
      }

      // Create the score data for Player A
      const playerAScoreData = {
        event_id: eventId,
        player_id: playerAId, 
        set_number: scoreA.sets + scoreB.sets, // Total sets played
        score_team_a: scoreA.sets,
        score_team_b: scoreB.sets,
        recorded_by: currentUserId,
        game_score_detail_json: {
          sets_won: scoreA.sets,
          sets_lost: scoreB.sets,
          games_won: scoreA.games,
          games_lost: scoreB.games,
          aces: scoreA.aces,
          match_winner: matchWinner === 'A'
        }
      };

      // Create the score data for Player B
      const playerBScoreData = {
        event_id: eventId,
        player_id: playerBId,
        set_number: scoreA.sets + scoreB.sets, // Total sets played
        score_team_a: scoreB.sets, // From Player B perspective, their score is first
        score_team_b: scoreA.sets,
        recorded_by: currentUserId,
        game_score_detail_json: {
          sets_won: scoreB.sets,
          sets_lost: scoreA.sets,
          games_won: scoreB.games,
          games_lost: scoreA.games,
          aces: scoreB.aces,
          match_winner: matchWinner === 'B'
        }
      };

      // Insert or update Player A's score
      const { error: playerAError } = await supabase
        .from('match_scores')
        .upsert(playerAScoreData, { onConflict: 'event_id,player_id' });

      if (playerAError) {
        console.error('Error saving player A score:', playerAError);
        toast.error(`Failed to save score for ${playerA}: ${playerAError.message}`);
        setIsSubmitting(false);
        return;
      }
      
      // Insert or update Player B's score
      const { error: playerBError } = await supabase
        .from('match_scores')
        .upsert(playerBScoreData, { onConflict: 'event_id,player_id' });

      if (playerBError) {
        console.error('Error saving player B score:', playerBError);
        toast.error(`Failed to save score for ${playerB}: ${playerBError.message}`);
        setIsSubmitting(false);
        return;
      }
      
      // Mark match as completed in events table to trigger rating update
      let ratingUpdateSuccess = false;
      let ratingUpdateAttempted = false;
      
      try {
        // Update player ATR ratings if this was a ranked match
        if (matchWinner && playerAId && playerBId) {
          ratingUpdateAttempted = true;
          
          // First, get current player ratings
          const { data: playersData, error: playersError } = await supabase
            .from('profiles')
            .select('id, current_ranking_points_singles')
            .in('id', [playerAId, playerBId]);
            
          if (playersError) {
            console.error('Error fetching player ratings:', playersError);
            toast.warning(`Match recorded, but player ratings could not be updated: ${playersError.message}`);
          } else if (!playersData || playersData.length < 2) {
            toast.warning('Match recorded, but player ratings could not be updated: Player data incomplete');
          } else {
            // Store initial ratings for display
            const initialRatings = {
              [playerAId]: playersData.find(p => p.id === playerAId)?.current_ranking_points_singles || 0,
              [playerBId]: playersData.find(p => p.id === playerBId)?.current_ranking_points_singles || 0
            };
            
            // Mark match as complete to trigger rating update
            const { error: updateError } = await supabase
              .from('events')
              .update({ 
                status: 'completed',
                winner_profile_id: matchWinner === 'A' ? playerAId : playerBId
              })
              .eq('id', eventId)
              .select()
              .single();
            
            if (updateError) {
              console.error('Error updating match status:', updateError);
              toast.warning(`Match recorded, but ratings may not be updated: ${updateError.message}`);
            } else {
              // Wait a bit for the database triggers to update ratings
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Get updated ratings to show the changes
              const { data: updatedPlayers, error: fetchError } = await supabase
                .from('profiles')
                .select('id, current_ranking_points_singles')
                .in('id', [playerAId, playerBId]);
                
              if (fetchError) {
                console.error('Error fetching updated ratings:', fetchError);
              } else if (!updatedPlayers || updatedPlayers.length < 2) {
                console.warn('Could not verify rating updates: Player data incomplete');
              } else {
                // Check if ratings actually changed
                const updatedRatings = {
                  [playerAId]: updatedPlayers.find(p => p.id === playerAId)?.current_ranking_points_singles || 0,
                  [playerBId]: updatedPlayers.find(p => p.id === playerBId)?.current_ranking_points_singles || 0
                };
                
                const ratingsChanged = 
                  updatedRatings[playerAId] !== initialRatings[playerAId] || 
                  updatedRatings[playerBId] !== initialRatings[playerBId];
                  
                if (ratingsChanged) {
                  ratingUpdateSuccess = true;
                  toast.success('Match recorded and player ratings updated successfully!');
                  
                  // Show the rating changes
                  const winnerChange = matchWinner === 'A' 
                    ? updatedRatings[playerAId] - initialRatings[playerAId]
                    : updatedRatings[playerBId] - initialRatings[playerBId];
                    
                  const loserChange = matchWinner === 'A'
                    ? updatedRatings[playerBId] - initialRatings[playerBId]
                    : updatedRatings[playerAId] - initialRatings[playerAId];
                    
                  const winnerName = matchWinner === 'A' ? playerA : playerB;
                  const loserName = matchWinner === 'A' ? playerB : playerA;
                  
                  toast.info(`Rating changes: ${winnerName}: ${winnerChange > 0 ? '+' : ''}${winnerChange.toFixed(2)}, ${loserName}: ${loserChange > 0 ? '+' : ''}${loserChange.toFixed(2)}`);
                } else {
                  toast.info('Match recorded, but no rating changes were detected.');
                }
              }
            }
          }
        }
      } catch (ratingErr) {
        console.error('Error in rating update process:', ratingErr);
        toast.warning(`Match recorded, but there was an issue with rating updates: ${ratingErr instanceof Error ? ratingErr.message : 'Unknown error'}`);
      }
      
      // Show success message
      if (!ratingUpdateAttempted) {
        toast.success('Match score recorded successfully!');
      } else if (!ratingUpdateSuccess) {
        toast.success('Match score recorded successfully! (Rating update status: pending)');
      }
      
      // Don't navigate away - just close the modal
      setShowMatchConfirm(false);
      
    } catch (error) {
      console.error('Error submitting match score:', error);
      toast.error(`Failed to submit match score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  return (
    // Main container with padding and dark background
    <div className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col bg-gradient-to-br from-[#014B32] to-[#012A1D] font-sans">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6 sm:mb-8 text-white">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Don't navigate, just close the scoreboard
            // The parent component will handle this
          }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Go back"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg sm:text-xl font-semibold text-center">
          {playerA} vs {playerB}
        </h2>
        <div className="w-10"></div> {/* Spacer to balance the back button */}
      </div>

      {/* Match Winner Display */}
      {matchWinner && !showMatchConfirm && ( // Show winner only if declared and modal is hidden
          <div className="mb-4 text-center text-2xl font-bold text-yellow-400 animate-pulse">
              Match Winner: {matchWinner === 'A' ? playerA : playerB}!
          </div>
      )}

      {/* Score Grid */}
      <div className="grid grid-cols-3 gap-y-4 sm:gap-y-6 text-center items-center mb-8 sm:mb-12">
        {/* Row 1: Player Names */}
        <div className="text-xl sm:text-2xl font-bold text-right text-white">{playerA}</div>
        <div></div> {/* Center spacer */}
        <div className="text-xl sm:text-2xl font-bold text-left text-white">{playerB}</div>

        {/* Row 2: Serving Indicator */}
        <div className={`text-right ${servingPlayer === 'A' ? 'visible' : 'invisible'}`}>
          <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-pulse" title={`${playerA} Serving`}></span>
        </div>
        <div className="text-xs sm:text-sm font-light text-white/70 uppercase self-center">Serving</div>
        <div className={`text-left ${servingPlayer === 'B' ? 'visible' : 'invisible'}`}>
          <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-pulse" title={`${playerB} Serving`}></span>
        </div>

        {/* Row 3: Sets */}
        <div className="text-4xl sm:text-5xl font-bold text-right text-white tabular-nums">{scoreA.sets}</div>
        <div className="text-base sm:text-lg font-medium text-white text-center self-center uppercase">Sets</div>
        <div className="text-4xl sm:text-5xl font-bold text-left text-white tabular-nums">{scoreB.sets}</div>

        {/* Row 4: Games */}
        <div className="text-4xl sm:text-5xl font-bold text-right text-white tabular-nums">{scoreA.games}</div>
        <div className="text-base sm:text-lg font-medium text-white text-center self-center uppercase">Games</div>
        <div className="text-4xl sm:text-5xl font-bold text-left text-white tabular-nums">{scoreB.games}</div>

        {/* Row 5: Points */}
        <div className="text-4xl sm:text-5xl font-bold text-right text-white tabular-nums min-w-[3ch]">{getDisplayPoint(scoreA.points)}</div>
        <div className="text-base sm:text-lg font-medium text-white text-center self-center uppercase">Points</div>
        <div className="text-4xl sm:text-5xl font-bold text-left text-white tabular-nums min-w-[3ch]">{getDisplayPoint(scoreB.points)}</div>

        {/* Row 6: Aces */}
        <div className="text-2xl sm:text-3xl font-bold text-right text-yellow-400 tabular-nums">{scoreA.aces}</div>
        <div className="text-base sm:text-xl font-medium text-white text-center self-center uppercase">Aces</div>
        <div className="text-2xl sm:text-3xl font-bold text-left text-yellow-400 tabular-nums">{scoreB.aces}</div>
      </div>

      {/* Controls Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto pt-12 relative">
        {/* Confirm Match Button (Centered above controls) */}
        {/* Show only if a winner is decided, or allow manual confirmation */}
         <button
          onClick={() => setShowMatchConfirm(true)}
          className={`absolute -top-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${matchWinner ? 'animate-bounce' : ''}`}
          disabled={isSubmitting} // Disable while submitting
        >
          <CheckCircle className="w-5 h-5" />
          {matchWinner ? 'Confirm Winner' : 'End & Confirm'}
        </button>

        {/* Player A Controls */}
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => handleAddScore('A', true)} // Add Ace for A
            className="w-full py-3 sm:py-4 bg-yellow-400 hover:bg-yellow-500 text-[#014B32] text-base sm:text-lg font-bold rounded transition-colors disabled:opacity-50"
            disabled={!!matchWinner || isSubmitting} // Disable if match over or submitting
          >
            Ace {playerA}
          </button>
          <button
            onClick={() => handleAddScore('A', false)} // Add Point for A
            className="w-full py-4 sm:py-6 bg-white hover:bg-gray-200 text-[#014B32] text-lg sm:text-xl font-bold rounded transition-colors disabled:opacity-50"
            disabled={!!matchWinner || isSubmitting} // Disable if match over or submitting
          >
            Point {playerA}
          </button>
          <button
            onClick={() => setShowUndoConfirm(true)} // Show Undo confirmation
            className="w-full py-3 sm:py-4 border border-white/30 hover:bg-white/10 text-white rounded flex items-center justify-center gap-2 transition-colors text-sm sm:text-base disabled:opacity-50"
            disabled={scoreHistory.length === 0 || isSubmitting} // Disable if no history or submitting
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Undo Last
          </button>
        </div>

        {/* Player B Controls */}
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => handleAddScore('B', true)} // Add Ace for B
            className="w-full py-3 sm:py-4 bg-yellow-400 hover:bg-yellow-500 text-[#014B32] text-base sm:text-lg font-bold rounded transition-colors disabled:opacity-50"
            disabled={!!matchWinner || isSubmitting} // Disable if match over or submitting
          >
            Ace {playerB}
          </button>
          <button
            onClick={() => handleAddScore('B', false)} // Add Point for B
            className="w-full py-4 sm:py-6 bg-white hover:bg-gray-200 text-[#014B32] text-lg sm:text-xl font-bold rounded transition-colors disabled:opacity-50"
            disabled={!!matchWinner || isSubmitting} // Disable if match over or submitting
          >
            Point {playerB}
          </button>
          <button
            onClick={handleToggleServe}
            className="w-full py-3 sm:py-4 border border-white/30 hover:bg-white/10 text-white rounded transition-colors text-sm sm:text-base disabled:opacity-50"
            disabled={!!matchWinner || isSubmitting} // Disable if match over or submitting
          >
            Toggle Serve
          </button>
        </div>
      </div>

      {/* Match Confirmation Modal */}
      {showMatchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {matchWinner ? `Confirm Winner: ${matchWinner === 'A' ? playerA : playerB}` : 'Confirm Final Score?'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {matchWinner ? 'The match appears to be complete.' : 'Are you sure you want to end the match and submit this score?'}
              Please verify the final score below: <br />
              <span className="font-medium">{playerA}:</span> {scoreA.sets} Sets, {scoreA.games} Games <br />
              <span className="font-medium">{playerB}:</span> {scoreB.sets} Sets, {scoreB.games} Games
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMatchConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleMatchSubmission}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                disabled={isSubmitting} // Disable button while submitting
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                   'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {showUndoConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Undo</h3>
             <p className="text-sm text-gray-600 mb-6">
               Are you sure you want to undo the last action? This will revert the score to its previous state.
             </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUndoConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUndo}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Confirm Undo
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Use ToastContainer */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

// Example of how to use the component (replace with your actual app structure)
/*
function App() {
  return (
    <TennisScoreBoard
      eventId="match123"
      playerA="Player 1"
      playerB="Player 2"
      currentUserId="userABC"
      playerAId="p1"
      playerBId="p2"
    />
  );
}

export default App;
*/
