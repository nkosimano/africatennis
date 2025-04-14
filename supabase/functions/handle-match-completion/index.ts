import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MatchCompletionPayload {
  match_id: string
  event_id: string
  winner_id: string
  loser_id: string
  score_summary: {
    sets: Array<{
      team_a: number
      team_b: number
      tiebreak_team_a?: number
      tiebreak_team_b?: number
    }>
  }
}

interface SystemSettings {
  provisional_k_factor: number
  established_k_factor: number
  initial_rating: number
  matches_for_established: number
  rating_scale_min: number
  rating_scale_max: number
}

serve(async (req) => {
  try {
    const payload: MatchCompletionPayload = await req.json()
    const { match_id, event_id, winner_id, loser_id, score_summary } = payload

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get system settings
    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('system_settings')
      .select('*')
      .eq('id', 'rating_settings')
      .single()

    if (settingsError) throw settingsError

    const settings: SystemSettings = settingsData

    // 1. Update match status
    await supabaseClient
      .from('events')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', event_id)

    // 2. Calculate games won percentage
    const totalGamesWinner = score_summary.sets.reduce((acc, set) => acc + Math.max(set.team_a, set.team_b), 0)
    const totalGamesLoser = score_summary.sets.reduce((acc, set) => acc + Math.min(set.team_a, set.team_b), 0)
    const totalGames = totalGamesWinner + totalGamesLoser
    const winnerGamePercentage = totalGamesWinner / totalGames

    // 3. Get current ratings
    const { data: ratings } = await supabaseClient
      .from('profiles')
      .select('id, current_ranking_points_singles, singles_matches_played')
      .in('id', [winner_id, loser_id])

    const winnerRating = ratings?.find(r => r.id === winner_id)?.current_ranking_points_singles || settings.initial_rating
    const loserRating = ratings?.find(r => r.id === loser_id)?.current_ranking_points_singles || settings.initial_rating
    const winnerMatchesPlayed = ratings?.find(r => r.id === winner_id)?.singles_matches_played || 0

    // 4. Calculate new ratings using modified Elo formula with game percentage
    const K = winnerMatchesPlayed < settings.matches_for_established 
      ? settings.provisional_k_factor 
      : settings.established_k_factor

    const expectedScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
    const actualScore = winnerGamePercentage // Use actual game win percentage instead of binary 1/0
    
    const ratingChange = Math.round(K * (actualScore - expectedScore))
    
    // Ensure ratings stay within the defined scale
    const winnerNewRating = Math.min(
      Math.max(winnerRating + ratingChange, settings.rating_scale_min),
      settings.rating_scale_max
    )
    const loserNewRating = Math.min(
      Math.max(loserRating - ratingChange, settings.rating_scale_min),
      settings.rating_scale_max
    )

    // 5. Update player ratings and match counts
    await supabaseClient.from('profiles').update({
      current_ranking_points_singles: winnerNewRating,
      singles_matches_played: winnerMatchesPlayed + 1,
      rating_status: winnerMatchesPlayed + 1 >= settings.matches_for_established ? 'Established' : 'Provisional'
    }).eq('id', winner_id)

    await supabaseClient.from('profiles').update({
      current_ranking_points_singles: loserNewRating,
      singles_matches_played: winnerMatchesPlayed + 1,
      rating_status: winnerMatchesPlayed + 1 >= settings.matches_for_established ? 'Established' : 'Provisional'
    }).eq('id', loser_id)

    // 6. Record rating history
    await supabaseClient.from('ranking_history').insert([
      {
        profile_id: winner_id,
        ranking_type: 'singles',
        points: winnerNewRating,
        points_change: ratingChange,
        calculation_date: new Date().toISOString()
      },
      {
        profile_id: loser_id,
        ranking_type: 'singles',
        points: loserNewRating,
        points_change: -ratingChange,
        calculation_date: new Date().toISOString()
      }
    ])

    // 7. Create achievement if applicable (e.g., first win, rating milestone)
    if (winnerMatchesPlayed === 0) {
      await supabaseClient.from('player_achievements').insert({
        player_id: winner_id,
        achievement_type: 'first_win',
        achievement_date: new Date().toISOString(),
        description: 'Won first match!'
      })
    }

    // Check for rating milestone achievements
    const ratingMilestones = [1400, 1600, 1800, 2000]
    const previousRating = winnerRating
    const newMilestones = ratingMilestones.filter(
      milestone => previousRating < milestone && winnerNewRating >= milestone
    )

    for (const milestone of newMilestones) {
      await supabaseClient.from('player_achievements').insert({
        player_id: winner_id,
        achievement_type: 'rating_milestone',
        achievement_date: new Date().toISOString(),
        description: `Reached ${milestone} rating!`,
        data: { milestone }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        winner_new_rating: winnerNewRating,
        loser_new_rating: loserNewRating
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 