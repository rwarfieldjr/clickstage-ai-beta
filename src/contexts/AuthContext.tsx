import React, { createContext, useContext, useEffect, useState } from "react";
import { loginWithEmailPassword, logout as apiLogout, getCurrentUser, AuthUser } from "@/services/api/auth";
import { ApiResult } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<ApiResult<AuthUser>>;
  logout: () => Promise<ApiResult<null>>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ ok: false, error: "Not initialized" }),
  logout: async () => ({ ok: false, error: "Not initialized" }),
  refresh: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: undefined,
  });

  const refresh = async () => {
    const result = await getCurrentUser();
    if (result.ok) {
      setState({ user: result.data, loading: false, error: undefined });
    } else {
      setState({ user: null, loading: false, error: result.error });
    }
  };

  const login = async (email: string, password: string): Promise<ApiResult<AuthUser>> => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    const result = await loginWithEmailPassword(email, password);

    if (!result.ok) {
      setState({ user: null, loading: false, error: result.error });
      return { ok: false, error: result.error };
    }

    setState({ user: result.data, loading: false, error: undefined });
    return { ok: true, data: result.data };
  };

  const logout = async (): Promise<ApiResult<null>> => {
    setState((s) => ({ ...s, loading: true }));
    const result = await apiLogout();

    if (!result.ok) {
      setState((s) => ({ ...s, loading: false, error: result.error }));
      return { ok: false, error: result.error };
    }

    setState({ user: null, loading: false, error: undefined });
    return { ok: true, data: null };
  };

  useEffect(() => {
    let alive = true;

    getCurrentUser().then((result) => {
      if (!alive) return;
      if (result.ok) {
        setState({ user: result.data, loading: false, error: undefined });
      } else {
        setState({ user: null, loading: false, error: undefined });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;

      if (session?.user) {
        refresh();
      } else {
        setState({ user: null, loading: false, error: undefined });
      }
    });

    return () => {
      alive = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (state.loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Loading account…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
