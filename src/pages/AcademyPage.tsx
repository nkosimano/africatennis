import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Video, Users, ArrowRight, Bell, Loader, Check } from 'lucide-react';
import { useAcademyNotifications } from '../hooks/useAcademyNotifications';

export function AcademyPage() {
  const { isSubscribed, loading, error, subscribe, unsubscribe } = useAcademyNotifications();
  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const features = [
    {
      icon: BookOpen,
      title: 'Structured Learning Paths',
      description: 'From beginner to advanced, follow curated paths to improve your tennis game systematically.'
    },
    {
      icon: Video,
      title: 'Live Online Training',
      description: 'Join interactive sessions with professional coaches from around the world.'
    },
    {
      icon: Users,
      title: 'Group Learning',
      description: 'Practice and learn together with players at your skill level.'
    }
  ];

  const handleNotificationToggle = async () => {
    try {
      setLocalError(null);
      if (isSubscribed) {
        const { error: unsubError } = await unsubscribe();
        if (unsubError) {
          setLocalError(unsubError);
          return;
        }
      } else {
        const { error: subError } = await subscribe();
        if (subError) {
          setLocalError(subError);
          return;
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Notification toggle error:', err);
      setLocalError(err instanceof Error ? err.message : 'An error occurred while toggling notifications');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="relative">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-accent bg-opacity-10 rounded-full">
              <GraduationCap size={48} className="text-accent" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">Africa Tennis Academy</h1>
          <p className="text-xl opacity-80 mb-8">
            Your journey to tennis excellence begins here
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleNotificationToggle}
              disabled={loading}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                isSubscribed
                  ? 'bg-surface text-accent border border-accent hover:bg-accent hover:bg-opacity-10'
                  : 'bg-accent text-primary hover:bg-opacity-90'
              }`}
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : isSubscribed ? (
                <>
                  <Check size={20} />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <Bell size={20} />
                  <span>Notify Me When Available</span>
                </>
              )}
            </button>
            <a
              href="https://www.coursera.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-accent text-accent rounded-lg hover:bg-accent hover:bg-opacity-10 transition-colors flex items-center gap-2"
            >
              <span>Learn More</span>
              <ArrowRight size={20} />
            </a>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 text-green-500 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>You'll be notified when RTL Academy launches!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-red-500"
            >
              {error || localError}
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass p-6 rounded-xl text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent bg-opacity-10 rounded-lg">
                  <feature.icon size={24} className="text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="opacity-80">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass p-8 rounded-xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-accent opacity-5"></div>
          <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
          <p className="text-lg opacity-80 mb-6">
            We're partnering with Coursera to bring you world-class tennis education.
            Get ready to transform your game with expert-led courses and live training sessions.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm opacity-80">
            <span>• Professional Certification</span>
            <span>• Interactive Workshops</span>
            <span>• Performance Analytics</span>
            <span>• Community Support</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}