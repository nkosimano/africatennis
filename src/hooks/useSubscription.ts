import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) throw fetchError;
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startTrial = async () => {
    try {
      if (!user) throw new Error('User must be logged in');
      if (subscription) throw new Error('User already has a subscription');

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

      const { error: subscribeError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            plan_type: 'pro',
            status: 'trial',
            trial_ends_at: trialEndDate.toISOString(),
            current_period_end: trialEndDate.toISOString()
          }
        ]);

      if (subscribeError) throw subscribeError;

      await fetchSubscription();
      return { error: null };
    } catch (err) {
      console.error('Error starting trial:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const isFeatureAvailable = (feature: 'ranked_matches' | 'coaching' | 'analytics') => {
    if (!subscription) return false;
    if (subscription.status === 'inactive') return false;
    if (subscription.status === 'trial') return true;

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    if (now > periodEnd) return false;

    switch (feature) {
      case 'ranked_matches':
        return ['pro', 'premium'].includes(subscription.plan_type);
      case 'coaching':
      case 'analytics':
        return subscription.plan_type === 'premium';
      default:
        return false;
    }
  };

  return {
    subscription,
    loading,
    error,
    startTrial,
    isFeatureAvailable,
    refresh: fetchSubscription
  };
}