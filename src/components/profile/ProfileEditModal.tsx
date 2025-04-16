import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';

interface ProfileEditModalProps {
  profile: Profile;
  onClose: () => void;
  onSave: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

export function ProfileEditModal({ profile, onClose, onSave }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    username: profile.username || '',
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    playing_style: profile.playing_style || '',
    preferred_hand: profile.preferred_hand || null,
    coach_hourly_rate: profile.coach_hourly_rate || null,
    coach_specialization: profile.coach_specialization || '',
    avatar_url: profile.avatar_url || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const playingStyles = [
    'Aggressive Baseliner',
    'Counter-Puncher',
    'Serve and Volley',
    'All-Court Player',
    'Defensive Baseliner'
  ];

  const checkUsername = async (username: string) => {
    if (!username || username === profile.username) {
      setUsernameAvailable(true);
      return;
    }

    try {
      setCheckingUsername(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(!data);
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: value }));
    checkUsername(value);
  };

  const handleAvatarChange = async (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameAvailable) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError(null);

    const updates: Partial<Profile> = {
      username: formData.username || null,
      full_name: formData.full_name || null,
      bio: formData.bio || null,
      playing_style: formData.playing_style || null,
      preferred_hand: (formData.preferred_hand || null) as Profile['preferred_hand'],
      coach_hourly_rate: formData.coach_hourly_rate ? Number(formData.coach_hourly_rate) : null,
      coach_specialization: formData.coach_specialization || null,
      avatar_url: formData.avatar_url,
    };

    const { error: saveError } = await onSave(updates);
    
    if (saveError) {
      setError(saveError);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Avatar Upload */}
          <div className="flex justify-center mb-6">
            <ProfileAvatarUpload 
              currentAvatarUrl={profile.avatar_url}
              onAvatarChange={handleAvatarChange}
              size="lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={handleUsernameChange}
              className={`w-full p-2 bg-surface rounded-lg focus:ring-2 transition-all ${
                checkingUsername
                  ? 'ring-yellow-500'
                  : usernameAvailable
                  ? 'focus:ring-accent'
                  : 'ring-2 ring-red-500'
              }`}
              placeholder="Enter a unique username"
            />
            {!usernameAvailable && (
              <p className="text-sm text-red-500 mt-1">Username is already taken</p>
            )}
            {checkingUsername && (
              <p className="text-sm text-yellow-500 mt-1">Checking username availability...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all h-24"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Playing Style</label>
              <select
                value={formData.playing_style}
                onChange={(e) => setFormData(prev => ({ ...prev, playing_style: e.target.value }))}
                className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              >
                <option value="">Select style</option>
                {playingStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preferred Hand</label>
              <select
                value={formData.preferred_hand || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_hand: e.target.value as Profile['preferred_hand'] || null }))}
                className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
              >
                <option value="">Select hand</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="ambidextrous">Ambidextrous</option>
              </select>
            </div>
          </div>

          {profile.is_coach && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hourly Rate (R)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.coach_hourly_rate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, coach_hourly_rate: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                  placeholder="Enter hourly rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.coach_specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, coach_specialization: e.target.value }))}
                  className="w-full p-2 bg-surface rounded-lg focus:ring-2 focus:ring-accent transition-all"
                  placeholder="e.g., Serve technique"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !usernameAvailable}
              className="px-4 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}