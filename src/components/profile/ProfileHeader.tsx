import { motion } from 'framer-motion';
import { Trophy, Star, Award, Calendar } from 'lucide-react';
import type { Profile } from '../../types/index';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { supabase } from '@/lib/supabase';

interface ProfileHeaderProps {
  profile: Profile;
  onEdit: () => void;
  onAvatarChange?: (file: File) => Promise<void>;
  isCurrentUser: boolean;
}

export function ProfileHeader({
  profile,
  onEdit,
  onAvatarChange,
  isCurrentUser,
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name || 'User'}`;

  const handleAvatarUpdate = async (url: string) => {
    if (onAvatarChange) {
      try {
        // Create a dummy file - the ProfilePage component will check file.size and return early
        // But the real URL is directly passed to the profile's avatar_url field via useprofilepicture
        const dummyFile = new File([], "");
        
        // The URL itself will be used by useprofilepicture hook to update the avatar
        // We've updated that logic to update the profile directly
        await onAvatarChange(dummyFile);
        
        // Direct update to Supabase (the critical addition)
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('id', profile.id);
          
        if (error) {
          console.error('Error directly updating profile avatar_url:', error);
        }
      } catch (error) {
        console.error('Error updating avatar in ProfileHeader:', error);
      }
    }
  };

  const handleScheduleMatch = () => {
    navigate('/schedule', { state: { selectedOpponent: profile.id } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 mb-6 flex-1 mr-4"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {isCurrentUser && onAvatarChange ? (
          <ProfileAvatarUpload
            currentAvatarUrl={profile.avatar_url}
            onAvatarChange={handleAvatarUpdate}
            size="md"
          />
        ) : (
          <div className="relative">
            <img
              src={profile.avatar_url || defaultAvatar}
              alt={profile.full_name || 'User avatar'}
              className="w-32 h-32 rounded-full object-cover ring-2 ring-accent ring-offset-2 ring-offset-background"
            />
          </div>
        )}

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2">{profile.full_name || 'Welcome!'}</h1>
          <p className="text-lg opacity-80 mb-4">@{profile.username || 'username'}</p>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center">
              <Trophy size={20} className="text-accent mr-2" />
              <span>Rank #{profile.current_ranking_points_singles}</span>
            </div>
            <div className="flex items-center">
              <Star size={20} className="text-accent mr-2" />
              <span>Skill Level {profile.skill_level ?? '-'}</span>
            </div>
            {profile.is_coach && (
              <div className="flex items-center">
                <Award size={20} className="text-accent mr-2" />
                <span>Coach</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isCurrentUser ? (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleScheduleMatch}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Calendar size={20} />
              <span>Schedule Match</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}