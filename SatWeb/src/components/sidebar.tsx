import React, { useState } from "react";
import {
  Menu,
  X,
  Home,
  PlusSquare,
  List,
  Settings,
  Globe,
  HelpCircle,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useThemeStore } from "@/store/themeStore";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  const navItems = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/create-post", label: "Đăng bài", icon: PlusSquare },
    { to: "/progress", label: "Tiến trình", icon: List },
    { to: "/create-site", label: "Tạo website mới", icon: Globe },
    { to: "/viewSat", label: "Xem website", icon: Settings },
    { to: "/help/app-password", label: "Hướng dẫn", icon: HelpCircle },
  ];

  return (
    <>
      {/* Header nhỏ có nút menu (mobile) */}
      <div className="md:hidden sticky top-0 left-0 w-full z-40 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-amber-500/25">
            <img
              src="/src/access/z7589296664177_1e231dbdceef2feb2f6f02a5de781cfa.jpg"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
            Auto Post
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar trượt (mobile) */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-card shadow-2xl transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-out z-40 md:hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/30">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-amber-500/25">
              <img
                src="/src/access/z7589296664177_1e231dbdceef2feb2f6f02a5de781cfa.jpg"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
              Auto Post
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "text-primary" : "text-muted-foreground"}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-secondary/50">
          <p className="text-xs text-center text-muted-foreground">
            © 2024 Auto Post System
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
