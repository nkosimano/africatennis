import { TennisScoreBoard } from '../components/scoring/TennisScoreBoard';
import { ToastProvider, ToastViewport } from '@/components/ui/toaster';

export default function TempScoreTestPage() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <TennisScoreBoard
        eventId="test-123"
        playerA="Nathi Dhliso"
        playerB="Bongani"
        currentUserId="test-user-id"
        playerAId="player-a-id"
        playerBId="player-b-id"
      />
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}
