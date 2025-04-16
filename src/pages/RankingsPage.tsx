import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { RankingHistoryChart } from '../components/rankings/RankingHistoryChart';
import { useRankings, type Ranking } from '@/hooks/useRankings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';

export function RankingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { rankings, loading, error, fetchRankings, initializeRankings } = useRankings();
  const [isInitializing, setIsInitializing] = useState(false);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/profile/${playerId}`);
  };

  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      await initializeRankings();
    } finally {
      setIsInitializing(false);
    }
  };

  const filteredRankings = (rankingsType: 'singles' | 'doubles') => {
    const rankingList = rankings[rankingsType] || [];
    if (!searchQuery) return rankingList;

    const searchLower = searchQuery.toLowerCase();
    return rankingList.filter(ranking =>
      ranking.profile?.full_name?.toLowerCase().includes(searchLower) ||
      ranking.profile?.username?.toLowerCase().includes(searchLower)
    );
  };

  const renderRankings = (type: 'singles' | 'doubles') => {
    const data = filteredRankings(type);
    if (!data.length) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No rankings available yet.</p>
          <Button 
            onClick={handleInitialize}
            disabled={isInitializing}
            variant="outline"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Rankings'}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((ranking: Ranking) => (
          <motion.div
            key={ranking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => handlePlayerClick(ranking.profile_id)}
            className="cursor-pointer hover:bg-accent/5 transition-colors"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground">
                      #{ranking.rank}
                    </div>
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10">
                      <AvatarImage src={ranking.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {ranking.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-semibold truncate">
                        {ranking.profile?.full_name || 'Unknown Player'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        @{ranking.profile?.username || 'unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="font-bold text-sm sm:text-base">{ranking.points.toFixed(1)}</div>
                    <div className={`text-xs sm:text-sm ${ranking.points_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {ranking.points_change >= 0 ? '+' : ''}{ranking.points_change.toFixed(1)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">ATR Rankings</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <Button
            onClick={fetchRankings}
            disabled={loading || isInitializing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {rankings.lastUpdated && (
        <p className="text-sm text-muted-foreground mb-6">
          Last updated: {format(new Date(rankings.lastUpdated), 'PPP p')}
        </p>
      )}

      <Tabs defaultValue="singles" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="singles" className="flex-1 sm:flex-none">Singles</TabsTrigger>
          <TabsTrigger value="doubles" className="flex-1 sm:flex-none">Doubles</TabsTrigger>
        </TabsList>
        <TabsContent value="singles">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading rankings...</p>
            </div>
          ) : (
            renderRankings('singles')
          )}
        </TabsContent>
        <TabsContent value="doubles">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading rankings...</p>
            </div>
          ) : (
            renderRankings('doubles')
          )}
        </TabsContent>
      </Tabs>

      {user && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <RankingHistoryChart
            profileId={user.id}
            rankingType="singles"
          />
          <RankingHistoryChart
            profileId={user.id}
            rankingType="doubles"
          />
        </div>
      )}
    </div>
  );
}