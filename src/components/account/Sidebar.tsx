import { NavLink } from "react-router-dom";
import { Home, User, Package, CreditCard } from "lucide-react";

export default function Sidebar() {
  const link = "flex items-center gap-3 py-3 px-4 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors";
  const active = "bg-blue-100 text-blue-700";

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
      </nav>
    </div>
  );
}
