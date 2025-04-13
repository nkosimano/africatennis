import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseprofilepictureProps {
  userId: string | undefined;
  fallbackUrl?: string;
}

/**
 * Hook to handle profile picture retrieval with fallback mechanisms
 */
export function useprofilepicture({ userId, fallbackUrl }: UseprofilepictureProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a default avatar using DiceBear if no image is available
  const getDefaultAvatar = (username: string = 'User') => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;
  };

  useEffect(() => {
    if (!userId) return;
    
    const fetchprofilepicture = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First try to get the avatar_url from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.warn('Error fetching profile:', profileError.message);
          // If we can't get the profile, we'll try the fallback methods
        } else if (profileData && profileData.avatar_url) {
          // Check if the URL is a direct URL or a storage path
          if (profileData.avatar_url.startsWith('http')) {
            setAvatarUrl(profileData.avatar_url);
            setIsLoading(false);
            return;
          }
        }
          
        // If we're here, either:
        // 1. There was an error fetching the profile
        // 2. The profile exists but has no avatar_url
        // 3. The avatar_url is a storage path, not a URL
        
        // Try to find any images in the user's folder
        const { data: filesData, error: filesError } = await supabase.storage
          .from('profilepicture')
          .list(`${userId}`);
          
        if (filesError) {
          console.warn('Error listing files:', filesError.message);
        } else if (filesData && filesData.length > 0) {
          // Filter out folders and empty placeholders
          const imageFiles = filesData.filter(file => 
            !file.name.endsWith('/') && 
            !file.name.includes('.emptyFolderPlaceholder')
          );

          if (imageFiles.length > 0) {
            // Take the most recent file (assuming sorted by name with timestamp)
            const mostRecentFile = imageFiles
              .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
              
            if (mostRecentFile) {
              try {
                // Get public URL correctly
                const { data } = supabase.storage
                  .from('profilepicture')
                  .getPublicUrl(`${userId}/${mostRecentFile.name}`);
                
                // Update profile with this URL if not set
                if (profileData && !profileData.avatar_url) {
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: data.publicUrl })
                    .eq('id', userId);
                    
                  if (updateError) {
                    console.warn('Failed to update profile with avatar URL:', updateError.message);
                  }
                }
                
                setAvatarUrl(data.publicUrl);
                setIsLoading(false);
                return;
              } catch (urlErr) {
                console.error('Error getting public URL:', urlErr);
              }
            }
          }
        }
        
        // If we still don't have an avatar, use the fallback or default
        setAvatarUrl(fallbackUrl || getDefaultAvatar(userId));
      } catch (err) {
        console.error('Error in profile picture retrieval:', err);
        setError('Failed to load profile picture');
        setAvatarUrl(fallbackUrl || getDefaultAvatar(userId));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchprofilepicture();
  }, [userId, fallbackUrl]);
  
  return {
    avatarUrl,
    isLoading,
    error,
    getDefaultAvatar
  };
}
