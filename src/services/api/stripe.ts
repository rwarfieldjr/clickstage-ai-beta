/**
 * Stripe API Service
 *
 * Handles all Stripe-related operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreateCheckoutParams {
  priceId: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  metadata?: Record<string, string>;
}

/**
 * Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<{ url?: string; error?: string }> {
  try {
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
      console.error('Error creating checkout session:', error);
      return {
        error: error.message || 'Failed to create checkout session',
      };
    }

    if (!data?.url) {
      return {
        error: 'No checkout URL returned',
      };
    }

    return {
      url: data.url,
    };
  } catch (error: any) {
    console.error('Error in createCheckoutSession:', error);
    return {
      error: error.message,
    };
  }
}

/**
 * Get Stripe customer for current user
 */
export async function getStripeCustomer(): Promise<any | null> {
  try {
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
      console.error('Error fetching Stripe customer:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getStripeCustomer:', error);
    return null;
  }
}

/**
 * Get Stripe orders for current user
 */
export async function getStripeOrders(): Promise<any[]> {
  try {
    const customer = await getStripeCustomer();

    if (!customer) {
      return [];
    }

    const { data, error } = await supabase
      .from('stripe_orders')
      .select('*')
      .eq('customer_id', customer.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Stripe orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getStripeOrders:', error);
    return [];
  }
}

/**
 * Verify payment status
 */
export async function verifyPayment(sessionId: string): Promise<{ verified: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { sessionId },
    });

    if (error) {
      return {
        verified: false,
        error: error.message,
      };
    }

    return {
      verified: data?.verified || false,
    };
  } catch (error: any) {
    console.error('Error in verifyPayment:', error);
    return {
      verified: false,
      error: error.message,
    };
  }
}