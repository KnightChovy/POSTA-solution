# Hướng dẫn deploy POSTA lên Render (cho người mới)

Dự án gồm 2 phần + 1 database:

| Thành phần | Deploy ở đâu | Loại dịch vụ |
|------------|--------------|--------------|
| `admin-backend/` (API Node) | Render | **Web Service** |
| `SatWeb/` (React) | Render | **Static Site** |
| MongoDB | MongoDB Atlas (free) | Database cloud |

> Render **không có** MongoDB sẵn, nên database dùng **MongoDB Atlas** (miễn phí). Làm lần lượt: Atlas → đẩy code lên GitHub → backend → frontend → nối lại → webhook SePay.

---

## PHẦN 0 — Chuẩn bị (5 phút)

1. Có sẵn: tài khoản **GitHub** (repo đã có: `KnightChovy/POSTA-solution`).
2. Tạo các chuỗi bí mật ngẫu nhiên (chạy trong terminal, lưu lại để dán vào env sau):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Chạy 3 lần để có 3 chuỗi cho: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET_KEY`.
3. Đặt 1 chuỗi cho `SEPAY_WEBHOOK_API_KEY` (vd chạy lệnh trên thêm 1 lần).

---

## PHẦN 1 — Tạo database MongoDB Atlas (miễn phí)

1. Vào https://www.mongodb.com/cloud/atlas/register → đăng ký (đăng nhập Google cho nhanh).
2. Tạo **cluster free**: chọn **M0 (Free)**, nhà cung cấp tuỳ ý, **region gần VN** (vd Singapore) → **Create**.
3. Mục **Security → Quickstart** (hoặc **Database Access**): tạo **user database**:
   - Username: vd `posta`
   - Password: bấm **Autogenerate** rồi **COPY LƯU LẠI** (sẽ cần dán vào chuỗi kết nối).
4. Mục **Network Access** → **Add IP Address** → chọn **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) → Confirm.
   *(Render dùng IP động nên phải mở cho mọi IP.)*
5. Về **Database → Connect → Drivers** → copy chuỗi dạng:
   ```
   mongodb+srv://posta:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Sửa chuỗi** thành `MONGO_URI` hoàn chỉnh:
   - Thay `<db_password>` bằng mật khẩu thật ở bước 3.
   - Thêm tên database `admin_seo` ngay sau `.net/`:
   ```
   mongodb+srv://posta:MAT_KHAU@cluster0.xxxxx.mongodb.net/admin_seo?retryWrites=true&w=majority
   ```
   → Đây là giá trị `MONGO_URI` sẽ dán vào Render ở Phần 3.

---

## PHẦN 2 — Đẩy code mới nhất lên GitHub

Render build từ GitHub, nên phải commit + push trước (kể cả các sửa đổi vừa làm: `package.json`, payment...).

```bash
git add -A
git commit -m "chore(deploy): chuẩn bị deploy Render (production scripts + deps + SePay env)"
git push origin feat/paymentGeteway
```

> Có thể deploy thẳng từ nhánh `feat/paymentGeteway`. Khi ổn định nên merge vào `main` và cho Render theo `main`.

---

## PHẦN 3 — Deploy Backend (Web Service)

1. Vào https://render.com → **Get Started** → đăng nhập bằng **GitHub** (cho phép Render truy cập repo).
2. Dashboard → **New +** → **Web Service** → chọn repo `POSTA-solution` → **Connect**.
3. Điền cấu hình:
   | Mục | Giá trị |
   |-----|---------|
   | **Name** | `posta-backend` |
   | **Branch** | `feat/paymentGeteway` (nhánh có code mới) |
   | **Root Directory** | `admin-backend` |
   | **Runtime / Language** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |
4. Bấm **Advanced → Add Environment Variable**, thêm lần lượt (xem bảng env ở cuối):
   - `NODE_ENV` = `production`
   - `MONGO_URI` = chuỗi Atlas ở Phần 1
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET_KEY` = 3 chuỗi ngẫu nhiên ở Phần 0
   - `ACCESS_TOKEN_TTL` = `15m`, `REFRESH_TOKEN_TTL` = `7d`
   - `OPENAI_API_KEY` = khóa OpenAI
   - `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `SEPAY_WEBHOOK_API_KEY`
   - `CLIENT_URL`, `FE_URL`, `SERVER_URL` = **tạm để trống**, điền sau khi có URL (Phần 5)
   - (tuỳ chọn) `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `GOOGLE_CLIENT_ID`
   - **KHÔNG** đặt `PORT` — Render tự cấp (code đã đọc `process.env.PORT`).
5. **Create Web Service** → đợi build (~2–4 phút). Xem tab **Logs**, thấy:
   ```
   Server is running at http://localhost:10000
   MongoDB has been connected successfully
   ```
6. Copy URL backend ở đầu trang, dạng: `https://posta-backend.onrender.com`. Mở thử URL này → thấy `Server is running ✅` là OK.

---

## PHẦN 4 — Deploy Frontend (Static Site)

1. Dashboard → **New +** → **Static Site** → chọn repo `POSTA-solution`.
2. Cấu hình:
   | Mục | Giá trị |
   |-----|---------|
   | **Name** | `posta` |
   | **Branch** | `feat/paymentGeteway` |
   | **Root Directory** | `SatWeb` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |
3. **Add Environment Variable**:
   - `VITE_API_BASE_URL` = URL backend ở Phần 3 (vd `https://posta-backend.onrender.com`) — **không có dấu `/` cuối**.
   - (tuỳ chọn) `VITE_GOOGLE_CLIENT_ID` = cùng giá trị `GOOGLE_CLIENT_ID` nếu dùng đăng nhập Google.
