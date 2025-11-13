/**
 * Authentication API Service
 *
 * Handles all authentication-related operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: any;
  session?: any;
  isAdmin?: boolean;
  error?: string;
}

export interface SessionInfo {
  user: any;
  session: any;
  isAdmin: boolean;
}

/**
 * Login user with email and password
 * POST /api/login
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Login failed',
      };
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === 'admin';

    return {
      success: true,
      user: data.user,
      session: data.session,
      isAdmin,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Logout current user
 * POST /api/logout
 */
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current session information
 * GET /api/admin/session
 */
export async function getSession(): Promise<SessionInfo | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    return {
      user: session.user,
      session: session,
      isAdmin: roleData?.role === 'admin',
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Verify admin role
 */
export async function verifyAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return roleData?.role === 'admin';
  } catch (error) {
    console.error('Error verifying admin:', error);
    return false;
  }
}