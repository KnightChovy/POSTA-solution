# PROGRESS — Theo dõi tiến độ POSTA

> File ghi lại các tính năng đã hoàn thành. Mỗi khi xong một tính năng, thêm một mục mới ở **đầu** danh sách (mới nhất lên trên).

---

## 2026-06-03 · Song ngữ Việt/Anh (i18n) — react-i18next

**Phạm vi:** `SatWeb/`. Hạ tầng i18n chuẩn dự án lớn, không ảnh hưởng performance.

### Đã làm
- Cài `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- **File song ngữ** [src/i18n/resources.ts](SatWeb/src/i18n/resources.ts): VI & EN, có namespace (common, landing), hỗ trợ object/array (trending theo `seed`, reasons, faqs, footerLinks).
- Cấu hình [src/i18n/index.ts](SatWeb/src/i18n/index.ts): mặc định `vi`, tự nhận từ localStorage/trình duyệt, lưu lựa chọn (`posta-lang`). Khởi tạo 1 lần ở [main.tsx](SatWeb/src/main.tsx).
- **Landing** dùng `useTranslation()`/`t()` cho toàn bộ chữ; 2 ô **chọn ngôn ngữ** (header + footer) đổi ngôn ngữ tức thì qua `i18n.changeLanguage`.

### Cách dùng cho trang khác (mở rộng dần)
- `const { t } = useTranslation();` rồi `t("common.login")`; thêm khoá ở CẢ `vi` và `en` trong resources.

### Kiểm thử
- [x] `vite build` OK (bundle tăng không đáng kể; chỉ 2 ngôn ngữ, không lazy-load cần thiết).

---

## 2026-06-03 · Landing dựng lại theo bố cục Netflix (nền sáng)

**Phạm vi:** `SatWeb/` — viết lại [landing.tsx](SatWeb/src/pages/landing.tsx).

### Đã làm
- **Header kiểu Netflix**: logo POSTA bên trái; bên phải có **chọn ngôn ngữ** (Tiếng Việt/English) + đổi sáng/tối + **Đăng nhập** (đã đăng nhập → Bảng điều khiển + avatar).
- **Hero nền sáng**: banner POSTA (`cover-posta.jpg`) **chìm mờ** (opacity thấp) trên nền kem, tiêu đề lớn kiểu Netflix (nội dung POSTA) + dòng giá + **ô nhập email "Bắt đầu"** (→ trang đăng ký, mang theo email).
- **"Chủ đề thịnh hành"**: dữ liệu mẫu + ảnh thật từ picsum, số thứ hạng kiểu Netflix.
- **"Thêm lý do để chọn POSTA"**: 4 thẻ phẳng.
- **FAQ**: Accordion 6 câu hỏi về POSTA.
- **Email capture lặp lại** + **Footer** nhiều cột kiểu Netflix (+ chọn ngôn ngữ, "POSTA Việt Nam").
- Theo yêu cầu: **màu sáng** (light), giữ brand cam-phẳng; respect light/dark.

### Lưu ý
- Bố cục mới thay cho landing cũ (bỏ pricing/reviews/TVC riêng; giá nằm trong FAQ). Có thể thêm lại nếu cần.
- Ảnh "thịnh hành" là placeholder (picsum) — cần internet để hiển thị.
- [x] `vite build` OK.

---

## 2026-06-03 · Mật khẩu nâng cao + Khu vực Admin + Phiên + Google (khung)

**Phạm vi:** `admin-backend` + `SatWeb`. Nhiều endpoint & trang mới.

### Backend
- **Đổi mật khẩu** `POST /api/auth/change-password` (verify mk cũ).
- **Quên/Đặt lại mật khẩu thật**: `POST /api/auth/forgot-password` (gửi email token, hạn 1h) + `POST /api/auth/reset-password` (đặt mk mới, xoá hết phiên cũ). Mailer thêm `sendResetPasswordEmail` (link `${FE_URL}/reset-password?token=`).
- **Phiên đăng nhập (multi-session)**: refactor refresh token → mảng `sessions` trên User (token/device/ip/time). `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id` (thu hồi) + `loginHistory` (10 gần nhất). Rotation theo từng phiên.
- **Phân quyền**: `isAdmin` vào access token; middleware `requireAdmin`. Login chặn tài khoản `isActive=false`.
- **Admin API** (`/api/admin`, yêu cầu admin): `GET /stats` (tổng user/active/verified, MRR, tổng doanh thu, doanh thu 6 tháng, user theo gói, giao dịch gần đây), `GET/POST/PATCH/DELETE /users` (liệt kê, **cấp tài khoản**, đổi gói/quyền/khoá, xoá). Model `Transaction` + `utils/plans.js` (giá gói). User thêm `plan`, `isActive`, `lastLogin`, `provider`.
- **Google OAuth (khung)**: `POST /api/auth/google` verify id_token qua Google tokeninfo (cần `GOOGLE_CLIENT_ID`).

### Frontend
- **Đổi mật khẩu** + **danh sách/thu hồi phiên** trong [profile.tsx](SatWeb/src/pages/profile.tsx).
- [forgot-password.tsx] gọi API thật; [reset-password.tsx](SatWeb/src/pages/reset-password.tsx) mới (`/reset-password?token=`).
- **Khu vực Admin**: [admin/dashboard.tsx](SatWeb/src/pages/admin/dashboard.tsx) (thẻ số liệu + biểu đồ doanh thu CSS + user theo gói + giao dịch), [admin/users.tsx](SatWeb/src/pages/admin/users.tsx) (bảng, tìm kiếm, cấp tài khoản qua modal, đổi gói/quyền/khoá, xoá). [adminStore.ts], guard [AdminRoute.tsx]. Nav hiện link "Quản trị" khi là admin.
- **Google**: [GoogleLoginButton.tsx](SatWeb/src/components/auth/GoogleLoginButton.tsx) dùng Google Identity Services nếu có `VITE_GOOGLE_CLIENT_ID`, không thì nút mô phỏng.

### Kiểm thử (thật, qua node fetch tới :3000)
- [x] 13 ca: admin login, cấp tài khoản (verified+gói), đổi mk + login mk mới, stats (MRR=499k, gói, doanh thu tháng), đổi gói, sessions=2 + revoke, forgot (generic), reset token sai bị từ chối, google chưa cấu hình, list/delete user.
- [x] `vite build` OK; backend `node --check` toàn bộ OK.

### Còn lại / lưu ý
- **Google thật** cần tạo OAuth Client ID → điền `GOOGLE_CLIENT_ID` (BE) + `VITE_GOOGLE_CLIENT_ID` (FE), restart.
- **User chỉ thấy bài/vệ tinh của mình** (gắn `owner` vào Post/Satellite): **để batch sau** vì đụng pipeline đăng bài + dữ liệu cũ.

---

## 2026-06-03 · Landing nhận biết trạng thái đăng nhập

**Phạm vi:** `SatWeb/`. Sửa lỗi: vào `/` sau khi đăng nhập vẫn hiện nút "Đăng nhập / Dùng thử".

### Đã làm
- [landing.tsx](SatWeb/src/pages/landing.tsx) dùng `useAuthStore`: khi đã đăng nhập → header hiện nút **"Bảng điều khiển"** + **avatar (chữ cái đầu)** dẫn tới `/profile`, ẩn "Đăng nhập/Dùng thử". Mọi CTA (hero, bảng giá, CTA band, footer, menu mobile) dẫn về `/dashboard` ("Vào bảng điều khiển") thay vì `/register`.
- [authStore.ts](SatWeb/src/store/authStore.ts): persist thêm `user` để giữ tên/avatar sau khi reload.

### Kiểm thử
- [x] `vite build` OK.

---

## 2026-06-03 · Profile: avatar base64 + nhiều trường + UI/UX 2 cột

**Phạm vi:** `admin-backend` + `SatWeb`. Avatar không còn lưu file — lưu base64 trong DB.

### Backend
- [index.js](admin-backend/src/index.js): tăng body limit lên `5mb` (để nhận base64).
- [User.js](admin-backend/src/app/models/User.js): thêm `jobTitle`, `company`, `website`, `address`, `bio`; `avatar` lưu base64.
- [profileController.js](admin-backend/src/app/controllers/profileController.js): nhận avatar base64 (validate `data:image/`, giới hạn ~2MB), `""` để xoá; trả thêm các trường mới + `createdAt`. Bỏ multer (xoá `avatarUpload.js`, gỡ khỏi route).

### Frontend
- [profileStore.ts](SatWeb/src/store/profileStore.ts): gửi JSON (kèm avatar base64), thêm trường.
- [profile.tsx](SatWeb/src/pages/profile.tsx): bố cục **2 cột** — cột trái thẻ tóm tắt (avatar + camera đổi/xoá, tên, email, vai trò, ngày tham gia); cột phải form chia mục **Thông tin cá nhân / Liên hệ / Giới thiệu** (họ tên, email khoá, sđt, chức danh, công ty, website, địa chỉ, bio). Đổi ảnh → đọc `FileReader.readAsDataURL` thành base64 (giới hạn 2MB).

### Kiểm thử (thật, qua node fetch tới :3000)
- [x] PATCH với avatar base64 + jobTitle/company/website/phone/bio → lưu đúng; avatar trả về dạng `data:image/...`.
- [x] `vite build` OK; backend `node --check` OK.

---

## 2026-06-03 · Trang Hồ sơ (profile) + chặn trang auth khi đã đăng nhập

**Phạm vi:** `admin-backend` + `SatWeb`. **Đổi contract:** thêm `GET /api/auth/me`, `PATCH /api/auth/profile` (đều cần access token).

### Backend
- [User.js](admin-backend/src/app/models/User.js): thêm `phone`, `avatar`.
- [avatarUpload.js](admin-backend/src/config/file/avatarUpload.js): multer riêng cho avatar (`src/uploads/avatars/`, tự tạo thư mục, 5MB, lọc ảnh).
- [profileController.js](admin-backend/src/app/controllers/profileController.js): `getProfile` (trả name/email/phone/avatar/isAdmin, avatar thành URL tuyệt đối qua `SERVER_URL`); `updateProfile` cập nhật name/phone/avatar — **không cho đổi email**.
- [auth.js](admin-backend/src/routes/auth.js): `GET /me`, `PATCH /profile` (bảo vệ bằng `authenticateJWT`, avatar qua `multer.single`).
- **.env**: thêm `SERVER_URL=http://localhost:3000`.

