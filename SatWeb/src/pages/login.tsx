import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LoginForm } from "@/components/auth/LoginForm";
import AuthShell from "@/components/auth/AuthShell";
import { useAuthStore } from "@/store/authStore";

interface LoginCredentials {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      const response = await login(credentials.username, credentials.password);

      if (response?.error) {
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

  return (
    <AuthShell title="Chào mừng trở lại" subtitle="Đăng nhập để quản lý hệ thống POSTA của bạn">
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </AuthShell>
  );
}
