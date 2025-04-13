import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  LogOut,
  Calendar,
  Award,
  Activity,
  Trophy,
  GraduationCap,
  Settings,
  User,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { ThemeToggle } from '../ui/ThemeToggle';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // Theme is now managed by ThemeToggle component
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: profileLoading } = useProfile(user?.id);

  // If no user, only redirect to auth page for protected routes
  useEffect(() => {
    // Allow these paths to be accessed without login
    const publicPaths = ['/', '/auth', '/home'];
    if (!user && !publicPaths.includes(location.pathname)) {
      navigate('/auth');
    }
  }, [user, navigate, location.pathname]);

  const sidebarItems = [
    { icon: Activity, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Award, label: 'View ATR', path: '/rankings' },
    { icon: Trophy, label: 'Coaching', path: '/coaching' },
    { icon: GraduationCap, label: 'Academy', path: '/academy' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsProfileMenuOpen(false);
    setIsSidebarOpen(false); // Close sidebar when navigating
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Auto-close sidebar on larger screens
      if (window.innerWidth >= 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex relative">
      {/* Unified Sidebar with Responsive Behavior */}
      {/* On desktop: Fixed position, always visible */}
      {/* On mobile: Absolute position, transforms off-canvas, shown when toggled */}
      
      {/* Backdrop overlay - only visible on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Single Responsive Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 glass border-r border-border overflow-y-auto
                   z-40 md:z-20 transition-transform duration-300 transform
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Trophy size={28} className="text-accent w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-accent">Africa Tennis</h1>
                <p className="text-sm opacity-80">Connect • Compete • Excel</p>
              </div>
            </div>
            {/* Close button - only visible on mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`w-full p-3 flex items-center space-x-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-accent text-primary'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <item.icon size={20} className={location.pathname === item.path ? 'text-primary' : ''} />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pt-4 border-t mt-auto">
            <button
              onClick={() => navigate('/switch-network')}
              className="w-full p-3 flex items-center space-x-3 hover:bg-surface-hover rounded-lg transition-colors mt-2"
            >
              <Trophy size={20} className="text-accent" />
              <span>Switch to RTLnetwork</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-h-screen relative">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 glass border-b border-border w-full">
          <div className="px-4 py-2 md:py-3 flex items-center justify-between w-full mx-auto">
            {/* Left side */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 hover:bg-surface-hover rounded-lg transition-colors mr-2"
              >
                <Menu size={24} />
              </button>
              
              <h2 className="text-lg font-semibold text-accent hidden sm:block">Dashboard</h2>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              <div className="relative">
                <button
                  onClick={handleProfileClick}
                  className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent hover:ring-opacity-50 transition-all focus:outline-none"
                >
                  {profileLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-surface">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-accent"></div>
                    </div>
                  ) : (
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'User'}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
                
                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-lg py-1 z-50 transition-all duration-200 transform origin-top-right"
                  >
                      <div className="px-4 py-2 border-b border-border">
                        {profileLoading ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-accent"></div>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium truncate">{profile?.full_name || 'User'}</p>
                            <p className="text-sm opacity-80 truncate">@{profile?.username || 'username'}</p>
                          </>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigate(`/profile/${user?.id}`)}
                          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-surface-hover transition-colors"
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => handleNavigate('/settings')}
                          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-surface-hover transition-colors"
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-surface-hover text-red-500 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full p-1 sm:p-2 md:p-3 pb-20 sm:pb-6"> 
          <div className="w-full max-w-[2000px] mx-auto overflow-visible"> 
            {/* The children components will be properly laid out according to the grid pattern */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}