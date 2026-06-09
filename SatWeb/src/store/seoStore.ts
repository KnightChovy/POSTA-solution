import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

// Dùng axios mặc định để interceptor trong src/lib/axiosConfig.ts tự gắn
// "Authorization: Bearer <token>" — /api/seo nằm sau authenticateJWT ở backend.
axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

export type SeoStatus = "pass" | "warn" | "fail";

export interface SeoCheck {
  label: string;
  status: SeoStatus;
  detail: string;
}

export interface SeoMetrics {
  wordCount: number;
  keyword: string;
  keywordOccurrences: number;
  keywordDensity: number;
  keywordInTitle: boolean;
  keywordInFirstParagraph: boolean;
  titleLength: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  linkCount: number;
}

export interface SeoEvaluation {
  score: number;
  grade: string;
  keyword: string; // từ khóa AI đã dùng (người dùng nhập hoặc AI tự nhận diện)
  summary: string;
  checks: SeoCheck[];
  suggestions: string[];
}

interface EvaluatePayload {
  title?: string;
  content: string;
  keyword?: string; // để trống -> backend/AI tự nhận diện
  language?: string;
}

interface OptimizePayload extends EvaluatePayload {
  issues?: string[];
}

interface SeoStore {
  evaluating: boolean;
  optimizing: boolean;
  evaluation: SeoEvaluation | null;
  metrics: SeoMetrics | null;
  evaluate: (payload: EvaluatePayload) => Promise<SeoEvaluation | void>;
  optimize: (
    payload: OptimizePayload
  ) => Promise<{ title: string; content: string } | void>;
  reset: () => void;
}

const useSeoStore = create<SeoStore>((set) => ({
  evaluating: false,
  optimizing: false,
  evaluation: null,
  metrics: null,

  evaluate: async (payload) => {
    try {
      set({ evaluating: true });
      const res = await axios.post(`/api/seo/evaluate`, payload, {
        withCredentials: true,
      });
      if (res.status === 200 && res.data?.evaluation) {
        set({
          evaluation: res.data.evaluation,
          metrics: res.data.metrics ?? null,
        });
        return res.data.evaluation as SeoEvaluation;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || "Chấm điểm SEO thất bại!"
      );
    } finally {
      set({ evaluating: false });
    }
  },

  optimize: async (payload) => {
    try {
      set({ optimizing: true });
      const res = await axios.post(`/api/seo/optimize`, payload, {
        withCredentials: true,
      });
      if (res.status === 200 && res.data?.content) {
        return { title: res.data.title, content: res.data.content };
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || "Tối ưu nội dung SEO thất bại!"
      );
    } finally {
      set({ optimizing: false });
    }
  },

  reset: () => set({ evaluation: null, metrics: null }),
}));

export default useSeoStore;
