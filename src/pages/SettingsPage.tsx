import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Globe,
  Shield,
  User,
  Mail,
  MapPin,
  Sun,
  Moon,
  Trophy,
  MessageSquare,
  History,
  Swords
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
// ThemeContext has been removed
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
// import { supabase } from '../lib/supabase';

export function SettingsPage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile(user?.id);
  // Get theme from document attribute instead of context
  const [theme, setTheme] = useState<'dark' | 'light'>(document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    emailNotifications: {
      matches: true,
      rankings: true,
      messages: true,
      tournaments: true
    },
    privacy: {
      showSkillLevel: true,
      showMatchHistory: true,
      showLocation: true,
      allowChallenges: true
    },
    preferences: {
      searchRadius: profile?.search_radius_km || 25,
      darkMode: theme === 'dark'
    }
  });

  const handleNotificationChange = (key: keyof typeof settings.emailNotifications) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key]
      }
    }));
  };

  const handlePrivacyChange = (key: keyof typeof settings.privacy) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
  };

  const handleRadiusChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        searchRadius: value
      }
    }));
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Apply theme changes
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    } else {
      root.removeAttribute('data-theme');
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
    
    // Save preference
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
    
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        darkMode: newTheme === 'dark'
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Update profile settings in Supabase
      const { error: updateError } = await updateProfile({
        search_radius_km: settings.preferences.searchRadius,
        updated_at: new Date().toISOString()
      });

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Notification Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-accent" size={24} />
            <h2 className="text-xl font-semibold">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <Mail size={18} />
                <span>Match Updates</span>
              </label>
              <Switch
                checked={settings.emailNotifications.matches}
                onCheckedChange={() => handleNotificationChange('matches')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <Trophy size={18} />
                <span>Ranking Changes</span>
              </label>
              <Switch
                checked={settings.emailNotifications.rankings}
                onCheckedChange={() => handleNotificationChange('rankings')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <MessageSquare size={18} />
                <span>New Messages</span>
              </label>
              <Switch
                checked={settings.emailNotifications.messages}
                onCheckedChange={() => handleNotificationChange('messages')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <Trophy size={18} />
                <span>Tournament Updates</span>
              </label>
              <Switch
                checked={settings.emailNotifications.tournaments}
                onCheckedChange={() => handleNotificationChange('tournaments')}
              />
            </div>
          </div>
        </motion.section>

        {/* Privacy Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-accent" size={24} />
            <h2 className="text-xl font-semibold">Privacy Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <User size={18} />
                <span>Show Skill Level</span>
              </label>
              <Switch
                checked={settings.privacy.showSkillLevel}
                onCheckedChange={() => handlePrivacyChange('showSkillLevel')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <History size={18} />
                <span>Show Match History</span>
              </label>
              <Switch
                checked={settings.privacy.showMatchHistory}
                onCheckedChange={() => handlePrivacyChange('showMatchHistory')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <MapPin size={18} />
                <span>Show Location</span>
              </label>
              <Switch
                checked={settings.privacy.showLocation}
                onCheckedChange={() => handlePrivacyChange('showLocation')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <Swords size={18} />
                <span>Allow Challenges</span>
              </label>
              <Switch
                checked={settings.privacy.allowChallenges}
                onCheckedChange={() => handlePrivacyChange('allowChallenges')}
              />
            </div>
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-accent" size={24} />
            <h2 className="text-xl font-semibold">Preferences</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <MapPin size={18} />
                <span>Search Radius: {settings.preferences.searchRadius}km</span>
              </label>
              <Slider
                value={[settings.preferences.searchRadius]}
                onValueChange={([value]) => handleRadiusChange(value)}
                min={5}
                max={100}
                step={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span>Dark Mode</span>
              </label>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </div>
        </motion.section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-6 py-2 bg-accent text-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 