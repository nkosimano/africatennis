"use client"

import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card-description"
import { Calendar, Trophy, Users, UserCircle, Clock, MapPin, Star } from "lucide-react"

export const HomePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="w-full">
      {/* Quick Action Cards */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 max-w-full mx-auto">
        <Card className="bg-[var(--color-dropdown-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer" onClick={() => navigate('/schedule')}>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
            <Calendar className="h-8 w-8 text-[var(--color-accent)] mb-2" />
            <p className="text-sm font-medium">Schedule Match</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-dropdown-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer" onClick={() => navigate('/rankings')}>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
            <Trophy className="h-8 w-8 text-[var(--color-accent)] mb-2" />
            <p className="text-sm font-medium">View Rankings</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-dropdown-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer" onClick={() => navigate('/coaching')}>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
            <Users className="h-8 w-8 text-[var(--color-success)] mb-2" />
            <p className="text-sm font-medium">Find Coaching</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-dropdown-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer" onClick={() => navigate(user ? `/profile/${user.id}` : '/auth')}>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
            <UserCircle className="h-8 w-8 text-[var(--color-info)] mb-2" />
            <p className="text-sm font-medium">Your Profile</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="mt-4 grid gap-2 grid-cols-1 md:grid-cols-2">
        {/* Left Column */}
        <Card className="bg-[var(--color-dropdown-bg)] border-[var(--color-border)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Upcoming Matches</CardTitle>
              <CardDescription className="opacity-70">Your scheduled tennis matches</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[var(--color-accent)]"
              onClick={() => navigate('/schedule')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="rounded-lg bg-[var(--color-surface)] p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">bongani</h3>
                  <span className="text-xs bg-[var(--color-success)] bg-opacity-20 text-[var(--color-success)] px-2 py-1 rounded">Scheduled</span>
                </div>
                <p className="text-sm opacity-70">Match Singles Friendly</p>
                <div className="mt-2 flex items-center text-sm opacity-70">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>4/19/2025</span>
                </div>
                <div className="mt-1 flex items-center text-sm opacity-70">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>12:00 AM</span>
                </div>
                <div className="mt-1 flex items-center text-sm opacity-70">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Ndlovu Lifestyle Apartments</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card className="bg-[var(--color-dropdown-bg)] border-[var(--color-border)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription className="opacity-70">Your match history and results</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[var(--color-accent)]"
              onClick={() => navigate('/history')}
            >
              Match History
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 opacity-70">No recent activity to show.</div>
          </CardContent>
        </Card>
      </div>

      {/* Players Section */}
      <Card className="mt-4 bg-[var(--color-dropdown-bg)] border-[var(--color-border)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Players</CardTitle>
            <CardDescription className="opacity-70">Find and connect with other players</CardDescription>
          </div>
          <div className="w-full max-w-xs">
            <input 
              type="text" 
              placeholder="Search players..." 
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-b border-[var(--color-border)] mb-2">
            <div className="flex space-x-4">
              <button className="px-3 py-2 text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]">Favorites</button>
              <button className="px-3 py-2 opacity-70 hover:opacity-100">All Players</button>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-primary)] font-medium">
                  BO
                </div>
                <div>
                  <p className="text-sm font-medium">bongani</p>
                  <p className="text-xs opacity-70">@bongani</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-[var(--color-surface-hover)]">
                  <Calendar className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-warning)] hover:bg-[var(--color-surface-hover)]">
                  <Star className="h-4 w-4 fill-current" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--color-error)] flex items-center justify-center text-[var(--color-primary)] font-medium">
                  KA
                </div>
                <div>
                  <p className="text-sm font-medium">kagiso25</p>
                  <p className="text-xs opacity-70">@kagiso25</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-[var(--color-surface-hover)]">
                  <Calendar className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-warning)] hover:bg-[var(--color-surface-hover)]">
                  <Star className="h-4 w-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
