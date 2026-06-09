import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";
import { Plan, PlanLimits } from "./planStore";

axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  isActive: boolean;
  isVerified: boolean;
  plan: string; // key của gói động (vd freemium/starter/...)
  provider: string;
  lastLogin: string | null;
  createdAt: string;
}

// Gói kèm cờ khóa + số lượt mua (chỉ dùng ở khu admin).
export interface AdminPlan extends Plan {
  isLocked: boolean;
  purchaseCount: number;
}

export interface PlanInput {
  name: string;
  description: string;
  price: number;
  limits: PlanLimits;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface AdminTransaction {
  id: string;
  user?: { name: string; email: string } | null;
  plan: string;
  planName: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  provider: string;
  reference: string;
  note?: string;
  createdAt: string;
  paidAt: string | null;
}

export interface UserDetail {
  user: AdminUser & {
    company?: string;
    jobTitle?: string;
    website?: string;
    address?: string;
    avatar?: string;
  };
  plan: { key: string; name: string; price: number; limits: Partial<PlanLimits> };
  usage: { websites: { used: number; limit: number }; ai: { used: number; limit: number }; posts: { used: number; limit: number } };
  postCount: number;
  websiteCount: number;
  purchasedPlans: string[];
  transactions: AdminTransaction[];
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
  adminPlans: AdminPlan[];
  transactions: AdminTransaction[];
  userDetail: UserDetail | null;
  loading: boolean;
  getStats: () => Promise<void>;
  getTransactions: (status?: string, search?: string) => Promise<void>;
  getUsers: (search?: string) => Promise<void>;
  createUser: (data: any) => Promise<boolean>;
  updateUser: (id: string, data: any) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getUserDetail: (id: string) => Promise<void>;
  changeUserPlan: (id: string, data: { plan: string; method: "paid" | "gift"; note: string }) => Promise<boolean>;
  confirmTransaction: (id: string) => Promise<boolean>;
  cancelTransaction: (id: string) => Promise<boolean>;
  getAdminPlans: () => Promise<void>;
  createPlan: (data: PlanInput) => Promise<boolean>;
  updatePlan: (id: string, data: Partial<PlanInput>) => Promise<boolean>;
  clonePlan: (id: string) => Promise<boolean>;
  setPlanVisibility: (id: string, data: { isPublished?: boolean; isArchived?: boolean }) => Promise<boolean>;
}

const useAdminStore = create<AdminStore>((set, get) => ({
  stats: null,
  users: [],
  adminPlans: [],
  transactions: [],
  userDetail: null,
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

  getTransactions: async (status = "", search = "") => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/admin/transactions`, { params: { status, search } });
      if (!res.data.error) set({ transactions: res.data.transactions ?? [] });
    } catch (error: any) {
      console.error("Get transactions error:", error?.response?.data || error.message);
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

  // "Xoá" = tạm khoá tài khoản (soft-lock), không xoá hẳn dữ liệu.
  deleteUser: async (id) => {
    try {
      const res = await axios.delete(`/api/admin/users/${id}`);
      if (res.data.error) {
        toast.error(res.data.message || "Tạm khoá thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã tạm khoá tài khoản");
      set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, isActive: false } : u)) }));
      return true;
    } catch {
      toast.error("Tạm khoá thất bại");
      return false;
    }
  },

  // ----- Chi tiết user + quy trình đổi gói -----
  getUserDetail: async (id) => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/admin/users/${id}`);
      if (!res.data.error) set({ userDetail: res.data.detail });
    } catch (error: any) {
      console.error("Get user detail error:", error?.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  changeUserPlan: async (id, data) => {
    try {
      const res = await axios.post(`/api/admin/users/${id}/plan`, data);
      if (res.data.error) {
        toast.error(res.data.message || "Đổi gói thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã đổi gói");
      await get().getUserDetail(id);
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Đổi gói thất bại");
      return false;
    }
  },

  confirmTransaction: async (id) => {
    try {
      const res = await axios.post(`/api/admin/transactions/${id}/confirm`);
      if (res.data.error) {
        toast.error(res.data.message || "Xác nhận thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã xác nhận");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xác nhận thất bại");
      return false;
    }
  },

  cancelTransaction: async (id) => {
    try {
      const res = await axios.post(`/api/admin/transactions/${id}/cancel`);
      if (res.data.error) {
        toast.error(res.data.message || "Huỷ thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã huỷ giao dịch");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Huỷ thất bại");
      return false;
    }
  },

  // ----- Quản lý gói dịch vụ -----
  getAdminPlans: async () => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/admin/plans`);
      if (!res.data.error) set({ adminPlans: res.data.plans ?? [] });
    } catch (error: any) {
      console.error("Get admin plans error:", error?.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  createPlan: async (data) => {
    try {
      const res = await axios.post(`/api/admin/plans`, data);
      if (res.data.error) {
        toast.error(res.data.message || "Tạo gói thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã tạo gói");
      await get().getAdminPlans();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Tạo gói thất bại");
      return false;
    }
  },

  updatePlan: async (id, data) => {
    try {
      const res = await axios.patch(`/api/admin/plans/${id}`, data);
      if (res.data.error) {
        toast.error(res.data.message || "Cập nhật gói thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã cập nhật gói");
      await get().getAdminPlans();
      return true;
    } catch (error: any) {
      // 409 = gói đã bán, chỉ được clone
      toast.error(error?.response?.data?.message || "Cập nhật gói thất bại");
      return false;
    }
  },

  clonePlan: async (id) => {
    try {
      const res = await axios.post(`/api/admin/plans/${id}/clone`);
      if (res.data.error) {
        toast.error(res.data.message || "Clone gói thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã clone gói");
      await get().getAdminPlans();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Clone gói thất bại");
      return false;
    }
  },

  setPlanVisibility: async (id, data) => {
    try {
      const res = await axios.patch(`/api/admin/plans/${id}/visibility`, data);
      if (res.data.error) {
        toast.error(res.data.message || "Cập nhật trạng thái thất bại");
        return false;
      }
      toast.success(res.data.message || "Đã cập nhật trạng thái");
      await get().getAdminPlans();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Cập nhật trạng thái thất bại");
      return false;
    }
  },
}));

export default useAdminStore;
