import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type RequireAdminProps = {
  children: React.ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  const auth = useAuth() || { user: null, isAdmin: false, loading: false };
  const { user, isAdmin, loading } = auth;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
