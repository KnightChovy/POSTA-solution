import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

export interface PlanLimits {
  websites: number;
  ai: number;
  aiPeriod: "week" | "month" | "none";
  posts: number;
  postsPeriod: "week" | "month" | "none";
}

export interface Plan {
  _id: string;
  key: string;
  name: string;
  description: string;
  price: number;
  limits: PlanLimits;
  isPublished: boolean;
  isArchived: boolean;
  sortOrder: number;
}

export interface PaymentInfo {
  amount: number;
  reference: string;
  accountNumber: string;
  bankCode: string;
  qrUrl: string | null;
}

interface UsageItem {
  used: number;
  limit: number;
  period?: string;
}

export interface Subscription {
  plan: { key: string; name: string; price?: number; limits: Partial<PlanLimits> };
  usage: { websites: UsageItem; ai: UsageItem; posts: UsageItem };
  pending: { reference: string; amount: number; planName: string; payment: PaymentInfo } | null;
}

interface PlanStore {
  plans: Plan[];
  subscription: Subscription | null;
  loading: boolean;
  getPlans: () => Promise<void>;
  getSubscription: () => Promise<void>;
  // Trả về thông tin thanh toán (nếu gói trả phí) hoặc null nếu miễn phí/lỗi.
  purchasePlan: (key: string) => Promise<{ free?: boolean; payment?: PaymentInfo } | null>;
  devConfirm: (reference: string) => Promise<boolean>;
}

const usePlanStore = create<PlanStore>((set, get) => ({
  plans: [],
  subscription: null,
  loading: false,

  getPlans: async () => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/plans`);
      if (!res.data.error) set({ plans: res.data.plans ?? [] });
    } catch (error: any) {
      console.error("Get plans error:", error?.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  getSubscription: async () => {
    try {
      const res = await axios.get(`/api/plans/me/subscription`);
      if (!res.data.error) set({ subscription: res.data.subscription });
    } catch (error: any) {
      console.error("Get subscription error:", error?.response?.data || error.message);
    }
  },

  purchasePlan: async (key) => {
    try {
      const res = await axios.post(`/api/plans/${key}/purchase`);
      if (res.data.error) {
        toast.error(res.data.message || "Mua gói thất bại");
        return null;
      }
      if (res.data.free) {
        toast.success(res.data.message || "Đã kích hoạt gói");
        await get().getSubscription();
        return { free: true };
      }
      return { payment: res.data.payment as PaymentInfo };
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Mua gói thất bại");
      return null;
    }
  },

  devConfirm: async (reference) => {
    try {
      const res = await axios.post(`/api/payment/dev-confirm/${reference}`);
      if (res.data.error) {
        toast.error(res.data.message || "Xác nhận thất bại");
        return false;
      }
      toast.success("Thanh toán thành công!");
      await get().getSubscription();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xác nhận thất bại");
      return false;
    }
  },
}));

export default usePlanStore;
