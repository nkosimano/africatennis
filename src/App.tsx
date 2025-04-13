import { Routes, Route } from 'react-router-dom';
import { ToastProvider, ToastViewport } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RankingsPage } from '@/pages/RankingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import ProfileDebugPage from './pages/ProfileDebugPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { CoachingPage } from '@/pages/CoachingPage';
import { AcademyPage } from '@/pages/AcademyPage';
import { SettingsPage } from '@/pages/SettingsPage';
import TempScoreTestPage from './pages/TempScoreTestPage';
import MatchScoringPage from './pages/MatchScoringPage';
import LandingPage from './pages/LandingPage';
// Import commented out to disable ThemeDebugger
// import { ThemeDebugger } from './components/ui/ThemeDebugger';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/score-test" element={<TempScoreTestPage />} />
          <Route path="/profile-debug" element={<ProfileDebugPage />} />
          <Route
            path="/rankings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RankingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/member-home"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HomePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SchedulePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coaching"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoachingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academy"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AcademyPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scoring/:eventId"
            element={
              <ProtectedRoute>
                <MatchScoringPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastProvider>
          <ToastViewport />
        </ToastProvider>
        {/* ThemeDebugger removed to disable theme debugging */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;