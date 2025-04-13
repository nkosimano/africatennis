"use client"

import { motion } from "framer-motion"
import { ArrowLeftIcon, TrophyIcon, BarChartIcon, UsersIcon, InfoIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back</span>
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <TrophyIcon className="h-10 w-10 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold">About Africa Tennis Rating (ATR)</h1>
          </div>
          <p className="text-lg text-zinc-300">
            Welcome to the Africa Tennis Rating (ATR) system! ATR is designed to provide a fair and dynamic measure 
            of your tennis skill level, helping you find competitive matches and track your progress right here within our platform.
          </p>
        </motion.div>

        {/* Main content */}
        <div className="space-y-10">
          {/* What is ATR */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <InfoIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-semibold">What is ATR?</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              ATR is our platform's unique rating system developed to connect players across Africa. 
              It provides separate ratings for singles and doubles play, allowing you to see how you stack up in different formats.
            </p>
          </motion.section>

          {/* How is it calculated */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-zinc-900 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <BarChartIcon className="h-6 w-6 text-green-500" />
              <h2 className="text-2xl font-semibold">How is my ATR Calculated?</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              Your ATR is calculated using principles similar to the ELO rating system, commonly used in competitive games.
            </p>
            <ul className="list-disc list-inside space-y-3 text-zinc-300 ml-4">
              <li>
                <span className="font-medium text-white">Match Results:</span> Your rating changes based on the outcome of your ranked matches played against other users on the platform.
              </li>
              <li>
                <span className="font-medium text-white">Points System:</span> You gain or lose points based on who you play and the match result. Beating a higher-rated opponent generally earns you more points than beating a lower-rated opponent, while losing to a lower-rated opponent may cause a larger drop in points. Your rating history tracks these changes.
              </li>
              <li>
                <span className="font-medium text-white">Singles vs. Doubles:</span> You have distinct ATR points for singles and doubles, reflecting your skill in each format.
              </li>
              <li>
                <span className="font-medium text-white">Provisional vs. Established:</span> When you first join or haven't played many ranked matches, your rating might be 'Provisional'. After playing a sufficient number of matches (the exact number may vary), your rating becomes 'Established', indicating a higher level of confidence in its accuracy.
              </li>
              <li>
                <span className="font-medium text-white">Skill Level:</span> Alongside your ATR points, your profile might also display a skill level (potentially on a 1-7 scale) which can be updated over time.
              </li>
            </ul>
          </motion.section>

          {/* What Matches Count */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-zinc-900 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrophyIcon className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold">What Matches Count Towards ATR?</h2>
            </div>
            <ul className="list-disc list-inside space-y-3 text-zinc-300 ml-4">
              <li>
                <span className="font-medium text-white">Ranked Matches:</span> Only matches specifically designated as 'ranked' (e.g., match_singles_ranked, match_doubles_ranked) within the platform directly impact your ATR points calculation.
              </li>
              <li>
                <span className="font-medium text-white">Friendly Matches:</span> You can also log 'friendly' matches (match_singles_friendly, match_doubles_friendly), which are great for practice and connecting with others but do not affect your official ATR.
              </li>
              <li>
                <span className="font-medium text-white">Score Reporting:</span> Scores need to be logged accurately for ranked matches to be processed. For some match types, scores might require confirmation.
              </li>
            </ul>
          </motion.section>

          {/* How ATR Promotes Tennis */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-zinc-900 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <UsersIcon className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-semibold">How Does ATR Promote Tennis?</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              The ATR system is integrated with our platform's features to enhance your tennis experience:
            </p>
            <ul className="list-disc list-inside space-y-3 text-zinc-300 ml-4">
              <li>
                <span className="font-medium text-white">Finding Opponents:</span> Your ATR helps you find other players of a similar skill level for more competitive and enjoyable matches.
              </li>
              <li>
                <span className="font-medium text-white">Tracking Progress:</span> Watch your ATR change over time as you play more ranked matches and improve your game. You can view your ranking history and stats.
              </li>
              <li>
                <span className="font-medium text-white">Facilitating Competition:</span> The rating provides a basis for organizing level-based play, challenges, and potentially tournaments within the platform.
              </li>
              <li>
                <span className="font-medium text-white">Building Community:</span> Connect with players, find coaches, and schedule hitting or coaching sessions, all within a framework where skill levels are understood.
              </li>
            </ul>
          </motion.section>

          {/* Getting Started */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-green-900 rounded-xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-zinc-200">
              To get your ATR, you need to start playing ranked matches against other users on the platform. 
              Your initial rating will likely be provisional until you have completed several matches. 
              Join or schedule a ranked match today to establish your Africa Tennis Rating!
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate("/schedule")}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Schedule a Match
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
