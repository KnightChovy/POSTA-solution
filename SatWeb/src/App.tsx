import { Suspense, useEffect } from "react";
import {
  useRoutes,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Home from "./components/home";
import ProgressPage from "./pages/progress";
import CreatePost from "./pages/create-post";
import LoginPage from "./pages/login";
import { ToastContainer } from "react-toastify";
import Navigation from "./components/Navigation";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import CreateSite from "./pages/create-site";
import ViewSat from "./pages/viewSat";
import Sidebar from "./components/sidebar";
import GetAppPasswordPage from "./pages/GetAppPasswordPage";
function App() {
  // Initialize authentication
  const { isAuthenticated, isLoading } = useAuthStore();
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
      {isAuthenticated && (
        <>
          <Navigation /> {/* Sidebar cho desktop */}
          <Sidebar /> {/* Sidebar cho mobile */}
        </>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
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
