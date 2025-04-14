import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchHistory {
  id: string;
  event_id: string;
  created_at: string;
  player1_id: string;
  player2_id: string;
  player1_name: string;
  player2_name: string;
  winner_id: string;
  score_summary: any;
}

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchHistory();
  }, []);

  const fetchMatchHistory = async () => {
    try {
      const { data: matchData, error } = await supabase
        .from('match_scores')
        .select(`
          *,
          event:events(
            id,
            player1:player1_id(id, full_name),
            player2:player2_id(id, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMatches = matchData.map((match: any) => ({
        id: match.id,
        event_id: match.event.id,
        created_at: match.created_at,
        player1_id: match.event.player1.id,
        player2_id: match.event.player2.id,
        player1_name: match.event.player1.full_name,
        player2_name: match.event.player2.full_name,
        winner_id: match.winner_id,
        score_summary: match.score_summary
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error fetching match history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Match History</h1>
      <div className="grid gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <span className={match.winner_id === match.player1_id ? "font-bold" : ""}>
                    {match.player1_name}
                  </span>
                  <span>vs</span>
                  <span className={match.winner_id === match.player2_id ? "font-bold" : ""}>
                    {match.player2_name}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(match.created_at), 'PPp')}
                </div>
                {match.score_summary && (
                  <div className="text-sm">
                    Score: {JSON.stringify(match.score_summary)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 