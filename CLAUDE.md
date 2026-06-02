# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Admin Satellite** — công cụ đăng bài hàng loạt lên nhiều website WordPress "vệ tinh" (quy trình SEO/PBN). Editor soạn bài một lần, backend fan-out đăng lên mọi site vệ tinh đang ACTIVE qua WordPress REST API, mỗi site được viết lại nội dung bằng AI để tránh trùng lặp. Đây là **monorepo** gồm 2 package độc lập (mỗi package có `package.json`, `node_modules` và `AGENTS.md` riêng). Trả lời và viết tài liệu bằng **tiếng Việt**.

## Cấu trúc monorepo

| Thư mục | Stack | Tài liệu chi tiết |
|---------|-------|-------------------|
| `admin-backend/` | Node + Express + MongoDB + Mongoose (CommonJS) | **[admin-backend/AGENTS.md](admin-backend/AGENTS.md)** |
| `SatWeb/` | Vite + React 18 + TypeScript + Zustand + Tailwind + shadcn/ui | **[SatWeb/AGENTS.md](SatWeb/AGENTS.md)** |

> **Quan trọng:** mỗi package có quy ước code, kiến trúc, template và checklist riêng trong `AGENTS.md` của nó. Trước khi sửa code trong `admin-backend/` hay `SatWeb/`, ĐỌC `AGENTS.md` tương ứng — đó là nguồn chuẩn (source of truth) về convention, file này chỉ là bản đồ tổng. Khi dựng prompt cho một feature, dùng **[PROMPT_PLAYBOOK.md](PROMPT_PLAYBOOK.md)**.

## Lệnh thường dùng

Mỗi package chạy lệnh trong thư mục của nó.

### admin-backend/
```bash
npm install
npm start          # nodemon --inspect src/index.js (hot-reload + debugger)
```
Không có bước build, không linter, không test runner (`npm test` là placeholder exit 1). Cần MongoDB chạy + `.env` hợp lệ.

### SatWeb/
```bash
npm install
npm run dev        # Vite dev → http://localhost:5173
npm run build      # tsc ; vite build → dist/
npm run lint       # eslint . --ext ts,tsx --max-warnings 0
npm run preview
```
Không có test runner.

## Kiến trúc xuyên suốt (đọc nhiều file mới hiểu)

**Hợp đồng giữa 2 package là REST API.** `SatWeb` set `axios.defaults.baseURL = VITE_API_BASE_URL` rồi gọi `/api/*` qua các Zustand store (`SatWeb/src/store/`); `admin-backend` expose `/api/{post,satellite,category,auth/login,image}`. Đổi endpoint phải cập nhật **cả hai đầu**.

**Luồng đăng bài (publish pipeline) là phần lõi** — nằm rải nhiều file ở backend, đọc kỹ trước khi sửa logic post:
`POST /api/post` → `createNewPost` → lưu ảnh (multer) + tạo `Post` → `pushToSatelliteWebsite` đẩy mỗi site vệ tinh ACTIVE vào **p-queue** → mỗi task: thay `<img>` theo ảnh site → (từ site thứ 2) viết lại nội dung bằng **OpenAI** → `POST {site}/wp-json/wp/v2/posts` với Basic Auth của site → ghi nhận `postedSatellite` / `errorSatellite`. Chi tiết & sơ đồ trong [admin-backend/AGENTS.md §6](admin-backend/AGENTS.md).

**Auth hiện chỉ là cờ, không có token thật.** Backend so khớp `APP_USERNAME`/`APP_PASSWORD` trong `.env` và trả cờ `error: true/false` (không phát hành JWT); middleware `AuthenticateJWT.js` có sẵn nhưng chưa gắn route. Frontend chỉ persist cờ `isAuthenticated` vào localStorage. Đừng dựa vào đây cho bảo mật thật.

## Quy ước chung (cả 2 package)

- **Clean, đơn giản, dễ hiểu** (dự án môn học EXE101) — ưu tiên dễ đọc hơn "thông minh", chỉ sau tính đúng & bảo mật. Chi tiết: [PROMPT_PLAYBOOK.md §0](PROMPT_PLAYBOOK.md).
- **Conventional Commits** với scope theo module: `feat(post): ...`, `fix(satellite): ...`, `feat(site): ...`.
- **UI/message bằng tiếng Việt**; vệ tinh dùng soft-delete (`status: 'INACTIVE'`), nghiệp vụ lọc `status: 'ACTIVE'`.
- **`.env` không commit**; secret đọc qua `process.env` (backend) / `import.meta.env.VITE_*` (frontend). ⚠️ Hiện `.env` chứa secret thật trong cây làm việc — nếu đã vào git history nên rotate khóa và bổ sung `.gitignore`.

## Skill UI/UX

`SatWeb/.claude/skills/ui-ux-pro-max/` là skill design-intelligence (CLI Python). Khi làm UI cho SatWeb: ưu tiên SVG icon (lucide) thay emoji, `cursor-pointer` + focus state cho phần tử tương tác, tương phản light/dark ≥ 4.5:1 — xem `SKILL.md` để biết checklist đầy đủ.
