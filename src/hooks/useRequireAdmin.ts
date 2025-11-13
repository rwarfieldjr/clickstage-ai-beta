import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const useRequireAdmin = () => {
  const auth = useAuth();
  const { user, loading, isAdmin } = auth;
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  return {
    user: user || null,
    isAdmin: isAdmin || false,
    isLoading: loading || false,
  };
};
