import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import TournamentDetailsModal from '../components/tournaments/TournamentDetailsModal';
import { TournamentCreateForm } from '../components/tournaments/TournamentCreateForm';

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

interface Location {
  id: string;
  name: string;
  address?: string;
}

const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTournaments(data || []);
        setLoading(false);
      });
    supabase
      .from('locations')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setLocations(data);
      });
  }, [showCreate]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setShowCreate(true)}
        >
          + Create Tournament
        </button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowCreate(false)}>✕</button>
            <TournamentCreateForm
              locations={locations}
              players={[]}
              onClose={() => setShowCreate(false)}
              onSuccess={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading tournaments...</p>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => (
            <div
              key={t.id}
              className="border p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelected(t)}
            >
              <div>
                <div className="font-semibold text-lg">{t.name}</div>
                <div className="text-sm text-gray-600">{t.event_type} • {t.draw_format} • {new Date(t.start_date).toLocaleDateString()}</div>
                <div className="text-xs text-gray-500">Capacity: {t.capacity} | Status: {t.status}</div>
              </div>
              <button
                className="mt-2 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={e => {
                  e.stopPropagation();
                  setSelected(t);
                }}
              >View</button>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <TournamentDetailsModal
          tournament={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default TournamentsPage;
