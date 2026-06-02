import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface AdminRouteProps {
  children: ReactNode;
}

/** Chỉ cho quản trị viên vào. Chưa đăng nhập → /login; không phải admin → /dashboard. */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!(user as any)?.isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
