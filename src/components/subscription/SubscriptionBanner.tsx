import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ChevronRight } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

interface SubscriptionBannerProps {
  onStartTrial: () => void;
  onUpgrade: () => void;
}

export function SubscriptionBanner({ onStartTrial, onUpgrade }: SubscriptionBannerProps) {
  const { subscription, loading } = useSubscription();

  if (loading) return null;

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600/20 to-yellow-500/10 rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-lg">
              <Crown className="text-accent h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Unlock Premium Features
              </h3>
              <p className="text-sm opacity-80">
                Get access to ranked matches, coaching sessions, and advanced analytics
              </p>
            </div>
          </div>
          <button
            onClick={onStartTrial}
            className="flex items-center gap-2 px-6 py-2 bg-accent text-primary rounded-lg hover:bg-accent/90 transition-colors"
          >
            Start Free Trial
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (subscription.status === 'trial') {
    const daysLeft = Math.ceil(
      (new Date(subscription.trial_ends_at!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-500/20 to-green-600/10 rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Crown className="text-amber-500 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Trial Period Active
              </h3>
              <p className="text-sm opacity-80">
                {daysLeft} days remaining in your trial. Upgrade now to continue access.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Upgrade Now
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}