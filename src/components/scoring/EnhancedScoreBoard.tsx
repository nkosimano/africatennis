"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle,
  Trophy,
  Moon,
  Sun,
  Clock,
  BarChart3,
  Zap,
  RotateCcw,
  PlusCircle,
  MinusCircle,
  Flag,
  Pause,
  Play,
} from "lucide-react"
// UPDATED IMPORT PATH: Verify this matches your project structure!
import { supabase } from '@/lib/supabase'; // Assuming supabase is configured in src/lib/supabase.ts (or .js)

// Assuming these imports work in your actual project environment
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { Badge } from "@/components/ui/badge"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Progress } from "@/components/ui/progress"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { cn } from "@/lib/utils"

// Mock components and utils (REMOVE THESE IN YOUR ACTUAL APP)
// Helper function to combine class names
const mockCn = (...inputs: any[]) => inputs.filter(Boolean).join(" ")

// Mock UI components library (REMOVE THIS)
const ui = {
  Button: ({ children, className, variant, size, ...props }: any) => {
     const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
     const sizeStyle = size === "sm" ? "h-9 rounded-md px-3" : size === "icon" ? "h-10 w-10" : "h-10 px-4 py-2";
     const variantStyle =
       variant === "destructive" ? "bg-red-600 text-white hover:bg-red-700" :
       variant === "outline" ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground" :
       variant === "secondary" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" :
       variant === "ghost" ? "hover:bg-accent hover:text-accent-foreground" :
       variant === "link" ? "text-primary underline-offset-4 hover:underline" :
       "bg-primary text-primary-foreground hover:bg-primary/90";
     // Simplified style application for mocks
     return <button className={mockCn(baseStyle, sizeStyle, variantStyle, className)} {...props}>{children}</button>;
   },
  Card: ({ children, className, ...props }: any) => <div className={mockCn("rounded-lg border bg-card text-card-foreground shadow-sm border-border", className)} {...props}>{children}</div>,
  CardHeader: ({ children, className, ...props }: any) => <div className={mockCn("flex flex-col space-y-1.5 p-6", className)} {...props}>{children}</div>,
  CardContent: ({ children, className, ...props }: any) => <div className={mockCn("p-6 pt-0", className)} {...props}>{children}</div>,
  CardFooter: ({ children, className, ...props }: any) => <div className={mockCn("flex items-center p-6 pt-0", className)} {...props}>{children}</div>,
  Separator: ({ className, ...props }: any) => <div className={mockCn("shrink-0 bg-border h-[1px] w-full", className)} {...props} />,
  Badge: ({ children, className, variant, ...props }: any) => <div className={mockCn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variant === "outline" ? "text-foreground border-border" : "border-transparent bg-primary text-primary-foreground", className)} {...props}>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div className="relative inline-block group">{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <button>{children}</button>),
  TooltipContent: ({ children, className, ...props }: any) => <div className={mockCn("absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:block overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95", className)} {...props}>{children}</div>,
  Progress: ({ className, value, ...props }: any) => <div className={mockCn("relative h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}><div className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${value || 0}%` }} /></div>,
  // Mock Tabs does NOT handle value/onValueChange - relies on external state for content visibility
  Tabs: ({ children, className, value, onValueChange, ...props }: any) => <div className={className} {...props}>{children}</div>,
  TabsList: ({ children, className, ...props }: any) => <div className={mockCn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props}>{children}</div>,
  // Mock Trigger does NOT call onValueChange - needs real component
  TabsTrigger: ({ children, className, value, 'data-state': dataState, ...props }: any) => <button className={mockCn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", dataState === 'active' ? "bg-background text-foreground shadow-sm" : "", className)} data-state={dataState} {...props}>{children}</button>,
  // Mock Content is always rendered in the DOM by default - conditional rendering added externally
  TabsContent: ({ children, className, value, ...props }: any) => <div className={mockCn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props}>{children}</div>,
  Dialog: ({ children }: any) => <div className="relative">{children}</div>,
  DialogTrigger: ({ children, asChild }: any) => (asChild ? children : <button>{children}</button>),
  DialogContent: ({ children, className, ...props }: any) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className={mockCn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg", "text-foreground", className)} {...props}>{children}</div></div>,
  DialogHeader: ({ children, className, ...props }: any) => <div className={mockCn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>{children}</div>,
  DialogTitle: ({ children, className, ...props }: any) => <h2 className={mockCn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>{children}</h2>,
}
// End Mock components (REMOVE ABOVE IN YOUR APP)

// Define props interface to match what's being passed from EventDetailsModal
interface EnhancedScoreBoardProps {
  eventId: string;
  playerA: string;
  playerB: string;
  currentUserId: string;
  playerAId?: string;
  playerBId?: string;
  onClose?: () => void;
  showStats?: boolean;
}

export default function EnhancedScoreBoard({
  eventId,
  playerA,
  playerB,
  currentUserId,
  playerAId,
  playerBId,
  onClose,
  showStats = false
}: EnhancedScoreBoardProps) {
  // State Hooks
  const [theme, setTheme] = useState<"dark" | "light">("dark") // Theme state
  const [serving, setServing] = useState<"player1" | "player2">("player1") // Who is serving
  const [matchTime, setMatchTime] = useState<number>(0) // Match duration in seconds
  const [isPlaying, setIsPlaying] = useState<boolean>(true) // Timer play/pause state
  const [matchHistory, setMatchHistory] = useState<Array<{ action: string; timestamp: number }>>([]) // History of actions
  const [scores, setScores] = useState({ // Score state
    player1: { sets: 0, games: 0, points: 0, aces: 0, winners: 0, errors: 0 },
    player2: { sets: 0, games: 0, points: 0, aces: 0, winners: 0, errors: 0 },
  })
  const [activeTab, setActiveTab] = useState("match"); // State for active tab
  const [isEndMatchDialogOpen, setIsEndMatchDialogOpen] = useState(false); // State for dialog visibility

  // Player profiles data - use the passed player names
  const players = {
    player1: {
      name: playerA || "Player 1",
      rank: 12, // Example static rank
      country: "South Africa", // Example static country
      winRate: 68, // Example static win rate
      avatar: "https://placehold.co/100x100/A0AEC0/FFFFFF?text=P1", // Placeholder avatar
    },
    player2: {
      name: playerB || "Player 2",
      rank: 15, // Example static rank
      country: "Nigeria", // Example static country
      winRate: 62, // Example static win rate
      avatar: "https://placehold.co/100x100/718096/FFFFFF?text=P2", // Placeholder avatar
    },
  }

  // Tennis point display values
  const pointValues = ["0", "15", "30", "40", "Ad"]

  // Effect Hook: Timer for match duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setMatchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Helper Function: Format time in seconds to HH:MM:SS string
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Core Logic: Increment score for a player and add action to history
  const incrementScore = (player: "player1" | "player2", category: keyof typeof scores.player1) => {
    let newScores = { ...scores };
    newScores[player][category] += 1;

    // --- Basic Game Win Logic ---
    if (category === 'points') {
        const p1Points = newScores.player1.points;
        const p2Points = newScores.player2.points;
        if ((p1Points >= 4 && p1Points >= p2Points + 2) || (p2Points >= 4 && p2Points >= p1Points + 2)) {
            const winner = p1Points > p2Points ? 'player1' : 'player2';
            const loser = winner === 'player1' ? 'player2' : 'player1';
            newScores[winner].games += 1;
            newScores.player1.points = 0; // Reset points for both
            newScores.player2.points = 0;
            setServing(winner === 'player1' ? 'player2' : 'player1'); // Switch serve
            setMatchHistory((prev) => [{ action: `${players[winner].name} won the game`, timestamp: matchTime }, ...prev].slice(0, 20));

            // --- Basic Set Win Logic ---
            const p1Games = newScores.player1.games;
            const p2Games = newScores.player2.games;
            if ((p1Games >= 6 && p1Games >= p2Games + 2) || (p2Games >= 6 && p2Games >= p1Games + 2)) {
                 const setWinner = p1Games > p2Games ? 'player1' : 'player2';
                 const setLoser = setWinner === 'player1' ? 'player2' : 'player1';
                 newScores[setWinner].sets += 1;
                 newScores.player1.games = 0; // Reset games for both
                 newScores.player2.games = 0;
                 setMatchHistory((prev) => [{ action: `${players[setWinner].name} won the set`, timestamp: matchTime }, ...prev].slice(0, 20));

                 // --- Basic Match Win Logic (Best of 3 sets) ---
                 if (newScores[setWinner].sets >= 2) {
                     console.log(`${players[setWinner].name} wins the match!`);
                     setIsPlaying(false);
                     setMatchHistory((prev) => [{ action: `${players[setWinner].name} won the match!`, timestamp: matchTime }, ...prev].slice(0, 20));
                     // Consider calling handleEndMatchConfirm automatically or disabling further input
                 }
            }
        }
    }

    setScores(newScores);

    // Add action to match history (if not already added by game/set win)
    if (category !== 'points' || (newScores[player].points !== 0)) {
        const actionText = category === 'points' ? 'point' : category === 'errors' ? 'error' : category;
        let playerName = players[player].name;
        let fullAction = `${playerName} ${category === 'errors' ? 'made an' : 'scored'} ${actionText}`;
         setMatchHistory((prev) => [{ action: fullAction, timestamp: matchTime }, ...prev].slice(0, 20));
    }
  };

  // Action: Add an Ace
  const addAce = (player: "player1" | "player2") => {
    incrementScore(player, "aces");
    incrementScore(player, "points"); // Ace also scores a point
  };

  // Action: Add a point (handles winners, errors)
  const addPoint = (player: "player1" | "player2", type: "winner" | "error" | "regular" = "regular") => {
    const opponent = player === "player1" ? "player2" : "player1";
    if (type === "winner") {
      incrementScore(player, "winners");
      incrementScore(player, "points");
    } else if (type === "error") {
      incrementScore(player, "errors");
      incrementScore(opponent, "points"); // Opponent gets point on error
    } else {
      incrementScore(player, "points");
    }
  };

  // Action: Manually toggle who is serving
  const toggleServing = () => {
    setServing(serving === "player1" ? "player2" : "player1");
  };

  // Action: Toggle theme between dark and light
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
        document.documentElement.classList.remove(theme);
        document.documentElement.classList.add(newTheme);
    }
  };

   // Effect to set initial theme class on mount
   useEffect(() => {
       if (typeof window !== 'undefined') {
           document.documentElement.classList.add(theme);
       }
       // Cleanup function to remove class on unmount
       return () => {
            if (typeof window !== 'undefined') {
                 document.documentElement.classList.remove(theme);
            }
       }
   }, [theme]); // Re-run if theme changes


  // Action: Toggle the match timer play/pause state
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Helper Function: Display tennis point value (0, 15, 30, 40, Deuce, Ad)
  const displayPoint = (player: "player1" | "player2") => {
    const p1Points = scores.player1.points;
    const p2Points = scores.player2.points;
    const opponent = player === "player1" ? "player2" : "player1";
    if (p1Points >= 3 && p2Points >= 3) {
        if (p1Points === p2Points) return "Deuce";
        if (scores[player].points > scores[opponent].points) return "Ad";
    }
    const currentPoints = scores[player].points;
    return currentPoints < 4 ? pointValues[currentPoints] : pointValues[3];
  };

  // Helper Function: Calculate win probability based on points won (simple)
  const calculateWinPercentage = (player: "player1" | "player2") => {
    const totalPoints = scores.player1.points + scores.player2.points;
    if (totalPoints === 0) return 50;
    return Math.round((scores[player].points / totalPoints) * 100);
  };

  // Action: Undo the last recorded action (basic implementation)
  const undoLastAction = () => {
    if (matchHistory.length > 0) {
      console.warn("Undo functionality is simplified and only removes history entry.");
      setMatchHistory((prev) => prev.slice(1));
      // TODO: Implement robust state reversal
    }
  };

  // Action: Handle confirming the end of the match and update Supabase
  const handleEndMatchConfirm = async () => {
    console.log("Attempting to end match...");
    setIsPlaying(false);
    setIsEndMatchDialogOpen(false);

    try {
      // Determine the winner based on sets
      const winner = scores.player1.sets > scores.player2.sets ? "player1" : "player2";
      const winnerId = winner === "player1" ? playerAId : playerBId;

      if (!eventId) {
        console.error("Missing eventId");
        return;
      }

      console.log(`Ending match for event ${eventId}. Winner ID: ${winnerId}`);

      // Update the event status in Supabase
      // The error showed that winner_profile_id doesn't exist, so we'll just update the status
      const { error: updateError } = await supabase
        .from('events')
        .update({
          status: 'completed',
          // Store the winner ID in the notes field as a workaround
          notes: winnerId ? `Winner: ${winnerId}` : undefined
        })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating match status:', updateError);
        throw updateError;
      }

      console.log('Successfully marked match as completed');

      // Add match completion to local history
      setMatchHistory((prev) =>
        [{ action: `Match completed - ${players[winner].name} wins!`, timestamp: matchTime }, ...prev].slice(0, 20),
      );

      // Close the scoreboard modal after a delay if onClose is provided
      if (onClose) {
        console.log("Calling onClose callback in 1.5 seconds...");
        setTimeout(() => {
          onClose();
        }, 1500);
      }

    } catch (error) {
      console.error("Error ending match:", error);
    }
  }

  // Main component render
  return (
    <div className="h-[100vh] w-full flex flex-col bg-background">
      <main className="h-full flex flex-col p-1">
        {showStats ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Stats Cards */}
            <ui.Card className="h-fit">
              <ui.CardHeader className="p-4"><h3 className="text-lg font-semibold text-foreground">Match Statistics</h3></ui.CardHeader>
              <ui.CardContent className="p-4 pt-0 space-y-4">
                {/* Stat Bars */}
                {(["Winners", "Unforced Errors", "Aces", "Points Won"] as const).map((statName) => {
                  const key = statName === "Unforced Errors" ? "errors" : statName === "Points Won" ? "points" : statName.toLowerCase() as keyof typeof scores.player1;
                  const p1Stat = scores.player1[key as Exclude<keyof typeof scores.player1, 'sets' | 'games'>];
                  const p2Stat = scores.player2[key as Exclude<keyof typeof scores.player2, 'sets' | 'games'>];
                  const totalStat = p1Stat + p2Stat;
                  const p1Percentage = totalStat === 0 ? 50 : (p1Stat / totalStat) * 100;
                  const barColor = statName === "Unforced Errors" ? "bg-red-500" : statName === "Aces" ? "bg-yellow-500" : statName === "Points Won" ? "bg-blue-500" : "bg-emerald-500";
                  return (
                    <div className="space-y-2" key={statName}>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{statName}</span>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-foreground w-8 text-right">{p1Stat}</span>
                          <span className="text-xs text-muted-foreground">vs</span>
                          <span className="font-semibold text-foreground w-8 text-left">{p2Stat}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-full h-2 rounded-full overflow-hidden bg-muted"><div className={`h-full ${barColor} rounded-l-full`} style={{ width: `${p1Percentage}%` }}></div></div>
                      </div>
                    </div>
                  );
                })}
                {/* Match Duration */}
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex justify-between items-center">
                    <div><div className="text-sm text-muted-foreground">Match Duration</div><div className="text-2xl font-bold mt-1 text-foreground">{formatTime(matchTime)}</div></div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              </ui.CardContent>
            </ui.Card>

            {/* History Panel */}
            <ui.Card className="h-fit">
              <ui.CardHeader className="p-4"><h3 className="text-lg font-semibold text-foreground">Match History</h3></ui.CardHeader>
              <ui.CardContent className="p-4 pt-0">
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 border border-border rounded-md p-2 bg-muted/50">
                  {matchHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No match events recorded yet</p></div>
                  ) : (
                    matchHistory.map((event, index) => (
                      <div key={`${event.timestamp}-${index}-${event.action}`} className={mockCn("p-3 rounded-md flex items-center justify-between text-sm", index === 0 ? "bg-card text-foreground font-medium shadow-sm" : "bg-background text-foreground/90")}>
                        <span className="truncate pr-2">{event.action}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(event.timestamp)}</span>
                      </div>
                    ))
                  )}
                </div>
              </ui.CardContent>
            </ui.Card>

            {/* Action buttons for stats view */}
            <div className="lg:col-span-2 flex justify-center gap-4 mt-2">
              <ui.Button variant="outline" onClick={toggleServing}>Switch Serve</ui.Button>
              <ui.Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsEndMatchDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />End & Confirm
              </ui.Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-1">
            {/* Main Scoreboard Card */}
            <ui.Card
              className="h-[57%] overflow-hidden border-2 rounded-lg bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 border-emerald-800"
            >
              {/* Card Header - Minimal padding */}
              <ui.CardHeader className="p-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-medium flex items-center text-foreground">
                    <Trophy className="h-4 w-4 mr-2 text-emerald-500" />
                    Africa Tennis Championship
                  </h3>
                  <ui.Badge
                    variant="outline"
                    className={`${isPlaying ? "animate-pulse" : ""} border-border`}
                  >
                    {isPlaying ? "Live" : "Paused"}
                  </ui.Badge>
                </div>
              </ui.CardHeader>

              {/* Card Content */}
              <ui.CardContent className="h-[calc(100%-4rem)] p-2 flex flex-col justify-between">
                <div className="flex-1 grid grid-cols-7 gap-2 items-center">
                  {/* Player Info sections */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <div className="relative mb-1 sm:mb-2">
                        <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 p-1 ${
                          serving === "player1" 
                            ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
                            : ""
                        }`}>
                          <img src={players.player1.avatar} alt={players.player1.name} className="h-full w-full rounded-full object-cover" />
                        </div>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-0.5 truncate w-full px-1 text-foreground">{players.player1.name}</h3>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <span>#{players.player1.rank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Central Score Display */}
                  <div className="col-span-3 rounded-xl bg-card/80 backdrop-blur-md shadow-lg border border-border p-2 sm:p-4">
                    {/* Score content */}
                    <div className="grid grid-cols-3 gap-1 text-center mb-2">
                      <div></div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sets</div>
                      <div></div>
                      <div className={`text-2xl sm:text-3xl ${scores.player1.sets > scores.player2.sets ? "font-bold" : "font-medium"} text-foreground`}>{scores.player1.sets}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">-</div>
                      <div className={`text-2xl sm:text-3xl ${scores.player2.sets > scores.player1.sets ? "font-bold" : "font-medium"} text-foreground`}>{scores.player2.sets}</div>
                    </div>

                    {/* Games, Points, Aces */}
                    <div className="grid grid-cols-3 gap-y-2 text-center">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Games</div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Points</div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Aces</div>
                      
                      {/* Player scores */}
                      <div className={`text-lg sm:text-xl ${scores.player1.games > scores.player2.games ? "font-bold" : "font-medium"} text-foreground`}>{scores.player1.games}</div>
                      <div className={`text-lg sm:text-xl ${displayPoint("player1") === "Ad" ? "font-bold" : "font-medium"} text-foreground`}>{displayPoint("player1")}</div>
                      <div className={`text-lg sm:text-xl font-semibold ${scores.player1.aces > 0 ? "text-yellow-500" : "text-foreground/80"}`}>{scores.player1.aces}</div>
                      
                      {/* Player 2 scores */}
                      <div className={`text-lg sm:text-xl ${scores.player2.games > scores.player1.games ? "font-bold" : "font-medium"} text-foreground`}>{scores.player2.games}</div>
                      <div className={`text-lg sm:text-xl ${displayPoint("player2") === "Ad" ? "font-bold" : "font-medium"} text-foreground`}>{displayPoint("player2")}</div>
                      <div className={`text-lg sm:text-xl font-semibold ${scores.player2.aces > 0 ? "text-yellow-500" : "text-foreground/80"}`}>{scores.player2.aces}</div>
                    </div>
                  </div>

                  {/* Player 2 Info */}
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <div className="relative mb-1 sm:mb-2">
                        <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 p-1 ${
                          serving === "player2" 
                            ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
                            : ""
                        }`}>
                          <img src={players.player2.avatar} alt={players.player2.name} className="h-full w-full rounded-full object-cover" />
                        </div>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-0.5 truncate w-full px-1 text-foreground">{players.player2.name}</h3>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <span>#{players.player2.rank}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Win Probability */}
                <div className="mt-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs sm:text-sm font-medium text-foreground">Win Probability</div>
                  </div>
                  <div className="space-y-1">
                    {/* Probability bars */}
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium w-12 sm:w-16 text-right truncate text-foreground">{players.player1.name}</div>
                      <div className="flex-1">
                        <ui.Progress value={calculateWinPercentage("player1")} className="h-1.5" />
                      </div>
                      <div className="text-xs font-medium w-8 text-foreground">{calculateWinPercentage("player1")}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium w-12 sm:w-16 text-right truncate text-foreground">{players.player2.name}</div>
                      <div className="flex-1">
                        <ui.Progress value={calculateWinPercentage("player2")} className="h-1.5" />
                      </div>
                      <div className="text-xs font-medium w-8 text-foreground">{calculateWinPercentage("player2")}%</div>
                    </div>
                  </div>
                </div>
              </ui.CardContent>

              {/* Card Footer */}
              <ui.CardFooter className="p-2 flex justify-center gap-2">
                <ui.Button variant="outline" size="sm" onClick={toggleServing}>Switch Serve</ui.Button>
                <ui.Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsEndMatchDialogOpen(true)}>
                  <CheckCircle className="h-3 w-3 mr-1" />End & Confirm
                </ui.Button>
              </ui.CardFooter>
            </ui.Card>

            {/* Score Input Controls */}
            <div className="h-[42%] grid grid-cols-2 gap-1">
              {/* Player Controls Cards */}
              <ui.Card className="h-full flex flex-col">
                <ui.CardHeader className="p-2">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">{players.player1.name}</h3>
                </ui.CardHeader>
                <ui.CardContent className="flex-1 p-2 grid grid-rows-2 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <ui.Button size="sm" className="h-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950" onClick={() => addAce("player1")}>
                      <Zap className="h-3 w-3 mr-1" /> Ace
                    </ui.Button>
                    <ui.Button size="sm" variant="outline" className="h-full" onClick={() => addPoint("player1", "winner")}>Winner</ui.Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ui.Button size="sm" variant="outline" className="h-full" onClick={() => addPoint("player1")}>Point</ui.Button>
                    <ui.Button size="sm" variant="outline" className="h-full" onClick={() => addPoint("player1", "error")}>Error</ui.Button>
                  </div>
                </ui.CardContent>
              </ui.Card>

              {/* Player 2 Controls Card */}
              <ui.Card className="h-full flex flex-col">
                <ui.CardHeader className="p-2">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">{players.player2.name}</h3>
                </ui.CardHeader>
                <ui.CardContent className="flex-1 p-2 grid grid-rows-2 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <ui.Button size="sm" className="h-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950" onClick={() => addAce("player2")}>
                      <Zap className="h-3 w-3 mr-1" /> Ace
                    </ui.Button>
                    <ui.Button size="sm" variant="outline" className="h-full" onClick={() => addPoint("player2", "winner")}>Winner</ui.Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ui.Button size="sm" variant="outline" className="h-full" onClick={() => addPoint("player2")}>Point</ui.Button>
                    <ui.Button size="sm" variant="outline" className="h-full" onClick={() => addPoint("player2", "error")}>Error</ui.Button>
                  </div>
                </ui.CardContent>
              </ui.Card>
            </div>
          </div>
        )}

        {/* End Match Confirmation Dialog */}
        {isEndMatchDialogOpen && (
          <ui.DialogContent>
             <ui.DialogHeader><ui.DialogTitle>End Match</ui.DialogTitle></ui.DialogHeader>
             <p className="text-sm text-muted-foreground">Are you sure you want to end this match? This action cannot be undone.</p>
             <div className="flex justify-end gap-2 mt-4">
               <ui.Button variant="outline" onClick={() => setIsEndMatchDialogOpen(false)}>Cancel</ui.Button>
               <ui.Button variant="destructive" onClick={handleEndMatchConfirm}>Confirm</ui.Button>
             </div>
          </ui.DialogContent>
        )}
      </main>
    </div>
  )
}
