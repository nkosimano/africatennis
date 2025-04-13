// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileEditModal } from '../components/profile/ProfileEditModal';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
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

import type { Event } from '../hooks/useEvents';

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

  const handleAvatarChange = async (file: File) => {
    try {
      if (!profile || !file.size) {
        // If this is called from the ProfileAvatarUpload component with an empty file,
        // it means the URL is already updated in the profile state
        return;
      }

      // Get file extension, default to jpg if not found
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload directly to the 'profilepicture' bucket
      const { error: uploadError } = await supabase.storage
        .from('profilepicture')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profilepicture')
        .getPublicUrl(fileName);

      // Update profile with the new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) throw updateError;
      
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('storage/object-too-large')) {
          toast.error('Image is too large. Maximum size is 5MB.');
        } else if (err.message.includes('storage/unauthorized')) {
          toast.error('You do not have permission to upload files.');
        } else if (err.message.includes('storage/bucket-not-found')) {
          toast.error('Storage bucket not found. Please check if the "profilepicture" bucket exists in your Supabase project.');
        } else if (err.message.includes('storage/quota-exceeded')) {
          toast.error('Storage quota exceeded. Please contact support.');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Error uploading avatar');
      }
    }
  };

  const handleMatchClick = (match: Event) => {
    // Handle match click - could show match details modal
    console.log('Match clicked:', match);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-accent" size={32} />
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
          matches={events}
          onMatchClick={handleMatchClick}
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
