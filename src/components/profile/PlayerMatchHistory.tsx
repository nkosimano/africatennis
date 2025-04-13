import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Star } from 'lucide-react';
import type { Event } from '../../hooks/useEvents';

interface PlayerMatchHistoryProps {
  matches: Event[];
  onMatchClick: (match: Event) => void;
  profileId: string;
}

export function PlayerMatchHistory({
  matches,
  onMatchClick,
  profileId,
}: PlayerMatchHistoryProps) {
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

  const getMatchResult = (match: Event) => {
    const playerParticipant = match.participants?.find(p => p.profile_id === profileId);
    const isPlayerA = playerParticipant?.role === 'challenger';
    
    let playerScore = 0;
    let opponentScore = 0;
    let opponentName = '';

    // Find opponent
    const opponentParticipant = match.participants?.find(p => p.profile_id !== profileId);
    if (opponentParticipant) {
      opponentName = opponentParticipant.profile.full_name;
    }

    // Calculate scores
    match.match_scores?.forEach(score => {
      if (isPlayerA) {
        if (score.score_team_a > score.score_team_b) playerScore++;
        else if (score.score_team_b > score.score_team_a) opponentScore++;
      } else {
        if (score.score_team_b > score.score_team_a) playerScore++;
        else if (score.score_team_a > score.score_team_b) opponentScore++;
      }
    });

    return {
      isWinner: playerScore > opponentScore,
      score: `${playerScore}-${opponentScore}`,
      opponentName
    };
  };

  // Filter matches for this profile
  const profileMatches = matches.filter(match => 
    match.participants?.some(p => p.profile_id === profileId)
  );

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
          const result = getMatchResult(match);
          
          return (
            <motion.div
              key={match.id}
              variants={item}
              onClick={() => onMatchClick(match)}
              className="glass p-4 rounded-lg hover:bg-surface-hover transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy
                    size={20}
                    className={result.isWinner ? 'text-success' : 'text-error'}
                  />
                  <div>
                    <p className="font-medium">vs {result.opponentName}</p>
                    <p className="text-sm opacity-80">{result.score}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm opacity-80">
                    <Calendar size={16} />
                    <span>
                      {new Date(match.scheduled_start_time).toLocaleDateString()}
                    </span>
                  </div>
                  {match.location && (
                    <div className="flex items-center gap-1 text-sm opacity-80">
                      <MapPin size={16} />
                      <span>{match.location.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {match.event_type.includes('ranked') && (
                <div className="flex items-center gap-2 mt-2">
                  <Star size={16} className="text-accent" />
                  <span className="text-sm">Ranked Match</span>
                </div>
              )}
            </motion.div>
          );
        })}

        {profileMatches.length === 0 && (
          <div className="text-center py-8 opacity-80">
            <p>No matches played yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}