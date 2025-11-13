/**
 * Admin API Service
 *
 * Handles all admin-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import { verifyAdmin, getCurrentUser } from './auth';
import { safeApiCall, ApiResult } from './index';

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  credits: number;
  last_login: string | null;
};

export type AdminStats = {
  totalUsers: number;
  totalCreditsOutstanding: number;
  totalOrders: number;
  ordersToday: number;
};

export type AdminOrder = {
  id: string;
  user_id: string;
  user_email: string;
  status: string;
  created_at: string;
  total_images: number;
  credits_used: number;
  stripe_amount: number | null;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
  order_id: string | null;
};

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
export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return { totalUsers: 0, totalCreditsOutstanding: 0, totalOrders: 0, ordersToday: 0 };
    }

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: creditsData } = await supabase
      .from('user_credits')
      .select('credits');

    const totalCreditsOutstanding = creditsData?.reduce((sum, row) => sum + (row.credits || 0), 0) || 0;

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: ordersToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    return {
      totalUsers: totalUsers || 0,
      totalCreditsOutstanding,
      totalOrders: totalOrders || 0,
      ordersToday: ordersToday || 0,
    };
  } catch (error) {
    console.error('Error in fetchAdminStats:', error);
    return { totalUsers: 0, totalCreditsOutstanding: 0, totalOrders: 0, ordersToday: 0 };
  }
}

/**
 * Fetch users with credit balances
 */
export async function fetchAdminUsersWithCredits(search?: string): Promise<AdminUserRow[]> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return [];
    }

    let query = supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        role,
        last_login,
        user_credits (credits)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      credits: row.user_credits?.[0]?.credits || 0,
      last_login: row.last_login,
    }));
  } catch (error) {
    console.error('Error in fetchAdminUsersWithCredits:', error);
    return [];
  }
}

/**
 * Adjust user credits with reason
 */
export async function adjustUserCredits(
  userId: string,
  delta: number,
  reason: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      return {
        success: false,
        newBalance: 0,
        error: 'Unauthorized: Admin access required',
      };
    }

    const { data: currentData } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBalance = currentData?.credits || 0;
    const newBalance = Math.max(0, currentBalance + delta);

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
        newBalance: currentBalance,
        error: updateError.message,
      };
    }

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: delta,
      transaction_type: 'admin_adjustment',
      description: reason,
      balance_after: newBalance,
    });

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      event_type: 'admin_credit_adjustment',
      user_id: user?.id,
      details: {
        target_user_id: userId,
        amount: delta,
        reason,
        new_balance: newBalance,
      },
    });

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error in adjustUserCredits:', error);
    return {
      success: false,
      newBalance: 0,
      error: error.message,
    };
  }
}

/**
 * Fetch admin orders with filters
 */
export async function fetchAdminOrders(params?: { status?: string }): Promise<AdminOrder[]> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return [];
    }

    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        created_at,
        total_images,
        credits_used,
        stripe_amount,
        profiles:user_id (email)
      `)
      .order('created_at', { ascending: false });

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_email: row.profiles?.email || 'N/A',
      status: row.status,
      created_at: row.created_at,
      total_images: row.total_images || 0,
      credits_used: row.credits_used || 0,
      stripe_amount: row.stripe_amount,
    }));
  } catch (error) {
    console.error('Error in fetchAdminOrders:', error);
    return [];
  }
}

/**
 * Fetch credit transactions
 */
export async function fetchCreditTransactions(params?: { userId?: string }): Promise<CreditTransaction[]> {
  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      console.error('Unauthorized: User is not an admin');
      return [];
    }

    let query = supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        amount,
        transaction_type,
        description,
        balance_after,
        created_at,
        order_id,
        profiles:user_id (email)
      `)
      .order('created_at', { ascending: false });

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_email: row.profiles?.email || 'N/A',
      amount: row.amount,
      transaction_type: row.transaction_type,
      description: row.description,
      balance_after: row.balance_after,
      created_at: row.created_at,
      order_id: row.order_id,
    }));
  } catch (error) {
    console.error('Error in fetchCreditTransactions:', error);
    return [];
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