import React, { useState, useMemo } from 'react';
import { usePlayers } from '../../hooks/usePlayers';
import { Dialog } from '@headlessui/react';

interface AddFavoritePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFavoritePlayerModal: React.FC<AddFavoritePlayerModalProps> = ({ isOpen, onClose }) => {
  const { loading, error, toggleFavorite, searchPlayers } = usePlayers();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredPlayers = useMemo(() => {
    if (!search) return [];
    return searchPlayers(search).filter(p => !p.is_favorite);
  }, [search, searchPlayers]);

  const handleAdd = async (playerId: string) => {
    setAdding(playerId);
    setSuccess(null);
    const result = await toggleFavorite(playerId);
    setAdding(null);
    if (!result.error) {
      setSuccess(playerId);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
      <div className="bg-background dark:bg-[var(--color-surface)] text-foreground rounded-lg shadow-lg p-6 w-full max-w-md z-10 relative">
        <Dialog.Title className="text-xl font-bold mb-4">Add Favorite Player</Dialog.Title>
        <input
          type="text"
          className="w-full border rounded px-3 py-2 mb-4 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Search players by name or username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">Error: {error}</div>}
        <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200">
          {filteredPlayers.length === 0 && search && !loading && (
            <li className="py-2 text-gray-500">No players found.</li>
          )}
          {filteredPlayers.map(player => (
            <li key={player.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {player.avatar_url && (
                  <img src={player.avatar_url} alt={player.full_name || player.username || 'Player'} className="w-8 h-8 rounded-full object-cover" />
                )}
                <span>{player.full_name || player.username}</span>
              </div>
              <button
                className={`px-3 py-1 rounded bg-accent text-primary font-semibold hover:bg-opacity-90 transition-colors ${adding === player.id ? 'opacity-50 cursor-wait' : ''}`}
                onClick={() => handleAdd(player.id)}
                disabled={adding === player.id || success === player.id}
              >
                {success === player.id ? 'Added!' : 'Add'}
              </button>
            </li>
          ))}
        </ul>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>
    </Dialog>
  );
};
