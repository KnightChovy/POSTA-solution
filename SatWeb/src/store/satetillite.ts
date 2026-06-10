import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

// Nền tảng vệ tinh: WordPress (mặc định) hoặc social.
export type Platform = "WORDPRESS" | "TWITTER" | "FACEBOOK";

export interface Satellite {
  _id?: string;
  platform?: Platform;
  // WordPress dùng url/username/password; social để trống và dùng credentials.
  url?: string;
  username?: string;
  password?: string;
  // Social credential: TWITTER → apiKey/apiSecret/accessToken/accessSecret; FACEBOOK → pageId/pageAccessToken.
  credentials?: Record<string, string>;
  status?: string;
}

interface SatelliteStore {
  satellites: Satellite[];
  loading: boolean;
  addSatellite: (data: Satellite) => Promise<void>;
  getSatellite: () => Promise<void>;
  removeSatellite: (satelliteId: number) => void;
  addNewSatellite: (satellite: Satellite) => Promise<void>;
  updateSatellite: (satID: string, satellite: Satellite) => Promise<void>;
}

const useSatelliteStore = create<SatelliteStore>((set) => ({
  satellites: [],
  loading: false,
  addSatellite: async (satellite) => {
    set((state) => ({ satellites: [...state.satellites, satellite] }));
  },

  removeSatellite: (satelliteId) => {},

  getSatellite: async () => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/satellite`, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.status === 200) {
        set({ satellites: res.data.satellites || [] });
      }
    } catch (error) {
      console.error(
        "Get satellite error",
        error?.response?.data || error.message || error
      );
    } finally {
      set({ loading: false });
    }
  },
  addNewSatellite: async (satellite: Satellite) => {
    try {
      set({ loading: true });
      const res = await axios.post(`/api/satellite`, satellite, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res.status === 201) {
        set((state) => ({
          satellites: [...state.satellites, res.data.satellite],
        }));
        toast.success("Thêm mới vệ tinh thành công!");
      }
    } catch (error) {
      toast.error("Thêm mới vệ tinh thất bại!");
    } finally {
      set({ loading: false });
    }
  },
  updateSatellite: async (satID: string, satellite: Satellite) => {
    try {
      set({ loading: true });
      const res = await axios.patch(`/api/satellite/${satID}`, satellite, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res.status === 200) {
        set((state) => ({
          satellites: state.satellites.map((sat) =>
            sat._id === satID ? res.data.satellite : sat
          ),
        }));
        toast.success("Cập nhật vệ tinh thành công!");
      }
    } catch (error) {
      toast.error("Cập nhật vệ tinh thất bại!");
    } finally {
      set({ loading: false });
    }
  },
}));

export default useSatelliteStore;
