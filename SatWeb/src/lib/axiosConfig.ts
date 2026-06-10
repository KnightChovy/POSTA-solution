import axios from "axios";

const baseURL = `${import.meta.env.VITE_API_BASE_URL}`;
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;

// Quản lý token trong localStorage (truy cập đồng bộ trong interceptor).
export const tokenStore = {
  get access() {
    return localStorage.getItem("accessToken");
  },
  get refresh() {
    return localStorage.getItem("refreshToken");
  },
  set(access: string, refresh: string) {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// Client riêng cho refresh — KHÔNG gắn interceptor để tránh lặp vô hạn.
const refreshClient = axios.create({ baseURL });

// Gắn access token vào mọi request.
axios.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hàng đợi các request bị 401 trong lúc đang refresh để tránh gọi refresh nhiều lần.
let isRefreshing = false;
let waiters: Array<(token: string | null) => void> = [];

function flushWaiters(token: string | null) {
  waiters.forEach((cb) => cb(token));
  waiters = [];
}

// Khi access token hết hạn (401) → gọi refresh-token (đối chiếu DB + rotation) rồi thử lại.
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url: string = original?.url || "";
    const isAuthCall = url.includes("/api/auth/");

    if (status !== 401 || original?._retry || isAuthCall) {
      return Promise.reject(error);
    }

    // 401 nhưng không có refresh token → buộc đăng nhập lại.
    if (!tokenStore.refresh) {
      tokenStore.clear();
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(error);
    }

    // Đang refresh: chờ token mới rồi thử lại request này.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(error);
          original._retry = true;
          original.headers.Authorization = `Bearer ${token}`;
          resolve(axios(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const { data } = await refreshClient.post("/api/auth/refresh-token", {
        refreshToken: tokenStore.refresh,
      });
      if (data?.error) throw new Error("refresh failed");

      tokenStore.set(data.accessToken, data.refreshToken);
      flushWaiters(data.accessToken);

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(original);
    } catch (refreshError) {
      flushWaiters(null);
      tokenStore.clear();
      // Báo cho ứng dụng đăng xuất & chuyển về trang đăng nhập.
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
