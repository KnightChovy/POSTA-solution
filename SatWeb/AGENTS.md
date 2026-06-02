# AGENTS.md — Admin Satellite · Frontend (SatWeb)

> SPA quản trị cho công cụ đăng bài vệ tinh.
> Stack: **Vite + React 18 + TypeScript + Zustand + Tailwind + shadcn/ui (Radix)**.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Cài đặt & chạy Dev](#3-cài-đặt--chạy-dev)
4. [Quy ước code](#4-quy-ước-code)
5. [Quy ước Git & Commit](#5-quy-ước-git--commit)
6. [Kiến trúc & luồng dữ liệu](#6-kiến-trúc--luồng-dữ-liệu)
7. [Hướng dẫn cho AI Agent](#7-hướng-dẫn-cho-ai-agent)
8. [Biến môi trường](#8-biến-môi-trường)
9. [Điểm "lệch" cần biết](#9-điểm-lệch-cần-biết)

---

## 1. Tổng quan

SatWeb là giao diện admin: đăng nhập, soạn bài + upload ảnh, theo dõi tiến độ fan-out, quản lý website vệ tinh. Toàn bộ gọi tới backend `admin-backend` qua REST `/api/*`. UI bằng **tiếng Việt** — giữ nguyên.

---

## 2. Cấu trúc thư mục

```
src/
├── main.tsx                    # Bootstrap React + tempo-devtools
├── App.tsx                     # Router (react-router-dom) + ProtectedRoute + ToastContainer
│
├── pages/                      # Mỗi route 1 page
│   ├── login.tsx
│   ├── create-post.tsx         # Soạn bài + upload ảnh + gửi đăng
│   ├── create-site.tsx         # Tạo/sửa vệ tinh (cũng dùng cho /viewSat/:id)
│   ├── viewSat.tsx             # Danh sách vệ tinh
│   ├── progress.tsx            # Theo dõi tiến độ đăng
│   └── GetAppPasswordPage.tsx  # Hướng dẫn lấy WordPress application password
│
├── components/
│   ├── auth/ProtectedRoute.tsx # Chặn route khi chưa đăng nhập
│   ├── layout/DashboardLayout.tsx
│   ├── Navigation.tsx, sidebar.tsx, home.tsx, SettingsForm.tsx
│   ├── titap/TiptapEditor.tsx  # Rich text editor
│   └── ui/                     # shadcn/ui — KHÔNG sửa tay trừ khi cần (xem §4)
│
├── store/                      # Zustand stores (state toàn cục + gọi API)
│   ├── authStore.ts            # Đăng nhập, isAuthenticated (persist localStorage)
│   ├── postStore.ts            # CRUD post, repost, track-progress (persist)
│   ├── satetillite.ts          # CRUD vệ tinh
│   └── progress.ts             # Trạng thái tiến độ đăng (không persist)
│
├── service/authService.ts      # Hàm gọi API thuần (login)
├── state/                      # sites.tsx, wpSite.tsx (state cục bộ liên quan site)
├── hooks/usePerformanceMonitor.ts
├── lib/utils.ts                # cn() — merge className (clsx + tailwind-merge)
└── stories/                    # Storybook/tempo — KHÔNG phải route app

index.d.ts (gốc SatWeb)         # Type dùng chung: Post, AuthState (import qua "../../index")
components.json                 # Cấu hình shadcn/ui
```

---

## 3. Cài đặt & chạy Dev

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # tsc ; vite build → dist/  (lưu ý: noEmitOnError=false, lỗi type KHÔNG chặn build)
npm run lint       # eslint . --ext ts,tsx --max-warnings 0
npm run preview    # serve bản build
```
Không có test runner. Deploy qua [vercel.json](SatWeb/vercel.json) (rewrite SPA về `/`).

---

## 4. Quy ước code

- **Clean, đơn giản, dễ hiểu** (dự án môn học): component nhỏ, một trách nhiệm; tên tự giải thích; không over-engineer.
- **Module:** ESM + TypeScript (`import`/`export`).
- **TypeScript:** `tsconfig` để `strict: false` — nhưng **vẫn ưu tiên khai báo type rõ ràng** cho props, state, response. Hạn chế `any`; nếu buộc dùng, ghi chú lý do. Type dùng chung đặt ở [SatWeb/index.d.ts](SatWeb/index.d.ts).
- **State & API:** mọi state toàn cục + lời gọi API đặt trong **Zustand store** (`src/store/`). Component **không** gọi `axios` trực tiếp — gọi action của store. Hàm gọi API thuần (nếu tách) đặt ở `src/service/`.
- **Base URL:** store set `axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL`, rồi gọi đường dẫn tương đối `/api/...` với `withCredentials: true`.
- **UI components:** dùng primitive trong `src/components/ui/` (shadcn/ui). Thêm component shadcn mới qua CLI thay vì copy tay; tránh sửa trực tiếp file trong `ui/`.
- **Style:** Tailwind; gộp class bằng `cn()` từ [src/lib/utils.ts](SatWeb/src/lib/utils.ts). Alias `@/` → `./src`.
- **Thông báo:** dùng `react-toastify` (`toast.success/error`) cho phản hồi người dùng, message tiếng Việt.
- **Icon:** dùng `lucide-react` (SVG), **không** dùng emoji làm icon. Mọi phần tử click được phải có `cursor-pointer` + focus state rõ ràng (xem skill `ui-ux-pro-max`).

---

## 5. Quy ước Git & Commit

**Conventional Commits**, scope theo khu vực UI:
```
<type>(<scope>): <mô tả ngắn>
```
**Types:** `feat` | `fix` | `refactor` | `docs` | `chore` | `style`
**Scope:** `auth`, `post`, `site`, `progress`, `ui`, `layout`

*Ví dụ:* `feat(post): thêm preview ảnh trước khi đăng`, `fix(auth): redirect về /login khi token hết hạn`.

---

## 6. Kiến trúc & luồng dữ liệu

```
Component (pages/) ──gọi action──► Zustand store (src/store/)
                                      │  axios.defaults.baseURL = VITE_API_BASE_URL
                                      ▼
                                 backend REST /api/*
```

- **Routing:** [App.tsx](SatWeb/src/App.tsx) dùng `react-router-dom`. Mọi route trừ `/login` bọc trong [ProtectedRoute](SatWeb/src/components/auth/ProtectedRoute.tsx); route không khớp → redirect `/login`.
- **Auth (client-side):** [authStore](SatWeb/src/store/authStore.ts) chỉ persist cờ `isAuthenticated` vào localStorage (key `auth-storage`). Đăng nhập gọi `/api/auth/login`; **không có JWT** — chỉ là cờ boolean. Logout xoá localStorage.
- **Post flow:** [create-post.tsx](SatWeb/src/pages/create-post.tsx) gửi multipart (ảnh + `values` JSON + `siteInfoWithImageUrl`) tới `/api/post`; tiến độ theo dõi qua [progress store](SatWeb/src/store/progress.ts) + `getProgress` (postStore).
- **Type dùng chung:** import từ `"../../index"` (file [SatWeb/index.d.ts](SatWeb/index.d.ts)).

---

## 7. Hướng dẫn cho AI Agent

> Đọc trước khi sinh/sửa code frontend.

### Nguyên tắc bắt buộc

1. **Không gọi axios trong component** — thêm/dùng action trong store tương ứng.
2. **Tái dùng `src/components/ui/`** thay vì tự dựng input/button/dialog mới.
3. **Gộp class bằng `cn()`**, dùng alias `@/`, giữ UI tiếng Việt.
4. **Khớp shape dữ liệu với backend** — kiểm tra tên field thật (xem §9, có field bị lệch số ít/số nhiều).
5. **Không phá contract** với backend `/api/*` khi không cần; nếu đổi endpoint, cập nhật cả `admin-backend`.
6. **Đừng thêm thư viện trùng chức năng** đã có (state: Zustand; form: react-hook-form + zod; toast: react-toastify; icon: lucide-react).

### Template: Zustand store action gọi API

```typescript
import { create } from "zustand";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.baseURL = `${import.meta.env.VITE_API_BASE_URL}`;

interface ThingStore {
  things: Thing[];
  loading: boolean;
  getThings: () => Promise<void>;
}

const useThingStore = create<ThingStore>((set) => ({
  things: [],
  loading: false,
  getThings: async () => {
    try {
      set({ loading: true });
      const res = await axios.get(`/api/thing`, { withCredentials: true });
      if (res.status === 200) set({ things: res.data.things ?? [] });
    } catch (error: any) {
      toast.error("Tải dữ liệu thất bại!");
    } finally {
      set({ loading: false });
    }
  },
}));

export default useThingStore;
```

### Checklist trước khi commit

- [ ] `npm run lint` sạch (0 warning — vì `--max-warnings 0`).
- [ ] `npm run build` chạy (lưu ý lỗi type không chặn build — vẫn nên sửa hết).
- [ ] State/API đặt trong store, component không gọi axios trực tiếp.
- [ ] Dùng lại component `ui/`, icon SVG (lucide), không emoji.
- [ ] Phần tử click có `cursor-pointer` + focus state; UI tiếng Việt.
- [ ] Commit theo Conventional Commits, scope đúng khu vực.

---

## 8. Biến môi trường

`SatWeb/.env` (không commit). Vite chỉ expose biến prefix `VITE_`.

```bash
VITE_API_BASE_URL=http://localhost:3000   # Origin của admin-backend
```

---

## 9. Điểm "lệch" cần biết (đã xác minh)

- **Tên field type lệch với backend:** [index.d.ts](SatWeb/index.d.ts) khai `Post` với `totalSatellites` / `postedSatellites` / `errorSatellites` (số nhiều), nhưng backend trả về **số ít** (`totalSatellite`, `postedSatellite`, `errorSatellite`). Khi đọc dữ liệu thật phải theo tên backend, không tin mù type.
- **`build` không chặn lỗi type:** `tsconfig` có `noEmitOnError: false` và `strict: false` → `vite build` vẫn ra `dist/` dù còn lỗi TS. Đừng coi build pass là code đúng type.
- **Tên file store `satetillite.ts`** viết sai chính tả (thiếu/đảo chữ) nhưng đang được import đúng theo tên đó — đổi tên phải sửa hết import.
- **Tempo & Storybook:** `src/stories/`, `tempobook`, `tempo-devtools` là tooling, không phải route app — đừng nhầm là tính năng.
- **Auth chỉ là cờ localStorage:** không có token; xoá localStorage là "đăng xuất". Không dựa vào đây cho bảo mật thật.
