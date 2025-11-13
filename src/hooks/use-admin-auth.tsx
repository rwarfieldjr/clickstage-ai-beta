import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setState({ user: null, isAdmin: false, isLoading: false });
        navigate('/admin/login');
      } else if (session?.user) {
        await checkAdminStatus();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState({ user: null, isAdmin: false, isLoading: false });
        return;
      }

      // Check if user is admin using user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error checking admin role:', roleError);
        setState({ user, isAdmin: false, isLoading: false });
        return;
      }

      const isAdmin = roleData?.role === 'admin';

      setState({
        user,
        isAdmin,
        isLoading: false,
      });

      return isAdmin;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setState({ user: null, isAdmin: false, isLoading: false });
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return {
    ...state,
    signOut,
    checkAdminStatus,
  };
}

export function useRequireAdmin() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, isLoading, navigate]);

  return { user, isAdmin, isLoading };
}