import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CameraIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';

interface ProfileAvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (url: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileAvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  size = 'md',
}: ProfileAvatarUploadProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  // Generate a default avatar using DiceBear if no image is available
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email?.charAt(0).toUpperCase() || '?'}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setIsUpdating(true);

      // Create a unique file path
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profilepicture')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profilepicture')
        .getPublicUrl(filePath);

      // Delete old avatar if it exists in our storage
      if (currentAvatarUrl?.includes('/storage/v1/object/public/profilepicture/')) {
        try {
          const oldPath = new URL(currentAvatarUrl).pathname.split('/').slice(3).join('/');
          await supabase.storage
            .from('profilepicture')
            .remove([oldPath]);
        } catch (err) {
          console.warn('Failed to delete old avatar:', err);
          // Non-critical error, continue with update
        }
      }

      // Update profile with new URL
      await onAvatarChange(publicUrl);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      if (error instanceof Error) {
        if (error.message.includes('storage/object-too-large')) {
          toast.error('Image is too large. Maximum size is 5MB');
        } else if (error.message.includes('storage/unauthorized')) {
          toast.error('You do not have permission to upload files');
        } else if (error.message.includes('storage/quota-exceeded')) {
          toast.error('Storage quota exceeded. Please contact support');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to update profile picture');
      }
    } finally {
      setIsUpdating(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <div
          className={`relative rounded-full overflow-hidden ${sizeClasses[size]} bg-zinc-800 flex items-center justify-center`}
        >
          <img
            src={currentAvatarUrl || defaultAvatar}
            alt="Profile avatar"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute bottom-0 right-0">
          <Button
            type="button"
            size="default"
            variant="outline"
            className="h-8 w-8 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdating}
            title="Upload profile picture"
          >
            <CameraIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUpdating}
      />
    </div>
  );
}