### Frontend
- [profileStore.ts](SatWeb/src/store/profileStore.ts): getProfile/updateProfile (multipart), chuẩn hoá avatar về URL tuyệt đối.
- [profile.tsx](SatWeb/src/pages/profile.tsx) (route `/profile`, cần đăng nhập): avatar (upload + preview/initials), tên (sửa), **email (khoá)**, sđt (sửa), nút lưu.
- [PublicOnlyRoute.tsx](SatWeb/src/components/auth/PublicOnlyRoute.tsx): bọc `/login`, `/register`, `/forgot-password` → đã đăng nhập thì đẩy về `/dashboard`.
- [Navigation.tsx](SatWeb/src/components/Navigation.tsx): thêm avatar/tên → `/profile`.

### Kiểm thử (thật, qua node fetch tới :3000)
- [x] `GET /me` có token → 200; không token → 401.
- [x] `PATCH /profile` đổi sđt (JSON) → OK; upload avatar (multipart) → lưu file + trả URL.
- [x] `vite build` OK; backend `node --check` OK.

### Lưu ý
- Đã thêm `SERVER_URL` vào `.env` → **restart backend** để avatar trả URL tuyệt đối từ server (FE cũng đã tự ghép base nên vẫn hiển thị được nếu chưa restart).

---

