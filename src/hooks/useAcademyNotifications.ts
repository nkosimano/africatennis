import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface AcademyNotification {
  id: string;
  user_id: string;
  academy_id: string; // Required field
  subscribed_at: string;
  // Note: email_notifications column doesn't exist in the table
  // We'll track subscription status just by the presence of a record
}

export function useAcademyNotifications(academyId: string = uuidv4()) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('academy_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('academy_id', academyId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setIsSubscribed(!!data);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    try {
      if (!user) throw new Error('User must be authenticated to subscribe');

      setLoading(true);
      setError(null);

      const { error: subscribeError } = await supabase
        .from('academy_notifications')
        .insert([
          {
            user_id: user.id,
            academy_id: academyId // Required field
            // email_notifications column doesn't exist in the table
          }
        ]);

      if (subscribeError) throw subscribeError;

      setIsSubscribed(true);
      return { error: null };
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      if (!user) throw new Error('User must be authenticated to unsubscribe');

      setLoading(true);
      setError(null);

      const { error: unsubscribeError } = await supabase
        .from('academy_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('academy_id', academyId);

      if (unsubscribeError) throw unsubscribeError;

      setIsSubscribed(false);
      return { error: null };
    } catch (err) {
      console.error('Error unsubscribing from notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe
  };
}