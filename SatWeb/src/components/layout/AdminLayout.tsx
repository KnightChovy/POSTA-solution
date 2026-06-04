import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Package,
  LogOut,
  Home,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Người dùng", icon: Users, end: false },
  { to: "/admin/revenue", label: "Doanh thu", icon: Wallet, end: false },
  { to: "/admin/plans", label: "Gói dịch vụ", icon: Package, end: false },
];

// Layout riêng cho khu quản trị: sidebar trái, không dùng thanh điều hướng của user.
const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarBody = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <button
        onClick={() => navigate("/admin")}
        className="flex items-center gap-2 px-5 py-5 cursor-pointer"
        aria-label="POSTA Admin"
      >
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-primary/20">
          <img src="/logo-3.png" alt="Logo POSTA" className="size-7 object-contain" />
        </span>
        <div className="text-left">
          <p className="text-lg font-extrabold leading-none text-foreground">POSTA</p>
          <p className="text-xs text-muted-foreground">Quản trị</p>
        </div>
      </button>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-border px-3 py-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          {theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          <Home className="size-4" />
          Về trang chủ
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
        <div className="mt-2 flex items-center gap-2 border-t border-border px-2 pt-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
            {((user as any)?.name || "A").trim().charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            {(user as any)?.name || "Quản trị viên"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <div className="sticky top-0 h-screen">
          <SidebarBody />
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="size-5" />
            </button>
            <SidebarBody />
          </aside>
        </div>
      )}

      {/* Nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar mobile */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-foreground hover:bg-secondary cursor-pointer"
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-extrabold text-foreground">POSTA Quản trị</span>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
