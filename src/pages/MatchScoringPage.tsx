import EnhancedScoreBoard from '../components/scoring/EnhancedScoreBoard';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { ArrowLeft, BarChart3, Clock } from 'lucide-react';
import { useState } from 'react';

export default function MatchScoringPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { events, loading } = useEvents();
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
  
  // Find the current match details from events
  const currentEvent = events.find(event => event.id === eventId);
  
  // If still loading or event not found, show loading state
  if (loading || !currentEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  // Extract player details from the event
  // This assumes that participants data includes roles and profile information
  const playerA = currentEvent.participants?.find(p => p.role === 'challenger')?.profile?.full_name || 'Player A';
  const playerB = currentEvent.participants?.find(p => p.role === 'opponent')?.profile?.full_name || 'Player B';
  const playerAId = currentEvent.participants?.find(p => p.role === 'challenger')?.profile_id || '';
  const playerBId = currentEvent.participants?.find(p => p.role === 'opponent')?.profile_id || '';

  // Handle navigation back to the previous page
  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Toggle stats visibility
  const toggleStats = () => {
    setShowStats(!showStats);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Back button navigation */}
      <div className="p-4 bg-background border-b border-border flex justify-between items-center relative z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            handleGoBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
        >
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        
        <button
          onClick={toggleStats}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-primary hover:bg-accent/90 transition-colors"
        >
          {showStats ? <Clock size={18} /> : <BarChart3 size={18} />}
          <span>{showStats ? 'Show Match' : 'Show Stats & History'}</span>
        </button>
      </div>
      
      {/* Full-screen scoreboard */}
      <div className="flex-1">
        <EnhancedScoreBoard
          eventId={eventId || ''}
          playerA={playerA}
          playerB={playerB}
          currentUserId={user?.id || ''}
          playerAId={playerAId}
          playerBId={playerBId}
          onClose={handleGoBack}
          showStats={showStats}
        />
      </div>
    </div>
  );
}
