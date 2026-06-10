import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Loader2, MailWarning } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { resendVerificationService } from "@/service/authService";

interface LoginCredentials {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  // Email cần xác thực (khi login trả needVerify) → mở khối gửi lại email.
  const [needVerifyEmail, setNeedVerifyEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);

  // Đã đăng nhập thì chuyển vào bảng điều khiển
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setNeedVerifyEmail(null);
    try {
      const response = await login(credentials.username, credentials.password);

      if (response?.error) {
        // Tài khoản chưa xác thực email → mở khối "gửi lại email xác thực".
        if ((response as any).needVerify) {
          setNeedVerifyEmail(credentials.username);
        }
        toast.error(response.message || t("auth.loginFailed"));
      } else {
        toast.success(t("auth.loginSuccess"));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(t("auth.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!needVerifyEmail) return;
    setResending(true);
    try {
      const res = await resendVerificationService(needVerifyEmail);
      if (res?.error) {
        toast.error(res.message || t("auth.resendFailed"));
      } else {
        toast.success(
          res.message || t("auth.resendSuccess")
        );
      }
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

      {needVerifyEmail && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/15">
          <div className="flex items-start gap-2.5">
            <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("auth.needVerifyPrefix")} <strong>{needVerifyEmail}</strong>{" "}
              {t("auth.needVerifySuffix")}
            </p>
          </div>
          <Button
            onClick={handleResend}
            disabled={resending}
            variant="outline"
            className="w-full cursor-pointer gap-2 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
          >
            {resending && <Loader2 className="size-4 animate-spin" />}
            {t("auth.resendVerification")}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
