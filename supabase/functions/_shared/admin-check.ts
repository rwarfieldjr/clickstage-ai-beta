import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

/**
 * Check if a user has admin role
 * @param userId - The user ID to check
 * @param supabaseAdmin - Supabase client with service role key
 * @returns true if user is admin, false otherwise
 */
export const isAdmin = async (
  userId: string,
  supabaseAdmin: SupabaseClient
): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
};
