import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useProfile } from '../../hooks/useProfile';
import TournamentBracket from './TournamentBracket';
import EnhancedScoreBoard from '../scoring/EnhancedScoreBoard';

// Inline Tournament type definition to avoid missing import error
interface Tournament {
  id: string;
  name: string;
  event_type: string;
  draw_format: string;
  start_date: string;
  capacity: number;
  status: string;
  organizer_id: string;
  description?: string;
}

type Props = {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
};

const TournamentDetailsModal: React.FC<Props> = ({ tournament, isOpen, onClose }) => {
  const { profile } = useProfile();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament && isOpen) {
      setLoading(true);
      supabase
        .from('tournament_registrations')
        .select('id, team_name, registered_at, profile_id, profiles (username)')
        .eq('tournament_id', tournament.id)
        .then(({ data, error }) => {
          if (error) setError(error.message);
          else setRegistrations(data || []);
          setLoading(false);
        });
      if (tournament.status === 'started') {
        supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', tournament.id)
          .then(({ data, error }) => {
            if (!error) setMatches(data || []);
          });
      }
    }
  }, [tournament, isOpen]);

  // ...existing code for registration, start, cancel, etc...

  if (!isOpen || !tournament) return null;

  const isOrganizer = profile?.id === tournament.organizer_id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg space-y-4 relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold">{tournament.name}</h2>
        <p>{tournament.description}</p>
        <div className="flex flex-wrap gap-4">
          <span><strong>Type:</strong> {tournament.event_type}</span>
          <span><strong>Format:</strong> {tournament.draw_format}</span>
          <span><strong>Date:</strong> {tournament.start_date}</span>
          <span><strong>Capacity:</strong> {registrations.length}/{tournament.capacity}</span>
          <span><strong>Status:</strong> {tournament.status}</span>
        </div>
        <div>
          <h3 className="font-semibold mt-2">Registered Players/Teams:</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="list-disc pl-6">
              {registrations.map(r => (
                <li key={r.id}>
                  {r.profiles?.username || r.profile_id}
                  {r.team_name ? ` (${r.team_name})` : ""}
                  {r.profile_id === profile?.id && <span className="ml-2 text-blue-500">(You)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        {tournament.status === 'started' && matches.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Tournament Bracket</h3>
            <TournamentBracket
              matches={matches}
              rounds={Math.max(...matches.map(m => m.round), 1)}
              onSelectMatch={setActiveMatch}
              isOrganizer={isOrganizer}
            />
          </div>
        )}
        {activeMatch && (
          <EnhancedScoreBoard
            match={activeMatch}
            onComplete={async (winnerId: string, score: string) => {
              await supabase
                .from('tournament_matches')
                .update({ winner_id: winnerId, score })
                .eq('id', activeMatch.id);
              await supabase.rpc('advance_winner', { match_id: activeMatch.id });
              setActiveMatch(null);
              // Refresh matches
              const { data } = await supabase
                .from('tournament_matches')
                .select('*')
                .eq('tournament_id', tournament.id);
              setMatches(data || []);
            }}
            onClose={() => setActiveMatch(null)}
          />
        )}
        {/* ...other controls for start, cancel, etc... */}
        {error && (
          <div className="text-red-500">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailsModal;
