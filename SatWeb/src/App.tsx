import { Suspense, useEffect } from "react";
import {
  useRoutes,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Home from "./components/home";
import Landing from "./pages/landing";
import ProgressPage from "./pages/progress";
import CreatePost from "./pages/create-post";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import ForgotPasswordPage from "./pages/forgot-password";
import VerifyEmailPage from "./pages/verify-email";
import ResetPasswordPage from "./pages/reset-password";
import ProfilePage from "./pages/profile";
import AdminDashboard from "./pages/admin/dashboard";
import AdminUsers from "./pages/admin/users";
import { ToastContainer } from "react-toastify";
import Navigation from "./components/Navigation";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { useAuthStore } from "./store/authStore";
import CreateSite from "./pages/create-site";
import ViewSat from "./pages/viewSat";
import Sidebar from "./components/sidebar";
import GetAppPasswordPage from "./pages/GetAppPasswordPage";
function App() {
  // Initialize authentication
  const { isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Refresh token thất bại (hết hạn / không hợp lệ) → tự đăng xuất, về trang đăng nhập.
  useEffect(() => {
    const onForcedLogout = () => {
      useAuthStore.getState().logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, [navigate]);
  // Landing và các trang xác thực có giao diện riêng → ẩn thanh điều hướng quản trị
  const noNavRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email",
    "/reset-password",
  ];
  const showNav = !noNavRoutes.includes(location.pathname);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      {showNav && (
        <>
          <Navigation /> {/* Sidebar cho desktop */}
          <Sidebar /> {/* Sidebar cho mobile */}
        </>
      )}

      <Routes>
        {/* Trang xác thực — đã đăng nhập thì chặn, đẩy về /dashboard */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Landing page công khai — không cần đăng nhập */}
        <Route path="/" element={<Landing />} />
        {/* Khu vực quản trị — chỉ admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        {/* Bảng điều khiển quản trị — cần đăng nhập */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-site"
          element={
            <ProtectedRoute>
              <CreateSite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewSat"
          element={
            <ProtectedRoute>
              <ViewSat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/viewSat/:id"
          element={
            <ProtectedRoute>
              <CreateSite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/app-password"
          element={
            <ProtectedRoute>
              <GetAppPasswordPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer />
    </Suspense>
  );
}

export default App;