## 2026-06-03 · JWT access/refresh token + rotation + bảo vệ API

**Phạm vi:** `admin-backend` + `SatWeb`. **Đổi contract:** login trả thêm `accessToken`/`refreshToken`; thêm `POST /api/auth/refresh-token`, `POST /api/auth/logout`; các API dữ liệu yêu cầu Bearer token.

### Backend
- [utils/token.js](admin-backend/src/utils/token.js): tạo/verify access (`JWT_SECRET`, TTL 15m) & refresh (`JWT_REFRESH_SECRET`, TTL 7d); refresh có `jti` ngẫu nhiên → luôn duy nhất.
- [User.js](admin-backend/src/app/models/User.js): thêm `refreshToken`, `isAdmin`.
- [authController.js](admin-backend/src/app/controllers/authController.js): login cấp cặp token + lưu refresh vào DB (admin `.env` được upsert thành 1 user); `refreshToken` đối chiếu refresh trong DB rồi **rotate** (cấp mới, ghi đè = vô hiệu cái cũ); `logout` xoá refresh.
- [AuthenticateJWT.js](admin-backend/src/middleware/AuthenticateJWT.js): verify Bearer access token, trả 401 khi thiếu/hết hạn.
- [routes/index.js](admin-backend/src/routes/index.js): bảo vệ `/api/{satellite,category,image,post}` bằng middleware; `/api/auth` để public.
- **.env**: thêm `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`.