4. **Create Static Site** → đợi build → copy URL, dạng `https://posta.onrender.com`.
5. **Thêm luật SPA** (để F5 không bị 404): vào Static Site → **Redirects/Rewrites** → **Add Rule**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: **Rewrite**

---

## PHẦN 5 — Nối Backend ↔ Frontend

1. Quay lại **posta-backend → Environment**, sửa 3 biến đã để trống:
   - `CLIENT_URL` = URL frontend (vd `https://posta.onrender.com`) — **không dấu `/` cuối** (dùng cho CORS).
   - `FE_URL` = URL frontend (dùng dựng link trong email).
   - `SERVER_URL` = URL backend (vd `https://posta-backend.onrender.com`).
2. **Save Changes** → backend tự deploy lại.
3. Mở frontend, thử **đăng ký + đăng nhập**. Nếu chạy được tức là FE ↔ BE ↔ DB đã thông.

---

## PHẦN 6 — Cấu hình Webhook SePay (URL thật)

Giờ đã có URL public, vào https://my.sepay.vn → **Cấu hình → Webhooks → Thêm**:
- **URL**: `https://posta-backend.onrender.com/api/payment/sepay/webhook`
- **Sự kiện**: Tiền vào (`in`)
- **Tài khoản**: TK ngân hàng cá nhân đã liên kết
- **Xác thực**: **API Key** → nhập đúng chuỗi `SEPAY_WEBHOOK_API_KEY` đã đặt ở backend.

Test: mua 1 gói trên frontend → quét QR chuyển khoản (nội dung `POSTA...`) → vài giây sau gói tự kích hoạt.

---

## PHẦN 7 — Lưu ý gói Free của Render (QUAN TRỌNG)

- **Ngủ sau 15 phút không dùng**: request đầu sau khi ngủ mất ~50s để "thức dậy". Webhook SePay có retry nên vẫn nhận được, nhưng lần thanh toán đầu sau khi idle có thể chờ lâu. Muốn luôn bật → nâng gói trả phí.
- **Ổ đĩa tạm (ephemeral)**: ảnh upload lưu trong `src/uploads` sẽ **mất khi deploy lại/restart**. Ảnh đăng lên site vệ tinh thì nằm trên WordPress nên không sao; chỉ tính năng **repost dùng ảnh host trên server** có thể hỏng link sau restart. Với đồ án demo thì chấp nhận được; nếu cần bền vững thì dùng dịch vụ lưu ảnh ngoài (Cloudinary/S3).

---

## PHẦN 8 — Bảng biến môi trường tổng hợp

### Backend (Web Service)
| Biến | Giá trị | Bắt buộc |
|------|---------|----------|
| `NODE_ENV` | `production` | ✅ |
| `MONGO_URI` | chuỗi Atlas (kèm `/admin_seo`) | ✅ |
| `JWT_SECRET` | chuỗi ngẫu nhiên | ✅ |
| `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên khác | ✅ |
| `SESSION_SECRET_KEY` | chuỗi ngẫu nhiên | ✅ |
| `ACCESS_TOKEN_TTL` | `15m` | ✅ |
| `REFRESH_TOKEN_TTL` | `7d` | ✅ |
| `CLIENT_URL` | URL frontend | ✅ (CORS) |
| `FE_URL` | URL frontend | ✅ |
| `SERVER_URL` | URL backend | ✅ |
| `OPENAI_API_KEY` | khóa OpenAI | ✅ (tính năng AI) |
| `SEPAY_ACCOUNT_NUMBER` | số TK SePay | ✅ (thanh toán) |
| `SEPAY_BANK_CODE` | mã NH (MBBank...) | ✅ |
| `SEPAY_WEBHOOK_API_KEY` | chuỗi tự đặt | ✅ |
| `EMAIL_*`, `GOOGLE_CLIENT_ID` | cấu hình email/Google | tuỳ chọn |

### Frontend (Static Site)
| Biến | Giá trị |
|------|---------|
| `VITE_API_BASE_URL` | URL backend (không `/` cuối) |
| `VITE_GOOGLE_CLIENT_ID` | (tuỳ chọn) |

---

## PHẦN 9 — Lỗi thường gặp & cách xử lý

| Triệu chứng | Nguyên nhân & cách sửa |
|-------------|------------------------|
| Build fail `Cannot find module 'express'` | Thư viện còn ở devDependencies → đã chuyển sang dependencies trong `package.json`; nhớ commit + push. |
| `MongooseServerSelectionError` trong log | Atlas chưa mở IP `0.0.0.0/0`, hoặc sai mật khẩu trong `MONGO_URI` (mật khẩu có ký tự đặc biệt phải URL-encode). |
| Trình duyệt báo lỗi **CORS** | `CLIENT_URL` ở backend phải **trùng tuyệt đối** origin frontend, không dấu `/` cuối. |
| Frontend vẫn gọi `localhost:3000` | `VITE_API_BASE_URL` chưa set lúc build → set env rồi **Clear build cache & deploy** lại frontend. |
| F5 vào `/pricing` bị **404** | Chưa thêm luật Rewrite `/*` → `/index.html` (Phần 4.5). |
| Webhook SePay không kích hoạt gói | URL webhook sai, hoặc `SEPAY_WEBHOOK_API_KEY` không khớp, hoặc nội dung CK không chứa `POSTA...`. |
