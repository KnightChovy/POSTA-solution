import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        toast.error(response.message || "Đăng nhập thất bại!");
      } else {
        toast.success("Đăng nhập thành công!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
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
        toast.error(res.message || "Gửi lại thất bại.");
      } else {
        toast.success(
          res.message || "Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư."
        );
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title="Chào mừng trở lại" subtitle="Đăng nhập để quản lý hệ thống POSTA của bạn">
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

      {needVerifyEmail && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/15">
          <div className="flex items-start gap-2.5">
            <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Tài khoản <strong>{needVerifyEmail}</strong> chưa được xác thực. Hãy kiểm tra hộp
              thư, hoặc gửi lại email xác thực bên dưới.
            </p>
          </div>
          <Button
            onClick={handleResend}
            disabled={resending}
            variant="outline"
            className="w-full cursor-pointer gap-2 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
          >
            {resending && <Loader2 className="size-4 animate-spin" />}
            Gửi lại email xác thực
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
