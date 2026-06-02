import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;
axios.defaults.baseURL = API_BASE;

// Avatar cũ có thể là đường dẫn tương đối (/uploads/...) → ghép base; base64/http giữ nguyên.
function normalizeProfile<T extends { avatar?: string }>(user: T): T {
  const a = user?.avatar;
  if (a && !/^(https?:|data:)/.test(a)) {
    return { ...user, avatar: `${API_BASE}${a}` };
  }
  return user;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  jobTitle: string;
  company: string;
  website: string;
  address: string;
  bio: string;
  isAdmin: boolean;
  createdAt?: string;
}

// avatar: chuỗi base64 (data URL) để đổi ảnh, "" để xoá, undefined để giữ nguyên.
export interface UpdateProfileInput {
  name: string;
  phone: string;
  jobTitle: string;
  company: string;
  website: string;
  address: string;
  bio: string;
  avatar?: string;
}

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  saving: boolean;
  getProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<boolean>;
}

const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  loading: false,
  saving: false,

  getProfile: async () => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/auth/me`, { withCredentials: true });
      if (res.status === 200 && !res.data.error) {
        set({ profile: normalizeProfile(res.data.user) });
      }
    } catch (error: any) {
      console.error("Get profile error:", error?.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ saving: true });
      const res = await axios.patch(`/api/auth/profile`, data, {
        withCredentials: true,
      });
      if (res.status === 200 && !res.data.error) {
        set({ profile: normalizeProfile(res.data.user) });
        toast.success(res.data.message || "Cập nhật hồ sơ thành công");
        return true;
      }
      toast.error(res.data.message || "Cập nhật thất bại");
      return false;
    } catch (error: any) {
      toast.error("Cập nhật hồ sơ thất bại!");
      return false;
    } finally {
      set({ saving: false });
    }
  },
}));

export default useProfileStore;