### Frontend
- [lib/axiosConfig.ts](SatWeb/src/lib/axiosConfig.ts): gắn `Authorization: Bearer` cho mọi request; khi 401 → gọi `/api/auth/refresh-token` (single-flight, hàng đợi) → lưu token mới → thử lại; refresh fail / không có refresh → bắn event `auth:logout`. Import 1 lần ở [main.tsx](SatWeb/src/main.tsx).
- [authStore.ts](SatWeb/src/store/authStore.ts): login lưu token + user; logout gọi API + xoá token. [App.tsx](SatWeb/src/App.tsx) lắng nghe `auth:logout` → đăng xuất + về `/login`.

### Kiểm thử (thật, qua node fetch tới :3000)
- [x] Login admin → có access+refresh; `/api/post` không token → 401, có token → 200.
- [x] Refresh → cấp token mới; **dùng lại refresh cũ → 401** (rotation đúng); refresh mới → 200.

### Lưu ý
- `vite build` OK; backend `node --check` OK. User đã đăng nhập trước bản này (chưa có token) sẽ bị buộc đăng nhập lại khi gọi API.

---

## 2026-06-03 · Xác thực email qua link/token khi đăng ký

**Phạm vi:** `admin-backend` + `SatWeb`. **Đổi contract:** thêm `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification`.

### Backend
- [User.js](admin-backend/src/app/models/User.js): thêm `isVerified`, `verificationToken`, `verificationTokenExpires`.
- [authController.js](admin-backend/src/app/controllers/authController.js):
  - `register`: tạo token ngẫu nhiên (crypto, hạn 24h), lưu user `isVerified:false`, gửi **email chứa link xác thực**.
  - `verifyEmail`: kiểm token + hạn → kích hoạt, xoá token, gửi email chào mừng.
  - `resendVerification`: cấp token mới + gửi lại.
  - `login`: **chặn nếu chưa xác thực** (`needVerify:true`).
- [mailer.js](admin-backend/src/utils/mailer.js): `sendVerificationEmail` (link `${FE_URL}/verify-email?token=`), `sendWelcomeEmail` (sau khi xác thực). Link dựa trên **`FE_URL`** (fallback `CLIENT_URL`).
- [auth.js](admin-backend/src/routes/auth.js): thêm route verify + resend.
- **.env**: thêm `FE_URL` (deploy chỉ cần đổi biến này).

### Frontend
- [verify-email.tsx](SatWeb/src/pages/verify-email.tsx) (route `/verify-email`): tự verify token khi mở link, hiện loading/success/error, có form **gửi lại** khi hết hạn.
- [authService.ts](SatWeb/src/service/authService.ts): `verifyEmailService`, `resendVerificationService`.
- Cập nhật thông báo đăng ký + route/noNav trong [App.tsx](SatWeb/src/App.tsx).

### Kiểm thử (thật, qua curl + token lấy từ DB)
- [x] Đăng ký → gửi email link; login chưa xác thực → bị chặn.
- [x] Verify token thật → kích hoạt; dùng lại token → vô hiệu; login sau đó → OK.
- [x] Resend hoạt động; token sai → báo lỗi.
- [x] `vite build` OK; backend `node --check` OK.

### Lưu ý
- Đổi `FE_URL` trong `.env` rồi **restart backend** khi deploy (nodemon không watch `.env`). Hiện fallback `CLIENT_URL` nên link vẫn đúng ở localhost.

---

## 2026-06-03 · Đăng nhập & Đăng ký thật (backend + frontend) + email Nodemailer

**Phạm vi:** cả `admin-backend` và `SatWeb`. **Đổi contract:** thêm `POST /api/auth/register`; `POST /api/auth/login` giữ path nhưng chuyển sang controller mới.

