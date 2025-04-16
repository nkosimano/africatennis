"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Trophy, ArrowRight, Star, Calendar, Users, ChevronDown, ChevronUp } from "lucide-react"

export default function LandingPage() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  // Handle scroll events for parallax and animations
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Scroll to section function
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Floating scroll to top button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[#00ffaa] text-black transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <ChevronUp className="h-6 w-6" />
      </button>
      
      {/* Hero Section with Neon Border */}
      <header className="relative border border-transparent overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="neon-border"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <nav className="flex justify-between items-center mb-16 fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-50 p-4">
            <div className="flex items-center">
              <Trophy size={32} className="mr-2 text-[#00ffaa]" />
              <span className="text-2xl font-bold">Africa Tennis</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-white hover:text-[#00ffaa] transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('players')} 
                className="text-white hover:text-[#00ffaa] transition-colors"
              >
                Players
              </button>
              <Button 
                variant="outline" 
                className="border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa20]"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="md:hidden border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa20]"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </nav>

          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">
                <span className="text-[#00ffaa]">Connect.</span> Play. <span className="text-[#00ffaa]">Win.</span>
              </h1>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
                <Button 
                  size="lg" 
                  className="bg-[#00ffaa] text-black hover:bg-[#00ffaa]/90 group transition-all duration-300"
                  onClick={() => navigate('/auth')}
                >
                  Join Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa20]"
                  onClick={() => scrollToSection('features')}
                >
                  Learn More
                  <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00ffaa] to-[#0077ff] opacity-75 blur-sm rounded-lg"></div>
              <img
                src="https://images.unsplash.com/photo-1595435934740-bf6b01088d19?q=80&w=1024"
                alt="Tennis Players"
                className="rounded-lg shadow-2xl relative z-10 w-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="neon-glow"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card group cursor-pointer" onClick={() => navigate('/schedule')}>
              <div className="p-8">
                <Calendar className="h-12 w-12 text-[#00ffaa] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-2 text-[#00ffaa]">Match</h3>
                <p className="text-gray-300">Find opponents in your area and schedule matches with just a few clicks.</p>
                <div className="mt-4 text-[#00ffaa] flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Schedule a match</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="feature-card group cursor-pointer" onClick={() => navigate('/rankings')}>
              <div className="p-8">
                <Trophy className="h-12 w-12 text-[#00ffaa] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-2 text-[#00ffaa]">Rate</h3>
                <p className="text-gray-300">Our unique rating system helps you track your progress and find players at your level.</p>
                <div className="mt-4 text-[#00ffaa] flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View rankings</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="feature-card group cursor-pointer" onClick={() => navigate('/coaching')}>
              <div className="p-8">
                <Users className="h-12 w-12 text-[#00ffaa] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-2 text-[#00ffaa]">Coach</h3>
                <p className="text-gray-300">Connect with qualified coaches to improve your game and take your skills to the next level.</p>
                <div className="mt-4 text-[#00ffaa] flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Find coaching</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Players Section */}
      <section id="players" className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="neon-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-12 text-center">Top Players</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["NT", "KM", "ZN"].map((initials, index) => (
              <div key={index} className="player-card group hover:transform hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate('/rankings')}>
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#00ffaa] to-[#0077ff] flex items-center justify-center text-black font-bold mr-3">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-xl">
                        {index === 0 ? "Nathi Tshuma" : index === 1 ? "Kagiso Molefe" : "Zola Nkosi"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold mr-2">{1542 - index * 30}</span>
                    <Star className="h-5 w-5 text-[#00ffaa] fill-current" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="neon-border-bottom"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Join Now</h2>
          <Button 
            size="lg" 
            className="bg-[#00ffaa] text-black hover:bg-[#00ffaa]/90 group transition-all duration-300"
            onClick={() => navigate('/auth')}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-[#00ffaa]/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Trophy size={24} className="mr-2 text-[#00ffaa]" />
              <span className="text-xl font-bold">Africa Tennis</span>
            </div>
            <p> 2025</p>
          </div>
        </div>
      </footer>

      {/* Global styles for neon effects */}
      <style>{`
        body {
          background-color: black;
        }
        
        .neon-border {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #00ffaa, #0077ff, #00ffaa);
          background-size: 200% 200%;
          animation: pulse 3s ease infinite;
          opacity: 0.5;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          padding: 1px;
        }
        
        .neon-border-bottom {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #00ffaa, #0077ff, #00ffaa);
          background-size: 200% 200%;
          animation: pulse 3s ease infinite;
          opacity: 0.5;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          padding-bottom: 1px;
        }
        
        .neon-glow {
          position: absolute;
          width: 150%;
          height: 150%;
          top: -25%;
          left: -25%;
          background: radial-gradient(circle, rgba(0,255,170,0.1) 0%, rgba(0,0,0,0) 70%);
        }
        
        .neon-pulse {
          position: absolute;
          width: 150%;
          height: 150%;
          top: -25%;
          left: -25%;
          background: radial-gradient(circle, rgba(0,119,255,0.1) 0%, rgba(0,0,0,0) 70%);
          animation: pulse-fade 4s ease infinite;
        }
        
        .feature-card {
          background-color: rgba(0,0,0,0.5);
          border: 1px solid rgba(0,255,170,0.2);
          border-radius: 0.5rem;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }
        
        .feature-card:hover {
          border-color: #00ffaa;
          box-shadow: 0 0 15px rgba(0,255,170,0.5);
          transform: translateY(-5px);
        }
        
        .player-card {
          background-color: rgba(0,0,0,0.5);
          border: 1px solid rgba(0,119,255,0.2);
          border-radius: 0.5rem;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }
        
        .player-card:hover {
          border-color: #0077ff;
          box-shadow: 0 0 15px rgba(0,119,255,0.5);
          transform: translateY(-5px);
        }
        
        @keyframes pulse {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse-fade {
          0% { opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #000;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00ffaa, #0077ff);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0077ff, #00ffaa);
        }
      `}</style>
    </div>
  )
}
