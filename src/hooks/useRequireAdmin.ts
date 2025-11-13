import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const useRequireAdmin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/admin/login");
      return;
    }

    if (user.email !== "rob@warfieldandco.com") {
      navigate("/");
    }
  }, [user, loading, navigate]);
};
