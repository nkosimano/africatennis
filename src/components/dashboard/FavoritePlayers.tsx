import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavoritePlayers } from '../../hooks/useFavoritePlayers';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { AddFavoritePlayerModal } from '../players/AddFavoritePlayerModal';

export function FavoritePlayers() {
  const { user } = useAuth();
  const { data: favoritePlayers } = useFavoritePlayers();
  const [showAddFavorite, setShowAddFavorite] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Favorite Players</span>
          <button
            className="px-2 py-1 text-sm rounded bg-accent text-primary hover:bg-opacity-90 transition-colors"
            onClick={() => setShowAddFavorite(true)}
          >
            + Add
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {Array.isArray(favoritePlayers) && favoritePlayers.length > 0 ? favoritePlayers.map((player: any) => (
              <div key={player.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={player.avatar_url || undefined} />
                  <AvatarFallback>{player.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{player.full_name || ''}</p>
                  <p className="text-sm text-muted-foreground">
                    {player.preferred_location_id || ''}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-4">No favorite players found.</div>
            )}
          </div>
        </ScrollArea>
        {showAddFavorite && (
          <AddFavoritePlayerModal isOpen={showAddFavorite} onClose={() => setShowAddFavorite(false)} />
        )}
      </CardContent>
    </Card>
  );
}