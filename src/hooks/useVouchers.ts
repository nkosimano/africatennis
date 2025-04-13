import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Voucher {
  id: string;
  code: string;
  description: string;
  amount_zar: number;
  is_percentage: boolean;
  expires_at: string | null;
}

interface VoucherRedemption {
  success: boolean;
  message: string;
  amount: number;
}

export function useVouchers() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateVoucher = async (code: string): Promise<{ 
    data: Voucher | null; 
    error: string | null 
  }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        return { data: null, error: 'Invalid voucher code' };
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { data: null, error: 'Voucher has expired' };
      }

      // Check if user has already used this voucher
      const { data: redemption, error: redemptionError } = await supabase
        .from('voucher_redemptions')
        .select('id')
        .eq('voucher_id', data.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (redemptionError) throw redemptionError;

      if (redemption) {
        return { data: null, error: 'You have already used this voucher' };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error validating voucher:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error validating voucher' 
      };
    } finally {
      setLoading(false);
    }
  };

  const redeemVoucher = async (
    code: string,
    subscriptionId: string
  ): Promise<{ data: VoucherRedemption | null; error: string | null }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: redeemError } = await supabase
        .rpc('redeem_voucher', {
          p_voucher_code: code,
          p_user_id: user?.id,
          p_subscription_id: subscriptionId
        });

      if (redeemError) throw redeemError;

      return { data, error: null };
    } catch (err) {
      console.error('Error redeeming voucher:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error redeeming voucher' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    validateVoucher,
    redeemVoucher,
    loading,
    error
  };
}