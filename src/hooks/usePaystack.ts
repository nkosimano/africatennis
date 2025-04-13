import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // Amount in kobo (ZAR cents)
  currency: string;
  ref: string;
  callback: (response: any) => void;
  onClose: () => void;
}

interface PaymentMethod {
  id: string;
  last_four: string;
  card_type: string;
}

export function usePaystack() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const generateReference = () => {
    const timestamp = new Date().getTime();
    return `rtl_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const initializePayment = async (
    amountZAR: number,
    email: string,
    metadata: any = {},
    onSuccess?: (reference: string) => void
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Convert ZAR to kobo (cents)
      const amount = Math.round(amountZAR * 100);

      const config: PaystackConfig = {
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount,
        currency: 'ZAR',
        ref: generateReference(),
        callback: async (response) => {
          if (response.status === 'success') {
            try {
              // Record the transaction
              const { error: txError } = await supabase
                .from('transactions')
                .insert([
                  {
                    user_id: user?.id,
                    amount_zar: amountZAR,
                    paystack_reference: response.reference,
                    status: 'completed',
                    metadata
                  }
                ]);

              if (txError) throw txError;

              // Save payment method if it's new
              if (response.card) {
                const { error: pmError } = await supabase
                  .from('payment_methods')
                  .insert([
                    {
                      user_id: user?.id,
                      paystack_reference: response.reference,
                      last_four: response.card.last4,
                      card_type: response.card.card_type
                    }
                  ]);

                if (pmError) console.error('Error saving payment method:', pmError);
              }

              if (onSuccess) onSuccess(response.reference);
            } catch (err) {
              console.error('Error processing payment success:', err);
              setError('Payment successful but error updating records');
            }
          }
        },
        onClose: () => {
          // Handle popup closed
        },
      };

      const handler = window.PaystackPop.setup(config);
      handler.openIframe();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err instanceof Error ? err.message : 'Error initializing payment');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethods = async (): Promise<{ data: PaymentMethod[] | null; error: string | null }> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error fetching payment methods'
      };
    }
  };

  return {
    initializePayment,
    getPaymentMethods,
    loading,
    error
  };
}