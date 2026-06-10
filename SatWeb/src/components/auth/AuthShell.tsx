import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const POSTA_LOGO = "/logo-3.png";
const POSTA_COVER = "/cover-posta.jpg";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Khung 2 cột cho các trang xác thực: bên trái là banner thương hiệu POSTA,
 * bên phải là form. Trên mobile chỉ hiện cột form (kèm logo nhỏ).
 */
const AuthShell = ({ title, subtitle, children }: AuthShellProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Cột thương hiệu */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={POSTA_COVER}
          alt="POSTA — Post Automatically, Sell Efficiently"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
        <button
          onClick={() => navigate("/")}
          className="absolute left-6 top-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" />
          {t("auth.backToHome")}
        </button>
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-2xl font-extrabold text-white">
            {t("auth.bannerTitle")}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {t("auth.bannerSubtitle")}
          </p>
        </div>
      </div>

      {/* Cột form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <button
              onClick={() => navigate("/")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t("auth.postaHome")}
            >
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-primary/20">
                <img src={POSTA_LOGO} alt={t("auth.logoAlt")} className="size-8 object-contain" />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-foreground">POSTA</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

/** Logo Google chính chủ (SVG đa màu). */
export const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
    />
  </svg>
);

/** Nút "Tiếp tục với Google" — viền phẳng, dùng cho login & register. */
export const GoogleButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className="w-full cursor-pointer gap-2.5"
  >
    <GoogleIcon className="size-5" />
    {label}
  </Button>
);

export default AuthShell;
