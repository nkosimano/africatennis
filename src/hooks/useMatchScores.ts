// src/hooks/useMatchScores.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MatchScore {
  id: string;
  event_id: string;
  set_number: number;
  score_team_a: number;
  score_team_b: number;
  tiebreak_score_team_a: number | null;
  tiebreak_score_team_b: number | null;
  created_at: string;
  recorded_by: string | null;
  game_score_detail_json: any | null;
}

export function useMatchScores(eventId: string) {
  const { user } = useAuth();
  const [eventType, setEventType] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [scores, setScores] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when eventId changes or becomes invalid
    setEventType(null);
    setEventStatus(null);
    setScores([]);
    setError(null);
    if (!eventId) {
        setLoading(false); // Set loading false if no eventId
        return;
    }
    // Set loading true only when fetching
    setLoading(true);
    fetchScores();
  }, [eventId]); // Dependency array includes eventId

  const fetchScores = async () => {
    if (!eventId) return;
    
    try {
      // Get event details first
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('event_type, status')
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Error fetching event details for', eventId, ':', eventError);
        return;
      }
      
      // Set event type and status from fetched data
      setEventType(eventData.event_type);
      setEventStatus(eventData.status);

      // Get match scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('match_scores')
        .select('*')
        .eq('event_id', eventId);

      if (scoresError) {
        console.error('Error fetching match scores:', scoresError);
        return;
      }

      setScores(scoresData || []);
    } catch (error) {
      console.error('Overall error in fetchScores for', eventId, ':', error);
    }
  };

  // THIS IS THE UPDATED addScore function with corrected permission checks
  const addScore = async (score: Omit<MatchScore, 'id'>) => {
    try {
      if (!user) throw new Error('User must be authenticated to add scores');
       // Ensure eventId from hook props matches score object if provided, or use hook's eventId
       const currentEventId = eventId || score.event_id;
       if (!currentEventId) throw new Error('Event ID is missing.');


      // Ensure event details are loaded before proceeding
      // Attempt to refresh if state is missing (might happen on first load)
      if (!eventType || !eventStatus) {
         console.warn(`Event type/status not loaded for ${currentEventId}, attempting refetch...`);
         await fetchScores();
         // Re-check state after attempting fetch
         if (!eventType || !eventStatus) {
              console.error(`Event details still not loaded for ${currentEventId} after refetch.`);
              throw new Error('Event details could not be loaded. Please refresh and try again.');
          }
       }

      // Check if the event is in a valid status for score updates
      if (!['scheduled', 'in_progress'].includes(eventStatus)) {
        console.warn(`Attempted to add score for event ${currentEventId} with status ${eventStatus}. Denied by hook.`);
        throw new Error(`Scores can only be added for scheduled or in-progress events (current status: ${eventStatus})`);
      }

      console.log(`Attempting to add score by user ${user.id}. Event ${currentEventId}, Type: ${eventType}, Status: ${eventStatus}`);

      let canAddScore = false; // Flag to check if permission is granted by logic

      // --- ** MODIFIED PERMISSION CHECK LOGIC ** ---
      if (eventType === 'match_singles_ranked') {
        // For ranked matches, check if the user is an umpire for this specific event
        const { data: participantData, error: participantError } = await supabase
          .from('event_participants')
          .select('role')
          .eq('event_id', currentEventId) // Use currentEventId
          .eq('profile_id', user.id)
          .maybeSingle(); // Handles not being a participant

        if (participantError) {
            console.error(`Error checking participant role for ranked match ${currentEventId}:`, participantError);
            throw participantError;
        }

        console.log(`Ranked match check: User ${user.id} role is ${participantData?.role}`);
        // Handle the case where 'umpire' might not be a valid role in the database
        if (participantData?.role === 'umpire' || false) {
          canAddScore = true;
        } else {
          // Throw specific error if not umpire for ranked
          throw new Error('Only umpires can add scores for ranked matches.');
        }

      } else if (eventType === 'match_singles_friendly') {
        // For friendly matches, check if user is creator OR challenger/opponent
        // Fetch event creator ID (might already be in eventData from fetchScores)
         const { data: eventCreatorData, error: eventCreatorError } = await supabase
             .from('events')
             .select('created_by')
             .eq('id', currentEventId)
             .single(); // Assume event exists

         if (eventCreatorError) {
             console.error(`Error fetching creator for friendly match ${currentEventId}:`, eventCreatorError);
             throw eventCreatorError;
         }

        if (eventCreatorData?.created_by === user.id) {
          console.log(`Friendly match check: User ${user.id} IS the creator.`);
          canAddScore = true;
        } else {
          // If not creator, check if they are a participant with allowed role
          const { data: participantData, error: participantError } = await supabase
            .from('event_participants')
            .select('role')
            .eq('event_id', currentEventId) // Use currentEventId
            .eq('profile_id', user.id)
            .maybeSingle(); // Handles not being a participant

          if (participantError) {
              console.error(`Error checking participant role for friendly match ${currentEventId}:`, participantError);
              throw participantError;
          }

          console.log(`Friendly match check: User ${user.id} is NOT creator. User role is ${participantData?.role}`);
          // Check if the fetched role is 'challenger' or 'opponent'
          if (participantData?.role && ['challenger', 'opponent'].includes(participantData.role)) {
            canAddScore = true;
          }
          // No explicit 'else throw' here, if canAddScore remains false, the final check will catch it.
        }
      }
      else if (eventType === 'match_doubles_friendly') {
        // For friendly doubles matches, check if user is creator OR a player
        const { data: eventCreatorData, error: eventCreatorError } = await supabase
            .from('events')
            .select('created_by')
            .eq('id', currentEventId)
            .single();

        if (eventCreatorError) {
            console.error(`Error fetching creator for friendly doubles match ${currentEventId}:`, eventCreatorError);
            throw eventCreatorError;
        }

        if (eventCreatorData?.created_by === user.id) {
          console.log(`Friendly doubles match check: User ${user.id} IS the creator.`);
          canAddScore = true;
        } else {
          // If not creator, check if they are a participant with allowed role
          const { data: participantData, error: participantError } = await supabase
            .from('event_participants')
            .select('role')
            .eq('event_id', currentEventId)
            .eq('profile_id', user.id)
            .maybeSingle();

          if (participantError) {
              console.error(`Error checking participant role for friendly doubles match ${currentEventId}:`, participantError);
              throw participantError;
          }

          console.log(`Friendly doubles match check: User ${user.id} is NOT creator. User role is ${participantData?.role}`);
          // Check if the fetched role is any player role in doubles
          if (participantData?.role && ['player_team_a1', 'player_team_a2', 'player_team_b1', 'player_team_b2'].includes(participantData.role)) {
            canAddScore = true;
          }
        }
      }
      else if (eventType === 'match_doubles_ranked') {
        // For ranked doubles matches, only umpires can add scores (same as singles ranked)
        const { data: participantData, error: participantError } = await supabase
          .from('event_participants')
          .select('role')
          .eq('event_id', currentEventId)
          .eq('profile_id', user.id)
          .maybeSingle();

        if (participantError) {
            console.error(`Error checking participant role for ranked doubles match ${currentEventId}:`, participantError);
            throw participantError;
        }

        console.log(`Ranked doubles match check: User ${user.id} role is ${participantData?.role}`);
        if (participantData?.role === 'umpire' || false) {
          canAddScore = true;
        } else {
          throw new Error('Only umpires can add scores for ranked doubles matches.');
        }
      }
      // Add checks for 'match_doubles_friendly', 'match_doubles_ranked' etc. if needed
      else {
         console.warn(`Score addition not explicitly handled for event type: ${eventType}`);
         // Depending on requirements, either deny or allow based on a default rule
         // Denying by default:
          throw new Error(`Score addition not configured for this event type (${eventType}).`);
      }

      // Final check before attempting insert
      if (!canAddScore) {
          // This should ideally not be reached if logic above is complete and RLS is aligned,
          // but acts as a final safeguard in the hook.
          console.error(`Hook permission check failed for user ${user.id} on event ${currentEventId}.`);
          throw new Error('You do not have permission to add scores according to application rules.');
      }
      // --- ** END MODIFIED PERMISSION CHECK ** ---


      // Proceed with the insert if permission checks passed
      console.log(`Hook permission granted, attempting insert into match_scores for event ${currentEventId}`);
      // Ensure the score object being inserted includes the correct event_id
      const scoreToInsert = { ...score, event_id: currentEventId };

      const { data, error: insertError } = await supabase
        .from('match_scores')
        .insert([scoreToInsert]) // Use the score object passed as argument, ensuring event_id is correct
        .select()
        .single();

      if (insertError) {
          console.error(`Supabase insert error for match_scores (Event ${currentEventId}):`, insertError);
          // This is where the RLS error "violates row-level security policy" would likely appear if it persists
          throw insertError; // Rethrow the Supabase error
      }

      console.log(`Score added successfully for event ${currentEventId}`);
      // Optimistically update the local state for faster UI feedback
      setScores(prev => [...prev, data]);
      // await fetchScores(); // Alternatively, refetch state from DB if needed
      return { error: null };

    } catch (err) {
      console.error(`Error in addScore function for event ${eventId}:`, err); // Log the final caught error
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while adding the score.';
      setError(message); // Set hook's error state
      return { error: message }; // Return error object
    }
  };


  const updateScore = async (scoreId: string, updates: Partial<MatchScore>) => {
      // ** TODO: Implement similar permission logic here as in addScore **
      // 1. Check user authentication.
      // 2. Ensure eventType and eventStatus are loaded (maybe call fetchScores if needed).
      // 3. Check if eventStatus is 'scheduled' or 'in_progress' (or maybe 'completed' if edits are allowed post-match).
      // 4. Based on eventType, check if the current user has the required role (creator, umpire, player etc.)
      //    using DB queries like in addScore.
      // 5. If checks pass, proceed with the update. If not, throw an appropriate error.

     try {
        if (!user) throw new Error('User must be authenticated to update scores');
        if (!eventType || !eventStatus) { // Check if event context is loaded
           console.warn(`Event details not loaded for score update (Score ID: ${scoreId}). Attempting refetch.`);
           await fetchScores();
           if (!eventType || !eventStatus) {
               throw new Error('Event details could not be loaded. Cannot verify permissions.');
           }
        }

       // --- TEMPORARY: Add Warning ---
       console.warn(`updateScore for ID ${scoreId} needs proper permission checks implemented similar to addScore.`);
       // --- Remove warning once checks are implemented ---


       // Example Placeholder Check (Replace with full logic like addScore)
        let canUpdateScore = false;
        if (eventType === 'match_singles_ranked') {
             // Simplified check - assumes umpire role (add full DB query later)
             console.warn("Assuming user is umpire for ranked update check - IMPLEMENT FULL CHECK");
             canUpdateScore = true; // Placeholder
         } else if (eventType === 'match_singles_friendly') {
             // Simplified check - assumes creator/player (add full DB query later)
              console.warn("Assuming user is creator/player for friendly update check - IMPLEMENT FULL CHECK");
             canUpdateScore = true; // Placeholder
         } else if (eventType === 'match_doubles_ranked') {
             // Simplified check - assumes umpire role (add full DB query later)
             console.warn("Assuming user is umpire for ranked doubles update check - IMPLEMENT FULL CHECK");
             canUpdateScore = true; // Placeholder
         } else if (eventType === 'match_doubles_friendly') {
             // Simplified check - assumes creator/player (add full DB query later)
              console.warn("Assuming user is creator/player for friendly doubles update check - IMPLEMENT FULL CHECK");
             canUpdateScore = true; // Placeholder
         } else {
              throw new Error(`Score updates not configured for event type ${eventType}`);
         }

         if (!canUpdateScore) {
             throw new Error("You do not have permission to update this score.");
         }


       // Proceed with update if checks pass
       console.log(`Attempting to update match_score ${scoreId} with:`, updates);
       const { data, error: updateError } = await supabase
         .from('match_scores')
         .update(updates)
         .eq('id', scoreId) // Use scoreId to target the specific score row
         .select()
         .single();

       if (updateError) {
            console.error(`Error updating score ${scoreId}:`, updateError);
            throw updateError; // Rethrow Supabase error (could be RLS)
        }

       console.log(`Score ${scoreId} updated successfully.`);
       // Update local state
       setScores(prev => prev.map(score => score.id === scoreId ? data : score));
       return { error: null };

     } catch (err) {
       console.error(`Error in updateScore function for score ${scoreId}:`, err);
       const message = err instanceof Error ? err.message : 'An error occurred while updating the score.';
       setError(message);
       return { error: message };
     }
   };


  // Return hook state and functions
  return {
    scores,
    eventType,
    eventStatus,
    loading,
    error,
    addScore,
    updateScore,
    refresh: fetchScores,
  };
}