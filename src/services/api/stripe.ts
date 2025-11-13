/**
 * Stripe API Service
 *
 * Handles all Stripe-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import { safeApiCall, ApiResult } from './index';

export interface CreateCheckoutParams {
  priceId: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResponse {
  url: string;
}

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<ApiResult<CheckoutResponse>> {
  return safeApiCall(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.functions.invoke('create-simple-checkout', {
      body: {
        priceId: params.priceId,
        quantity: params.quantity,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        userId: params.userId || user?.id,
        customerEmail: user?.email,
        metadata: params.metadata || {},
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned');
    }

    return { url: data.url };
  });
}

/**
 * Get Stripe customer for current user
 */
export async function getStripeCustomer(): Promise<ApiResult<any | null>> {
  return safeApiCall(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  });
}

/**
 * Get Stripe orders for current user
 */
export async function getStripeOrders(): Promise<ApiResult<any[]>> {
  return safeApiCall(async () => {
    const customerResult = await getStripeCustomer();

    if (!customerResult.ok || !customerResult.data) {
      return [];
    }

    const { data, error } = await supabase
      .from('stripe_orders')
      .select('*')
      .eq('customer_id', customerResult.data.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  });
}

export interface PaymentVerification {
  verified: boolean;
}

/**
 * Verify payment status
 */
export async function verifyPayment(sessionId: string): Promise<ApiResult<PaymentVerification>> {
  return safeApiCall(async () => {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { sessionId },
    });

    if (error) {
      throw new Error(error.message || 'Payment verification failed');
    }

    return {
      verified: data?.verified || false,
    };
  });
}
