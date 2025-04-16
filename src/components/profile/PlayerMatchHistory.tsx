import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Event } from '../../hooks/useEvents';
import { supabase } from '../../lib/supabase';

interface MatchResult {
  isWinner: boolean;
  score: string;
  opponentName: string;
}

interface PlayerMatchHistoryProps {
  profileId: string;
  profileMatches: Event[];
}

export function PlayerMatchHistory({ profileId, profileMatches }: PlayerMatchHistoryProps) {
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({});

  useEffect(() => {
    const loadMatchResults = async () => {
      const results: Record<string, MatchResult> = {};
      for (const match of profileMatches) {
        results[match.id] = await getMatchResult(match);
      }
      setMatchResults(results);
    };
    loadMatchResults();
  }, [profileMatches, profileId]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getMatchResult = async (match: Event) => {
    const playerParticipant = match.participants?.find(p => p.profile_id === profileId);
    const isPlayerA = playerParticipant?.role === 'challenger';
    
    let playerScore = 0;
    let opponentScore = 0;
    let opponentName = 'Unknown';
    const sets: { player1Score: number; player2Score: number }[] = [];

    // Find opponent and their name
    const opponentParticipant = match.participants?.find(p => p.profile_id !== profileId);
    if (opponentParticipant?.profile?.full_name) {
      opponentName = opponentParticipant.profile.full_name;
    }

    // Get scores from match_scores table
    const { data: scores } = await supabase
      .from('match_scores')
      .select('*')
      .eq('event_id', match.id)
      .order('set_number', { ascending: true });

    if (scores) {
      scores.forEach(score => {
        sets.push({
          player1Score: score.score_team_a,
          player2Score: score.score_team_b
        });
      });
    }

    // Calculate scores
    sets.forEach(set => {
      if (isPlayerA) {
        if (set.player1Score > set.player2Score) playerScore++;
        else if (set.player2Score > set.player1Score) opponentScore++;
      } else {
        if (set.player2Score > set.player1Score) playerScore++;
        else if (set.player1Score > set.player2Score) opponentScore++;
      }
    });

    return {
      isWinner: playerScore > opponentScore,
      score: `${playerScore}-${opponentScore}`,
      opponentName
    };
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold mb-6">Match History</h2>

      <div className="space-y-4">
        {profileMatches.map((match) => {
          const result = matchResults[match.id];
          if (!result) return null;

          return (
            <motion.div
              key={match.id}
              variants={item}
              className="match-history-item"
            >
              <div className={`result ${result.isWinner ? 'win' : 'loss'}`}>
                vs {result.opponentName}
                <span className="score">{result.score}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}