import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore } from "@/store/authStore";

interface LoginCredentials {
  username: string;
  password: string;
}
interface response {
  error: boolean;
  message?: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with your actual authentication logic
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await login(credentials.username, credentials.password);

      if (response.error) {
        toast.error(response.message || "Đăng nhập thất bại!");
      } else {
        toast.success(`Đăng nhập thành công!`);
        navigate("/"); // Redirect to home page after login
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-100 dark:bg-yellow-900/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img src="/posta.jpg" alt="Posta Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập để quản lý hệ thống Auto Post của bạn
          </p>
        </div>

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  );
}