### Backend (`admin-backend`)
- **Model** [User.js](admin-backend/src/app/models/User.js): name, email (unique), password (hash bcrypt), createdAt.
- **Mailer** [utils/mailer.js](admin-backend/src/utils/mailer.js): Nodemailer, đọc SMTP từ env (`EMAIL_HOST/PORT/USER/PASS/FROM`); thiếu cấu hình thì bỏ qua an toàn. Email chào mừng HTML có branding cam POSTA.
- **Controller** [authController.js](admin-backend/src/app/controllers/authController.js):
  - `register`: validate → chống trùng email → hash bcrypt → lưu → gửi email (lỗi mail không chặn đăng ký).
  - `login`: nhận `username` là **email** (user DB) hoặc **tài khoản admin** trong `.env` (giữ tương thích `admin_wp`/`admin123`); so khớp bcrypt.
- **Route** [auth.js](admin-backend/src/routes/auth.js) mount tại `/api/auth`; gỡ `login.js`/`loginController.js` cũ. Cài thêm `nodemailer`.
- **.env**: thêm `EMAIL_*` (đã có app password Gmail thật, không commit).

### Frontend (`SatWeb`)
- [authService.ts](SatWeb/src/service/authService.ts) thêm `registerService`; [authStore.ts](SatWeb/src/store/authStore.ts) thêm action `register`; mở rộng `AuthState` ([index.d.ts](SatWeb/index.d.ts)).
- [register.tsx](SatWeb/src/pages/register.tsx) gọi API thật; [LoginForm.tsx](SatWeb/src/components/auth/LoginForm.tsx) đổi nhãn "Email hoặc tên đăng nhập".

### Kiểm thử (thật, qua curl tới :3000)
- [x] Đăng ký mới → `{error:false}`; trùng email → `{error:true,"Email đã được đăng ký"}`.
- [x] Đăng nhập admin + user (bcrypt) đúng; sai mật khẩu → báo lỗi.
- [x] Gửi email Nodemailer thành công tới Gmail cấu hình.
- [x] `vite build` OK; backend `node --check` OK.

### Lưu ý
- nodemon KHÔNG watch `.env` → sau khi điền `EMAIL_*` phải **restart backend** thì email khi đăng ký mới gửi.
- Google sign-in vẫn là UI mô phỏng (chưa có OAuth).

---

## 2026-06-03 · Banner hero + làm lại UI auth (login/register/forgot)

**Phạm vi:** `SatWeb/` (frontend). UI-only cho register/forgot (backend chưa có API tương ứng).

### Đã làm
- **Banner thương hiệu** vào hero landing — đổi tên `public/COVER POSTA .jpg` → `cover-posta.jpg`; hero giờ căn giữa (value prop + CTA) và dùng banner làm ảnh showcase, bấm vào mở TVC. CTA "Bắt đầu miễn phí" → `/register`.
- **Khung auth dùng chung** [AuthShell.tsx](SatWeb/src/components/auth/AuthShell.tsx): 2 cột (banner trái + form phải), kèm `GoogleButton` + `GoogleIcon` (SVG Google chính chủ). Phẳng, đúng chuẩn cam.
- **Đăng nhập** làm lại [LoginForm.tsx](SatWeb/src/components/auth/LoginForm.tsx) + [login.tsx](SatWeb/src/pages/login.tsx): có link "Quên mật khẩu?", "Đăng ký ngay", nút Google, hiện/ẩn mật khẩu.
- **Đăng ký** mới [register.tsx](SatWeb/src/pages/register.tsx): họ tên/email/mật khẩu/xác nhận (RHF + zod, khớp mật khẩu) + đăng ký Google.
- **Quên mật khẩu** mới [forgot-password.tsx](SatWeb/src/pages/forgot-password.tsx): nhập email → màn xác nhận đã gửi.
- **Route** [App.tsx](SatWeb/src/App.tsx): thêm `/register`, `/forgot-password` (công khai), ẩn nav quản trị ở các trang này.

### Ghi chú
- Nút Google + submit register/forgot là **UI mô phỏng** (backend chưa có OAuth / API đăng ký / reset). Đăng nhập thật vẫn dùng `admin_wp` / `admin123`.

### Kiểm thử
- [x] `vite build` thành công.

---

## 2026-06-03 · Áp bộ rule UI (docs/ui-rules) + làm lại Landing chuẩn POSTA

