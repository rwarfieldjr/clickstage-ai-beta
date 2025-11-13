/**
 * Orders API Service
 *
 * Handles all order-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import { deductCredits } from './credits';

export interface CreateOrderParams {
  userId: string;
  originalImageUrl: string;
  stagingStyle: string;
  stagingNotes?: string;
  propertyAddress?: string;
  creditsUsed: number;
  stripePaymentId?: string;
  sessionId?: string;
}

export interface Order {
  id: string;
  user_id: string;
  original_image_url: string;
  staged_image_url?: string;
  staging_style: string;
  staging_notes?: string;
  property_address?: string;
  status: string;
  stripe_payment_id?: string;
  session_id?: string;
  credits_used: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new order
 * POST /api/orders/create
 */
export async function createOrder(params: CreateOrderParams): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    // Validate credit balance if using credits
    if (!params.stripePaymentId && params.creditsUsed > 0) {
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', params.userId)
        .maybeSingle();

      const currentBalance = creditsData?.credits || 0;

      if (currentBalance < params.creditsUsed) {
        return {
          success: false,
          error: 'Insufficient credits',
        };
      }
    }

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: params.userId,
        original_image_url: params.originalImageUrl,
        staging_style: params.stagingStyle,
        staging_notes: params.stagingNotes,
        property_address: params.propertyAddress,
        status: 'pending',
        stripe_payment_id: params.stripePaymentId,
        session_id: params.sessionId,
        credits_used: params.creditsUsed,
      })
      .select()
      .single();

    if (orderError) {
      return {
        success: false,
        error: `Error creating order: ${orderError.message}`,
      };
    }

    // Deduct credits if not using Stripe
    if (!params.stripePaymentId && params.creditsUsed > 0) {
      const deductResult = await deductCredits(params.userId, params.creditsUsed, orderData.id);

      if (!deductResult.success) {
        // Rollback order creation
        await supabase.from('orders').delete().eq('id', orderData.id);

        return {
          success: false,
          error: deductResult.error || 'Failed to deduct credits',
        };
      }
    }

    // Log audit event
    await supabase.from('audit_log').insert({
      event_type: 'order_created',
      user_id: params.userId,
      details: {
        order_id: orderData.id,
        staging_style: params.stagingStyle,
        credits_used: params.creditsUsed,
        payment_method: params.stripePaymentId ? 'stripe' : 'credits',
      },
    });

    return {
      success: true,
      order: orderData,
    };
  } catch (error: any) {
    console.error('Error in createOrder:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return [];
  }
}

/**
 * Get single order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrder:', error);
    return null;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  stagedImageUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (stagedImageUrl) {
      updateData.staged_image_url = stagedImageUrl;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateOrderStatus:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}