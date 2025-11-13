/**
 * Admin API Service
 *
 * Handles all admin-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import { verifyAdmin, getCurrentUser } from './auth';
import { safeApiCall, ApiResult } from './index';

export async function requireAdmin(): Promise<ApiResult<true>> {
  return safeApiCall<true>(async () => {
    const result = await getCurrentUser();

    if (!result.ok) {
      throw new Error(result.error || "Unable to load current user");
    }

    const user = result.data;
    if (!user || !user.isAdmin) {
      throw new Error("Not authorized");
    }

    return true;
  });
}

/**
 * Get all orders with user information
 * GET /api/admin/orders
 */
export async function getAdminOrders(limit: number = 50): Promise<any[]> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return [];
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching admin orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAdminOrders:', error);
    return [];
  }
}

/**
 * Get all users with their roles and credit balances
 * GET /api/admin/users
 */
export async function getAdminUsers(): Promise<any[]> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return [];
    }

    // Get profiles with roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (role),
        user_credits (credits)
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching admin users:', profilesError);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('Error in getAdminUsers:', error);
    return [];
  }
}

/**
 * Get user details by ID
 */
export async function getAdminUserDetail(userId: string): Promise<any | null> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (role),
        user_credits (credits)
      `)
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user detail:', profileError);
      return null;
    }

    // Get user's orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get user's credit transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return {
      ...profile,
      orders: orders || [],
      transactions: transactions || [],
    };
  } catch (error) {
    console.error('Error in getAdminUserDetail:', error);
    return null;
  }
}

/**
 * Get dashboard statistics
 */
export async function getAdminStats(): Promise<any> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return null;
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']);

    // Get completed orders
    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get credit stats
    const { data: creditTransactions } = await supabase
      .from('credit_transactions')
      .select('amount, transaction_type');

    const creditsSold = creditTransactions
      ?.filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const creditsUsed = creditTransactions
      ?.filter(t => t.transaction_type === 'deduction')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      creditsSold,
      creditsUsed,
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return null;
  }
}

/**
 * Send test email
 * POST /api/admin/send-test-email
 */
export async function sendTestEmail(to: string, testType?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required',
      };
    }

    const { data, error } = await supabase.functions.invoke('test-email', {
      body: {
        to,
        testType: testType || 'default',
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error in sendTestEmail:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user credits (admin action)
 */
export async function updateUserCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required',
      };
    }

    // Get current balance
    const { data: currentData } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = currentData?.credits || 0;
    const newBalance = currentBalance + amount;

    // Update credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: newBalance,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount,
      transaction_type: 'admin_adjustment',
      description: reason,
      balance_after: newBalance,
    });

    // Log audit event
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      event_type: 'admin_credit_adjustment',
      user_id: user?.id,
      details: {
        target_user_id: userId,
        amount,
        reason,
        new_balance: newBalance,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserCredits:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}