**Phạm vi:** `SatWeb/` (frontend). Tham chiếu `docs/ui-rules/` + bản mẫu `PostaShowcase.tsx`.

### Quyết định quan trọng
- Các file rule mô tả "glow/glass/3D tilt" (card-rules, button-rules) **mâu thuẫn** với **Anti-AI Aesthetic Rules** (01-shadcn-principles) và bản mẫu `PostaShowcase.tsx`. → Chọn hướng **phẳng/dứt khoát** của PostaShowcase: bỏ blur blobs, neon glow, gradient nền tràn lan, icon `Sparkles`, `animate-float`.

### Đã làm
- **Đổi palette toàn cục** sang POSTA Orange — [index.css](SatWeb/src/index.css): cam `#FF6B00` chủ đạo, nền cát kem (light) / hổ phách cháy (dark). Gỡ keyframe `float`/`gradient`/`marquee` và class `hero-glow`.
- **Font Plus Jakarta Sans** — thêm Google Fonts ở [index.html](SatWeb/index.html), set body trong index.css.
- **Làm lại [landing.tsx](SatWeb/src/pages/landing.tsx)** theo phong cách phẳng: card `bg-card border-primary/15 hover:border-primary/40`, button micro-scale `hover:scale-[1.02] active:scale-[0.98]`, màu semantic + `#FF6B00`, animation chỉ gồm entrance reveal + count-up + hover 200ms. Giữ TVC modal, 3 gói giá, review công ty.
- **Dashboard** [home.tsx](SatWeb/src/components/home.tsx): gỡ 2 div `hero-glow` (vỡ layout sau khi bỏ class) + chuyển hero sang nền phẳng.

### Kiểm thử
- [x] `vite build` thành công.

### TODO (đề xuất)
- Đồng bộ phần còn lại của **dashboard/Navigation/login** (vẫn còn gradient amber + glow shadow cũ) theo chuẩn phẳng cam mới.

---

## 2026-06-02 · Landing page giới thiệu POSTA (marketing)

**Phạm vi:** `SatWeb/` (frontend) — không chạm contract API `/api/*`.

### Đã làm
- **Trang Landing mới** — [src/pages/landing.tsx](SatWeb/src/pages/landing.tsx), `/` giờ là trang giới thiệu công khai (như homepage của một SaaS thật):
  - **Header marketing** sticky: logo POSTA, anchor (Tính năng/Quy trình/Bảng giá/Đánh giá), nút sáng/tối, "Đăng nhập" + "Dùng thử miễn phí", menu mobile.
  - **Hero**: tiêu đề gradient, CTA, **TVC + logo quảng bá** (nút play → modal video, chỉ tải khi mở), nền gradient động + quầng sáng float.
  - **Stats đếm số** (count-up, tôn trọng reduced-motion).
  - **Tính năng** (6 thẻ), **Quy trình** (3 bước).
  - **Bảng giá 3 gói**: Cơ bản / Trung bình (phổ biến) / Nâng cao.
  - **Review/feedback** của các công ty — dải marquee chạy ngang, dừng khi hover.
  - **CTA band** + **Footer** đầy đủ.
- **Animation**: component [Reveal.tsx](SatWeb/src/components/landing/Reveal.tsx) (hiện dần khi cuộn, IntersectionObserver) + keyframe `float`/`gradient-pan`/`marquee` trong [index.css](SatWeb/src/index.css); tất cả tôn trọng `prefers-reduced-motion`.
- **Tách bảng điều khiển** — trang quản lý cũ chuyển sang `/dashboard` (cần đăng nhập): [App.tsx](SatWeb/src/App.tsx). Ẩn nav quản trị ở `/` và `/login`.
- Cập nhật điều hướng: "Trang chủ" → "Bảng điều khiển" (`/dashboard`) trong [Navigation.tsx](SatWeb/src/components/Navigation.tsx) + [sidebar.tsx](SatWeb/src/components/sidebar.tsx); redirect sau đăng nhập → `/dashboard` ([login.tsx](SatWeb/src/pages/login.tsx)).

### Kiểm thử
- [x] `tsc --noEmit` sạch ở các file thay đổi.
- [x] `vite build` thành công.

### Ghi chú
- Số liệu thống kê & review là **nội dung marketing mẫu** (placeholder) — thay bằng số/tên thật khi có.

---

