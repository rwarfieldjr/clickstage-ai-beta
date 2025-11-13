/**
 * Authentication API Service
 *
 * Handles all authentication-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import { safeApiCall, ApiResult } from './index';

export type AuthUser = {
  id: string;
  email: string | null;
  isAdmin?: boolean;
};

export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<ApiResult<AuthUser>> {
  return safeApiCall<AuthUser>(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      throw error || new Error("Invalid email or password");
    }

    let isAdmin = false;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!rolesError && roles?.role === "admin") {
      isAdmin = true;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      isAdmin,
    };
  });
}

export async function logout(): Promise<ApiResult<null>> {
  return safeApiCall<null>(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return null;
  });
}

export async function getCurrentUser(): Promise<ApiResult<AuthUser | null>> {
  return safeApiCall<AuthUser | null>(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (!data?.user) return null;

    let isAdmin = false;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!rolesError && roles?.role === "admin") {
      isAdmin = true;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      isAdmin,
    };
  });
}

export async function verifyAdmin(): Promise<ApiResult<boolean>> {
  return safeApiCall<boolean>(async () => {
    const result = await getCurrentUser();

    if (!result.ok || !result.data) {
      return false;
    }

    return result.data.isAdmin === true;
  });
}
