import { NavLink, useNavigate } from "react-router-dom";
import { Home, User, Package, CreditCard, LogOut, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Sidebar() {
  const link = "flex items-center gap-3 py-3 px-4 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors";
  const active = "bg-blue-100 text-blue-700";
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const result = await logout();
    if (result.ok) {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } else {
      toast({
        title: "Logout failed",
        description: result.error || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg rounded-2xl p-6 h-fit">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">My Account</h2>

      <nav className="space-y-2">
        <NavLink
          to="/account"
          end
          className={({ isActive }) => (isActive ? `${link} ${active}` : link)}
        >
          <Home className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/account/profile"
          className={({ isActive }) => (isActive ? `${link} ${active}` : link)}
        >
          <User className="w-5 h-5" />
          Profile
        </NavLink>

        <NavLink
          to="/account/orders"
          className={({ isActive }) => (isActive ? `${link} ${active}` : link)}
        >
          <Package className="w-5 h-5" />
          Orders
        </NavLink>

        <NavLink
          to="/account/credits"
          className={({ isActive }) => (isActive ? `${link} ${active}` : link)}
        >
          <CreditCard className="w-5 h-5" />
          Credits
        </NavLink>

        <NavLink
          to="/account/images"
          className={({ isActive }) => (isActive ? `${link} ${active}` : link)}
        >
          <Image className="w-5 h-5" />
          Image Portal
        </NavLink>
      </nav>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center gap-3 justify-start text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