## 2026-06-02 · Homepage công khai + sửa lỗi đăng nhập

**Phạm vi:** `SatWeb/` (frontend) + config — không đổi logic backend.

### Đã làm
- **Trang chủ không cần đăng nhập** — [App.tsx](SatWeb/src/App.tsx): bỏ `ProtectedRoute` khỏi route `/`; thanh điều hướng hiện ở mọi trang trừ `/login` (`showNav = pathname !== "/login"`). Các route khác vẫn được bảo vệ.

### Sửa lỗi
- **Login không được** — nguyên nhân: thiếu file `SatWeb/.env` → `VITE_API_BASE_URL` = `undefined` → axios gọi sai địa chỉ, không tới backend. **Fix:** tạo `SatWeb/.env` với `VITE_API_BASE_URL=http://localhost:3000`.
- **Tài khoản đăng nhập** đúng là `APP_USERNAME` / `APP_PASSWORD` trong `admin-backend/.env` → **`admin_wp` / `admin123`** (KHÔNG phải `letuan123` — đó là `WP_USERNAME` của WordPress).

### Cần làm để chạy
- Khởi động backend trước (`cd admin-backend && npm start`), rồi `cd SatWeb && npm run dev`. Vite chỉ đọc `.env` lúc khởi động — nếu đang chạy thì restart.

---

## 2026-06-02 · Thiết kế lại Homepage (SatWeb) + nhận diện thương hiệu POSTA

**Phạm vi:** `SatWeb/` (frontend) — không chạm contract API `/api/*`.

### Đã làm
- **Homepage cao cấp** — [src/components/home.tsx](SatWeb/src/components/home.tsx):
  - **Hero** glassmorphism với quầng sáng vàng trang trí, logo + wordmark POSTA, lời chào theo thời điểm trong ngày, 2 CTA (Tạo bài viết / Quản lý website).
  - **Vòng tỷ lệ thành công** vẽ bằng SVG thuần (không thêm thư viện chart), tính từ dữ liệu thật `totalPublishedPosts` / `totalErrorPosts`.
  - **4 stat cards** có chiều sâu: hover nâng nhẹ, vệt sáng, icon scale; lọc vệ tinh `status === 'ACTIVE'`.
  - **Section TVC** banner cam→đỏ theo màu thương hiệu, nút "Xem TVC".
  - **Panel "Sức khỏe hệ thống"** (thanh tiến trình tỷ lệ thành công, vệ tinh hoạt động, số bài viết) + **Lối tắt** (thêm site / quản lý / hướng dẫn).
  - Tái dùng `PostTable` cho danh sách bài viết.
- **TVC POSTA** — modal phát video dùng `components/ui/dialog`, video **chỉ tải khi bấm play** (tránh nuốt 38MB lúc vào trang — rule performance).
- **Nhận diện thương hiệu POSTA** đồng bộ logo + wordmark ở [Navigation.tsx](SatWeb/src/components/Navigation.tsx) và [sidebar.tsx](SatWeb/src/components/sidebar.tsx) (desktop + mobile), thay "Auto Post" → "POSTA".
- **Animation** `rise` + tôn trọng `prefers-reduced-motion` — [src/index.css](SatWeb/src/index.css).
- **Asset:** đổi tên `public/TVC POSTA .mp4` → `public/tvc-posta.mp4` (bỏ dấu cách trong URL).

### Sửa lỗi tiềm ẩn
- Logo cũ trỏ `/src/access/...jpg` — đường dẫn `src/` **không hoạt động ở production build**. Đã chuyển sang asset trong `public/` (`/logo-3.png`).

### Kiểm thử
- [x] `tsc --noEmit` sạch ở các file thay đổi (home / Navigation / sidebar).
- [ ] `npm run lint` — chưa chạy được (eslint chưa cài trong môi trường hiện tại).
- [ ] Chạy `npm run dev` xem trực quan (chờ review của bạn).

### Ghi chú / TODO
- Theme giữ bản sắc Gold luxury sẵn có (không đổi sang indigo như skill gợi ý) để **nhất quán** toàn app; điểm nhấn TVC dùng cam→đỏ theo logo POSTA.
- Skill `ui-ux-pro-max` gợi ý font Fira Code/Fira Sans — **chưa áp dụng** (giữ font hiện tại để không phá layout); cân nhắc sau nếu muốn.
