// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileEditModal } from '../components/profile/ProfileEditModal';
import { useProfile } from '../hooks/useProfile';
import { AchievementsDisplay } from '../components/profile/AchievementsDisplay';
import { SkillProgressChart } from '../components/profile/SkillProgressChart';
import { ChallengesDisplay } from '../components/profile/ChallengesDisplay';
import { usePlayerAchievements } from '../hooks/usePlayerAchievements';
import { usePlayerSkillHistory } from '../hooks/usePlayerSkillHistory';
import { usePlayerChallenges } from '../hooks/usePlayerChallenges';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { PlayerStats } from '../components/profile/PlayerStats';
import { PlayerMatchHistory } from '../components/profile/PlayerMatchHistory';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If no id is provided and user is not logged in, redirect to login
  useEffect(() => {
    if (!id && !user?.id) {
      navigate('/login');
    }
  }, [id, user, navigate]);

  // If no id is provided, use the current user's id
  const profileId = id || user?.id;
  
  const { profile, loading, error, updateProfile, isCurrentUser } = useProfile(profileId);
  const [isEditing, setIsEditing] = useState(false);
  const { achievements } = usePlayerAchievements(profileId);
  const { history } = usePlayerSkillHistory();
  const { challenges, updateChallenge } = usePlayerChallenges();
  const { stats } = usePlayerStats(profileId);
  const { events } = useEvents();

  const handleAvatarChange = async (url: string): Promise<void> => {
    try {
      if (!profile) {
        return;
      }

      // Update profile with the new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: url,
      });

      if (updateError) throw updateError;
      
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error updating avatar:', err);
      toast.error('Failed to update profile picture');
    }
  };

  // const handleMatchClick = (match: Event) => {
  //   // Handle match click - could show match details modal
  //   console.log('Match clicked:', match);
  // };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center text-red-500">
        <p>Error loading profile: {error || 'Profile not found'}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-4 sm:mb-6">
        <ProfileHeader
          profile={profile}
          onEdit={() => isCurrentUser && setIsEditing(true)}
          onAvatarChange={isCurrentUser ? handleAvatarChange : undefined}
          isCurrentUser={isCurrentUser}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <PlayerStats stats={stats} />
        </div>
        <div>
          <SkillProgressChart history={history} />
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <AchievementsDisplay achievements={achievements} />
      </div>

      <div className="mt-6 sm:mt-8">
        <PlayerMatchHistory
          profileMatches={events}
          profileId={profile.id}
        />
      </div>

      {isCurrentUser && (
        <div className="mt-6 sm:mt-8">
          <ChallengesDisplay
            challenges={challenges}
            onUpdateProgress={updateChallenge}
          />
        </div>
      )}

      {isEditing && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setIsEditing(false)}
          onSave={updateProfile}
        />
      )}
    </div>
  );
}
