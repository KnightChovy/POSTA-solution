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
  ShieldCheck,
  CreditCard,
  Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const lang = i18n.language?.startsWith("en") ? "en" : "vi";
  const changeLang = (value: string) => i18n.changeLanguage(value);

  const initials =
    (user as any)?.name
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: t("nav.dashboard"),
      path: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      action: () => navigate("/dashboard"),
    },
    {
      name: t("nav.addSatellite"),
      path: "/create-site",
      icon: <SquarePlus className="h-4 w-4" />,
      action: () => navigate("/create-site"),
    },
    {
      name: t("nav.manageWebsites"),
      path: "/viewSat",
      icon: <FolderKanban className="h-4 w-4" />,
      action: () => navigate("/viewSat"),
    },
    {
      name: t("nav.servicePlans"),
      path: "/pricing",
      icon: <CreditCard className="h-4 w-4" />,
      action: () => navigate("/pricing"),
    },
    {
      name: t("nav.guide"),
      path: "/help/app-password",
      icon: <FolderPen className="h-4 w-4" />,
      action: () => navigate("/help/app-password"),
    },
  ];

  if ((user as any)?.isAdmin) {
    navItems.push({
      name: t("nav.admin"),
      path: "/admin",
      icon: <ShieldCheck className="h-4 w-4" />,
      action: () => navigate("/admin"),
    });
  }

  return (
    <header className="hidden sm:block sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-6 md:px-8 max-w-[1600px] mx-auto">
        {/* Logo POSTA — bấm để về trang chủ */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label={t("nav.backToHome")}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-white shadow-lg shadow-orange-500/25 ring-1 ring-orange-200/60">
            <img
              src="/logo-3.png"
              alt="Logo POSTA"
              className="w-7 h-7 object-contain"
            />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            POSTA
          </span>
        </button>

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
          {/* Language Switcher */}
          <div className="relative flex items-center">
            <Globe className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
            <select
              aria-label={t("common.language")}
              value={lang}
              onChange={(e) => changeLang(e.target.value)}
              className="h-9 cursor-pointer appearance-none rounded-md border border-border bg-card pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

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
              className="flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              {t("nav.login")}
            </Button>
          ) : (
            <>
              {/* Hồ sơ cá nhân */}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t("nav.profile")}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                  {initials}
                </span>
                <span className="hidden lg:block max-w-[120px] truncate text-sm font-medium text-foreground">
                  {(user as any)?.name || t("nav.account")}
                </span>
              </button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
