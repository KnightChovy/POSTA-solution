import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginService,
  registerService,
  logoutService,
  googleLoginService,
} from "../service/authService";
import { tokenStore } from "../lib/axiosConfig";
import { AuthState } from "../../index";
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface response {
  error: boolean;
  message?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await loginService(username, password);
          if (response.error) {
            set({ isLoading: false });
          } else {
            // Lưu cặp token để interceptor dùng cho các request sau.
            tokenStore.set(response.accessToken, response.refreshToken);
            set({
              isAuthenticated: true,
              user: response.user ?? null,
              isLoading: false,
            });
          }
          return response;
        } catch (error) {
          set({ isLoading: false });
        }
      },

      loginWithGoogle: async (credential: string) => {
        set({ isLoading: true });
        try {
          const response = await googleLoginService(credential);
          if (!response.error) {
            tokenStore.set(response.accessToken, response.refreshToken);
            set({ isAuthenticated: true, user: response.user ?? null });
          }
          return response;
        } catch (error) {
          return { error: true, message: "Đăng nhập Google thất bại!" };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await registerService(name, email, password);
          return response;
        } catch (error) {
          return { error: true, message: "Đăng ký thất bại!" };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        // Báo backend xoá refresh token (best-effort), rồi dọn token cục bộ.
        try {
          const refresh = tokenStore.refresh;
          if (refresh) await logoutService(refresh);
        } catch (error) {
          // bỏ qua lỗi mạng khi đăng xuất
        }
        tokenStore.clear();
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
