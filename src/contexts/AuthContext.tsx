import React, { createContext, useContext, useEffect, useState } from "react";
import { loginWithEmailPassword, signUpWithEmailPassword, logout as apiLogout, getCurrentUser, AuthUser } from "@/services/api/auth";
import { ApiResult } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  error?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<ApiResult<AuthUser>>;
  signup: (email: string, password: string, name: string) => Promise<ApiResult<AuthUser>>;
  logout: () => Promise<ApiResult<null>>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  error: undefined,
  login: async () => ({ ok: false, error: "Auth not initialized" }),
  signup: async () => ({ ok: false, error: "Auth not initialized" }),
  logout: async () => ({ ok: false, error: "Auth not initialized" }),
  refresh: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    error: undefined,
  });

  const refresh = async () => {
    const result = await getCurrentUser();
    if (!result.ok || !result.data) {
      return;
    }
    setState({
      user: result.data,
      loading: false,
      isAdmin: result.data?.isAdmin || false,
      error: undefined
    });
  };

  const signup = async (email: string, password: string, name: string): Promise<ApiResult<AuthUser>> => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    const result = await signUpWithEmailPassword(email, password, name);

    if (!result.ok) {
      setState({ user: null, loading: false, isAdmin: false, error: result.error });
      return { ok: false, error: result.error };
    }

    setState({
      user: result.data,
      loading: false,
      isAdmin: result.data?.isAdmin || false,
      error: undefined
    });
    return { ok: true, data: result.data };
  };

  const login = async (email: string, password: string): Promise<ApiResult<AuthUser>> => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    const result = await loginWithEmailPassword(email, password);

    if (!result.ok) {
      setState({ user: null, loading: false, isAdmin: false, error: result.error });
      return { ok: false, error: result.error };
    }

    setState({
      user: result.data,
      loading: false,
      isAdmin: result.data?.isAdmin || false,
      error: undefined
    });
    return { ok: true, data: result.data };
  };

  const logout = async (): Promise<ApiResult<null>> => {
    setState((s) => ({ ...s, loading: true }));
    const result = await apiLogout();

    if (!result.ok) {
      setState((s) => ({ ...s, loading: false, error: result.error }));
      return { ok: false, error: result.error };
    }

    setState({ user: null, loading: false, isAdmin: false, error: undefined });
    return { ok: true, data: null };
  };

  useEffect(() => {
    let alive = true;

    getCurrentUser().then((result) => {
      if (!alive) return;
      if (result.ok) {
        setState({
          user: result.data,
          loading: false,
          isAdmin: result.data?.isAdmin || false,
          error: undefined
        });
      } else {
        setState({ user: null, loading: false, isAdmin: false, error: undefined });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;

      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => {
          refresh();
        }, 150);
      } else if (event === "SIGNED_OUT") {
        setState({ user: null, loading: false, isAdmin: false, error: undefined });
      }
    });

    return () => {
      alive = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refresh }}>
      {state.loading ? (
        <div style={{ padding: 40, textAlign: "center", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
