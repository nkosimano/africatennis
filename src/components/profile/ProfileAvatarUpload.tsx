import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useprofilepicture } from '@/hooks/useprofilepicture';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CameraIcon } from 'lucide-react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use our new hook to handle profile picture retrieval
  const { avatarUrl, isLoading } = useprofilepicture({
    userId: user?.id,
    fallbackUrl: currentAvatarUrl || undefined,
  });

  // The avatar URL to display (preview, current, or default)
  const displayUrl = previewUrl || avatarUrl || null;

  // Size classes
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setError(null);

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!user) {
      setError('You must be logged in to upload an avatar');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
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
      
      // Update the profile
      await onAvatarChange(publicUrl);
      
      // Clear the preview since we'll get the real URL from the parent component
      setPreviewUrl(null);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      
      // Provide more specific error messages based on the error
      if (err instanceof Error) {
        if (err.message.includes('storage/object-too-large')) {
          setError('Image is too large. Maximum size is 5MB.');
        } else if (err.message.includes('storage/unauthorized')) {
          setError('You do not have permission to upload files.');
        } else if (err.message.includes('storage/bucket-not-found')) {
          setError('Storage bucket not found. Please check if the "profilepicture" bucket exists in your Supabase project.');
        } else if (err.message.includes('storage/quota-exceeded')) {
          setError('Storage quota exceeded. Please contact support.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error uploading avatar');
      }
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        {isLoading ? (
          <Skeleton className={`rounded-full ${sizeClasses[size]}`} />
        ) : (
          <div
            className={`relative rounded-full overflow-hidden ${sizeClasses[size]} bg-zinc-800 flex items-center justify-center`}
          >
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Profile avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`text-zinc-400 ${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}

        {!isLoading && (
          <div className="absolute bottom-0 right-0">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload new avatar"
            >
              <CameraIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading && <p className="text-zinc-500 text-sm mt-1">Uploading...</p>}
    </div>
  );
}
