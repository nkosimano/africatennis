// import React from 'react';
import { Trophy, CheckCircle } from 'lucide-react';

const EnhancedScoreboard = () => {
  return (
    <div className="scoreboard-card h-[57%] overflow-hidden border-2 rounded-lg">
      <div className="flex flex-col space-y-1.5 p-2">
        <div className="flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-medium flex items-center text-foreground">
            <Trophy className="h-4 w-4 mr-2 text-emerald-500" />
            Africa Tennis Championship
          </h3>
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground animate-pulse border-border">
            Live
          </div>
        </div>
      </div>
      
      <div className="h-[calc(100%-4rem)] p-2 flex flex-col">
        <div className="flex-1 grid grid-cols-7 gap-2 items-center">
          {/* Player 1 */}
          <div className="col-span-2 text-center">
            <div className="flex flex-col items-center">
              <div className="relative mb-1 sm:mb-2">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full scoreboard-player-avatar p-1 ring-2 ring-yellow-400 ring-offset-2 ring-offset-background">
                  <img 
                    src="https://placehold.co/100x100/A0AEC0/FFFFFF?text=P1" 
                    alt="Nathi Dhliso"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-0.5 truncate w-full px-1 text-foreground">
                Nathi Dhliso
              </h3>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <span>#12</span>
              </div>
            </div>
          </div>

          {/* Score Panel */}
          <div className="col-span-3 rounded-xl scoreboard-center-panel p-2 sm:p-4">
            <div className="text-center mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sets</div>
              <div className="flex justify-center items-center gap-3">
                <div className="text-2xl sm:text-3xl font-medium text-foreground">0</div>
                <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">-</div>
                <div className="text-2xl sm:text-3xl font-medium text-foreground">0</div>
              </div>
            </div>
            
            <div className="flex justify-center w-full">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Games</div>
                  <div className="flex justify-center gap-8">
                    <div className="text-lg sm:text-xl font-medium text-foreground">0</div>
                    <div className="text-lg sm:text-xl font-medium text-foreground">0</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Points</div>
                  <div className="flex justify-center gap-8">
                    <div className="text-lg sm:text-xl font-medium text-foreground">0</div>
                    <div className="text-lg sm:text-xl font-medium text-foreground">0</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Aces</div>
                  <div className="flex justify-center gap-8">
                    <div className="text-lg sm:text-xl font-semibold text-foreground/80">0</div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground/80">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="col-span-2 text-center">
            <div className="flex flex-col items-center">
              <div className="relative mb-1 sm:mb-2">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full scoreboard-player-avatar p-1">
                  <img 
                    src="https://placehold.co/100x100/718096/FFFFFF?text=P2" 
                    alt="Player B"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-0.5 truncate w-full px-1 text-foreground">
                Player B
              </h3>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <span>#15</span>
              </div>
            </div>
          </div>
        </div>

        {/* Win Probability */}
        <div className="mt-2 p-2 rounded-lg scoreboard-stats-panel">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs sm:text-sm font-medium text-foreground">Win Probability</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium w-12 sm:w-16 text-right truncate text-foreground">
                Nathi Dhliso
              </div>
              <div className="flex-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full scoreboard-progress-bar transition-all duration-300 ease-out" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="text-xs font-medium w-8 text-foreground">50%</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium w-12 sm:w-16 text-right truncate text-foreground">
                Player B
              </div>
              <div className="flex-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full scoreboard-progress-bar transition-all duration-300 ease-out" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="text-xs font-medium w-8 text-foreground">50%</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-4 mb-2 sticky bottom-2 z-50">
          <button className="scoreboard-button inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 relative">
            Switch Serve
          </button>
          <button className="scoreboard-button-primary inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 relative">
            <CheckCircle className="h-3 w-3 mr-1" />
            End & Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedScoreboard; 