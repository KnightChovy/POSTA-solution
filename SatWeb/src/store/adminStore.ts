import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  isActive: boolean;
  isVerified: boolean;
  plan: "none" | "basic" | "pro" | "enterprise";
  provider: string;
  lastLogin: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  totalPosts: number;
  activeSatellites: number;
  usersByPlan: Record<string, number>;
  planLabels: Record<string, string>;
  mrr: number;
  totalRevenue: number;
  revenueByMonth: { month: string; total: number }[];
  recentTransactions: {
    user: { name: string; email: string } | null;
    plan: string;
    amount: number;
    createdAt: string;
  }[];
}

interface AdminStore {
  stats: AdminStats | null;
  users: AdminUser[];
  loading: boolean;
  getStats: () => Promise<void>;
  getUsers: (search?: string) => Promise<void>;
  createUser: (data: any) => Promise<boolean>;
  updateUser: (id: string, data: any) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
}

const useAdminStore = create<AdminStore>((set, get) => ({
  stats: null,
  users: [],
  loading: false,

  getStats: async () => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/admin/stats`);
      if (!res.data.error) set({ stats: res.data.stats });
    } catch (error: any) {
      console.error("Get stats error:", error?.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  getUsers: async (search = "") => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/admin/users`, { params: { search } });
      if (!res.data.error) set({ users: res.data.users });
    } catch (error: any) {
      console.error("Get users error:", error?.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (data) => {
    try {
      const res = await axios.post(`/api/admin/users`, data);
      if (res.data.error) {
        toast.error(res.data.message || "Tạo tài khoản thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã cấp tài khoản");
      await get().getUsers();
      return true;
    } catch {
      toast.error("Tạo tài khoản thất bại");
      return false;
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await axios.patch(`/api/admin/users/${id}`, data);
      if (res.data.error) {
        toast.error(res.data.message || "Cập nhật thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã cập nhật");
      set((s) => ({
        users: s.users.map((u) => (u.id === id ? res.data.user : u)),
      }));
      return true;
    } catch {
      toast.error("Cập nhật thất bại");
      return false;
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await axios.delete(`/api/admin/users/${id}`);
      if (res.data.error) {
        toast.error(res.data.message || "Xoá thất bại");
        return false;
      }
      toast.success("Đã xoá người dùng");
      set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      return true;
    } catch {
      toast.error("Xoá thất bại");
      return false;
    }
  },
}));

export default useAdminStore;
