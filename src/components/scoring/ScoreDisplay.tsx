import { motion } from 'framer-motion';

export interface Score {
  id: string;
  event_id: string;
  set_number: number;
  score_team_a: number;
  score_team_b: number;
  tiebreak_score_team_a: number | null;
  tiebreak_score_team_b: number | null;
  created_at: string;
  recorded_by: string | null;
  game_score_detail_json: {
    games: Array<{
      winner: 'A' | 'B';
      game_number: number;
    }>;
  } | null;
}

interface ScoreDisplayProps {
  scores: Score[];
  teamAName: string;
  teamBName: string;
}

export function ScoreDisplay({ scores, teamAName, teamBName }: ScoreDisplayProps) {
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
    hidden: { opacity: 0, y: -10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="glass rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Match Score</h2>

      <div className="space-y-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2"
        >
          {scores.map((score) => (
            <motion.div
              key={score.set_number}
              variants={item}
              className="glass rounded-lg p-3"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium opacity-80">Set {score.set_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{teamAName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{score.score_team_a}</span>
                    {score.tiebreak_score_team_a !== null && (
                      <span className="text-sm opacity-80">({score.tiebreak_score_team_a})</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-medium text-sm">{teamBName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{score.score_team_b}</span>
                    {score.tiebreak_score_team_b !== null && (
                      <span className="text-sm opacity-80">({score.tiebreak_score_team_b})</span>
                    )}
                  </div>
                </div>
              </div>

              {score.game_score_detail_json?.games && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {score.game_score_detail_json.games.map((game) => (
                      <div
                        key={game.game_number}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          game.winner === 'A'
                            ? 'bg-green-500 bg-opacity-20 text-green-500'
                            : 'bg-blue-500 bg-opacity-20 text-blue-500'
                        }`}
                      >
                        {game.winner === 'A' ? teamAName : teamBName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}