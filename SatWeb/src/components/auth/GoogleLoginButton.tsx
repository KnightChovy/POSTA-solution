import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/authStore";
import { GoogleButton } from "./AuthShell";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Tải script Google Identity Services một lần.
function loadGsi(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve((window as any).google);
    const existing = document.getElementById("gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).google));
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve((window as any).google);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

interface Props {
  label: string; // dùng cho nút mô phỏng khi chưa cấu hình
}

export default function GoogleLoginButton({ label }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;
    let cancelled = false;

    loadGsi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (resp: any) => {
            const res = await loginWithGoogle(resp.credential);
            if (res?.error) {
              toast.error(res.message || t("auth.googleLoginFailed"));
            } else {
              toast.success(t("auth.loginSuccess"));
              navigate("/dashboard");
            }
          },
        });
        google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: containerRef.current.offsetWidth || 360,
          text: "continue_with",
          locale: "vi",
        });
      })
      .catch(() => {
        /* lỗi tải script — bỏ qua, người dùng vẫn đăng nhập thường được */
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, navigate, t]);

  // Chưa cấu hình Client ID → nút mô phỏng (giữ giao diện).
  if (!CLIENT_ID) {
    return (
      <GoogleButton
        label={label}
        onClick={() => toast.info(t("auth.googleNotConfigured"))}
      />
    );
  }

  return <div ref={containerRef} className="flex w-full justify-center" />;
}
