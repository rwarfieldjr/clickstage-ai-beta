/**
 * Credits API Service
 *
 * Handles all credit-related operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreditBalance {
  credits: number;
  userId: string;
}

export interface AddCreditsParams {
  userId: string;
  amount: number;
  reason: string;
  stripePaymentId?: string;
}

/**
 * Get current user's credit balance
 * GET /api/credits/balance
 */
export async function getCreditBalance(): Promise<CreditBalance | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching credit balance:', error);
      return null;
    }

    return {
      credits: data?.credits || 0,
      userId: user.id,
    };
  } catch (error) {
    console.error('Error in getCreditBalance:', error);
    return null;
  }
}

/**
 * Add credits to user account
 * POST /api/credits/add
 *
 * This is typically called after Stripe checkout success
 */
export async function addCredits(params: AddCreditsParams): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  try {
    // Get current balance
    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', params.userId)
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        error: `Error fetching current balance: ${fetchError.message}`,
      };
    }

    const currentBalance = currentData?.credits || 0;
    const newBalance = currentBalance + params.amount;

    // Update credits using atomic operation
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: params.userId,
        credits: newBalance,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      return {
        success: false,
        error: `Error updating credits: ${updateError.message}`,
      };
    }

    // Log transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: params.userId,
        amount: params.amount,
        transaction_type: 'purchase',
        description: params.reason,
        stripe_payment_id: params.stripePaymentId,
        balance_after: newBalance,
      });

    if (transactionError) {
      console.error('Error logging transaction:', transactionError);
      // Don't fail the entire operation if logging fails
    }

    // Log audit event
    await supabase.from('audit_log').insert({
      event_type: 'credit_purchase',
      user_id: params.userId,
      details: {
        amount: params.amount,
        reason: params.reason,
        stripe_payment_id: params.stripePaymentId,
        new_balance: newBalance,
      },
    });

    return {
      success: true,
      newBalance,
    };
  } catch (error: any) {
    console.error('Error in addCredits:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(userId: string, amount: number, orderId?: string): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  try {
    // Get current balance
    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        error: `Error fetching current balance: ${fetchError.message}`,
      };
    }

    const currentBalance = currentData?.credits || 0;

    if (currentBalance < amount) {
      return {
        success: false,
        error: 'Insufficient credits',
      };
    }

    const newBalance = currentBalance - amount;

    // Update credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      return {
        success: false,
        error: `Error deducting credits: ${updateError.message}`,
      };
    }

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'deduction',
      description: 'Order placement',
      order_id: orderId,
      balance_after: newBalance,
    });

    return {
      success: true,
      newBalance,
    };
  } catch (error: any) {
    console.error('Error in deductCredits:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(userId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreditHistory:', error);
    return [];
  }
}