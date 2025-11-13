import { useState } from "react";
import { useNavigate } from "react-router-dom";

const routes = [
  { label: "Home", path: "/" },
  { label: "Upload", path: "/upload" },
  { label: "Pricing", path: "/pricing" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Styles", path: "/styles" },
  { label: "FAQ", path: "/faq" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Blog", path: "/blog" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Account Settings", path: "/account" },
  { label: "Purchase Credits", path: "/purchase-credits" },
  { label: "Auth", path: "/auth" },
  { label: "---", path: "" },
  { label: "Admin Login", path: "/admin" },
  { label: "Admin Dashboard", path: "/admin/dashboard" },
  { label: "Admin Users", path: "/admin/users" },
  { label: "Admin Orders", path: "/admin/orders" },
  { label: "Admin Images", path: "/admin/images" },
  { label: "Admin Settings", path: "/admin/settings" },
  { label: "Admin Tests", path: "/admin/tests" },
  { label: "---", path: "" },
  { label: "Bucket Test", path: "/bucket-test" },
  { label: "Diagnostics", path: "/diagnostics" },
  { label: "Stability Test", path: "/stability-test" },
];

export default function DevNavigator() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Only show in dev mode
  if (import.meta.env.PROD) {
    return null;
  }

  const handleNavigate = (path: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999999,
          background: "#1e3a8a",
          color: "white",
          padding: "12px 16px",
          borderRadius: "50%",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          fontSize: "20px",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.background = "#1e40af";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.background = "#1e3a8a";
        }}
        title="Dev Navigator"
      >
        🔧
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999997,
          }}
        />
      )}

      {/* Slide-in panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "320px",
            maxWidth: "100vw",
            height: "100vh",
            background: "#111827",
            padding: "20px",
            color: "white",
            zIndex: 999998,
            boxShadow: "-4px 0 12px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            overflowY: "auto",
            animation: "slideIn 0.3s ease",
          }}
        >
          <style>
            {`
              @keyframes slideIn {
                from {
                  transform: translateX(100%);
                }
                to {
                  transform: translateX(0);
                }
              }
            `}
          </style>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            paddingBottom: "10px",
            borderBottom: "1px solid #374151"
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
              🔧 Dev Navigator
            </h2>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              DEV MODE
            </span>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "10px",
            flex: 1,
            overflowY: "auto",
          }}>
            {routes.map((r, idx) => {
              if (r.label === "---") {
                return (
                  <div
                    key={idx}
                    style={{
                      height: "1px",
                      background: "#374151",
                      margin: "8px 0",
                    }}
                  />
                );
              }

              return (
                <button
                  key={r.path}
                  onClick={() => handleNavigate(r.path)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#1f2937",
                    border: "1px solid #374151",
                    color: "white",
                    borderRadius: "6px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#374151";
                    e.currentTarget.style.borderColor = "#4b5563";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#1f2937";
                    e.currentTarget.style.borderColor = "#374151";
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div style={{
            display: "flex",
            gap: "8px",
            paddingTop: "10px",
            borderTop: "1px solid #374151",
          }}>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                alert("Storage cleared! Refresh the page.");
              }}
              style={{
                flex: 1,
                padding: "10px",
                background: "#7c2d12",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
                fontSize: "13px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#9a3412";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#7c2d12";
              }}
              title="Clear localStorage and sessionStorage"
            >
              Clear Storage
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                padding: "10px",
                background: "#b91c1c",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
                fontSize: "13px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#b91c1c";
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}