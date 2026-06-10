import { useAuthStore } from "@/store/authStore";
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.warning(t("auth.loginRequired"));
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, t]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("auth.checkingAuth")}</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, không hiển thị gì (sẽ redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Nếu đã đăng nhập, hiển thị component con
  return <>{children}</>;
}
