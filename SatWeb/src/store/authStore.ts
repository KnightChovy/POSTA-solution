import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginService } from "../service/authService";
import { toast } from "react-toastify";
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
            set({
              isAuthenticated: true,
              isLoading: false,
            });
          }
          return response;
        } catch (error) {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
        // Clear any additional storage
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
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
      }),
    }
  )
);
