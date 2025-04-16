import React from 'react';

// A minimal bracket rendering for single elimination (for demo purposes)
type Match = {
  id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  player1_name?: string;
  player2_name?: string;
  winner_id?: string;
  score?: string;
  scheduled_at?: string;
  location?: string;
};

type Props = {
  matches: Match[];
  rounds: number;
  onSelectMatch?: (match: Match) => void;
  isOrganizer?: boolean;
};

const TournamentBracket: React.FC<Props> = ({ matches, rounds, onSelectMatch }) => {
  // Group matches by round
  const roundsArr = Array.from({ length: rounds }, (_, i) => i + 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8">
        {roundsArr.map(roundNum => (
          <div key={roundNum}>
            <div className="font-bold mb-2">Round {roundNum}</div>
            {matches.filter(m => m.round === roundNum).map((match, i) => (
              <div
                key={match.id}
                className="border p-2 mb-4 rounded bg-gray-50 min-w-[180px] cursor-pointer"
                onClick={() => onSelectMatch && onSelectMatch(match)}
                title="Click to open scoreboard"
              >
                <div>
                  <span className={match.winner_id === match.player1_id ? "font-bold text-green-700" : ""}>
                    {match.player1_name || match.player1_id || "TBD"}
                  </span>
                  {' vs '}
                  <span className={match.winner_id === match.player2_id ? "font-bold text-green-700" : ""}>
                    {match.player2_name || match.player2_id || "TBD"}
                  </span>
                </div>
                <div>
                  <span>Score: {match.score || "N/A"}</span>
                </div>
                {match.scheduled_at && (
                  <div className="text-sm mt-1">
                    <strong>Scheduled:</strong> {new Date(match.scheduled_at).toLocaleString()}
                    {match.location && <> @ {match.location}</>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentBracket;
