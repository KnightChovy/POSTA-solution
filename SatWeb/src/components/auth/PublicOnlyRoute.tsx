import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

/**
 * Chỉ cho khách CHƯA đăng nhập vào (login/register/forgot-password).
 * Đã đăng nhập rồi thì chuyển thẳng về bảng điều khiển.
 */
export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
