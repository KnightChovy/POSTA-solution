import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  SquarePlus,
  FolderKanban,
  LogOut,
  LogIn,
  FolderPen,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Trang chủ",
      path: "/",
      icon: <LayoutDashboard className="h-4 w-4" />,
      action: () => navigate("/"),
    },
    {
      name: "Thêm website vệ tinh",
      path: "/create-site",
      icon: <SquarePlus className="h-4 w-4" />,
      action: () => navigate("/create-site"),
    },
    {
      name: "Quản lý website",
      path: "/viewSat",
      icon: <FolderKanban className="h-4 w-4" />,
      action: () => navigate("/viewSat"),
    },
    {
      name: "Hướng dẫn",
      path: "/help/app-password",
      icon: <FolderPen className="h-4 w-4" />,
      action: () => navigate("/help/app-password"),
    },
  ];

  return (
    <header className="hidden sm:block sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-6 md:px-8 max-w-[1600px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-amber-500/25">
            <img
              src="/src/access/z7589296664177_1e231dbdceef2feb2f6f02a5de781cfa.jpg"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
            Auto Post
          </span>
        </div>

        {/* Nav Items */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={item.action}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className={cn(isActive && "text-primary")}>
                  {item.icon}
                </span>
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle & Auth Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {!isAuthenticated ? (
            <Button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/25 transition-all duration-200"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-border text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
