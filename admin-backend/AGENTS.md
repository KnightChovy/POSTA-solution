# AGENTS.md — Admin Satellite · Backend

> **Admin Satellite** — Công cụ đăng bài hàng loạt lên nhiều website WordPress "vệ tinh" (quy trình SEO/PBN).
> Stack: **Node.js + Express + MongoDB + Mongoose** (CommonJS, không TypeScript).

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

Backend là RESTful API viết bằng Node.js + Express (CommonJS). Dữ liệu lưu ở **MongoDB** thao tác qua **Mongoose ODM**. Nhiệm vụ cốt lõi: nhận một bài viết do editor soạn, rồi **fan-out đăng lên tất cả website vệ tinh đang ACTIVE** qua WordPress REST API; với mỗi site (trừ site đầu tiên) nội dung được **viết lại bằng OpenAI** để tránh trùng lặp (duplicate content). Chuỗi gửi được điều phối bằng hàng đợi giới hạn tốc độ (**p-queue**).

UI message và comment trong code dùng **tiếng Việt** — giữ nguyên phong cách này.

---

## 2. Cấu trúc thư mục

```
src/
├── index.js                       # Entry point: cấu hình Express, CORS, session, kết nối Mongo, mount routes
│
├── apis/
│   └── post.js                    # Gọi WordPress REST API (POST /wp-json/wp/v2/posts) với Basic Auth
│
├── app/
│   ├── controllers/               # Xử lý Request/Response cho từng resource
│   │   ├── postController.js       # ⭐ Trung tâm: tạo post + luồng fan-out + repost
│   │   ├── satelliteController.js   # CRUD vệ tinh (soft-delete), thống kê tiến độ
│   │   ├── categoryController.js
│   │   ├── imageController.js       # Lưu ảnh upload → tạo Post doc
│   │   └── loginController.js       # Đăng nhập bằng credential trong .env
│   └── models/                    # Mongoose schema (tên model viết thường: 'post', 'satellite', 'category')
│       ├── Post.js
│       ├── Satellite.js
│       └── Category.js
│
├── config/
│   ├── db/mongoDB.js              # Kết nối MongoDB qua MONGO_URI
│   ├── file/upload.js            # Cấu hình multer (lưu ảnh vào src/uploads/posts/, max 10MB, jpg/png)
│   └── queue/pqueue.js           # Khởi tạo p-queue (concurrency 20, 100 req/phút)
│
├── middleware/
│   └── AuthenticateJWT.js         # Middleware verify JWT (⚠️ hiện CHƯA gắn vào route nào)
│
├── routes/                        # Định tuyến, gom trong index.js dưới /api/*
│   ├── index.js
│   ├── post.js                    # /api/post
│   ├── satellite.js               # /api/satellite
│   ├── category.js                # /api/category
│   ├── login.js                   # /api/auth/login
│   └── image.js                   # /api/image
│
├── utils/
│   ├── createVariations.js        # Gọi OpenAI gpt-4o-mini viết lại nội dung HTML
│   ├── postUtils.js               # replaceImagesInContent: thay <img src> theo ảnh của từng site
│   ├── satelliteUtils.js          # convertErrorSatelliteToUrls: map satelliteId → url khi trả về client
│   └── apiUtils.js                # createBasicAuthHeader
│
└── uploads/posts/                 # Ảnh upload (phục vụ tĩnh qua /uploads)
```

---

## 3. Cài đặt & chạy Dev

```bash
npm install
npm start          # nodemon --inspect src/index.js (hot-reload + bật debugger)
```

- **Không có** bước build, **không có** linter, **không có** test runner (`npm test` chỉ là placeholder, exit 1). Đừng giả định có `npm run build`/`npm run lint`/`npm test`.
- Yêu cầu MongoDB đang chạy và file `.env` hợp lệ (xem §8).

---

## 4. Quy ước code

- **Clean, đơn giản, dễ hiểu (ưu tiên hàng đầu, chỉ sau tính đúng & bảo mật):** đây là dự án môn học. Hàm ngắn, một nhiệm vụ; tên tự giải thích; không thêm abstraction/design pattern/tối ưu sớm khi chưa cần (YAGNI); ưu tiên giải pháp thư viện chuẩn quen thuộc. Comment giải thích "tại sao" cho đoạn không hiển nhiên (nhất là phần bảo mật), không comment điều hiển nhiên.
- **Module system:** CommonJS — luôn `require` / `module.exports`, **không** dùng `import`/`export`.
- **Async:** dùng `async/await`, tránh `.then()` chaining (trừ chỗ đã có sẵn như `pushToSatelliteWebsite`).
- **Truy cập DB:** mọi thao tác phải qua Mongoose model trong `src/app/models/`, không tự tạo connection mới.
- **Xử lý lỗi:** giữ đúng phong cách hiện tại — mỗi controller bọc `try/catch` riêng và trả `res.status(...).json(...)`. **Không** thêm global error middleware (dự án chưa có và không cần).
- **Message trả về client:** tiếng Việt, ngắn gọn (vd `"Website vệ tinh đã tồn tại"`).
- **Tên file:** controller dạng `<resource>Controller.js`, model PascalCase `<Resource>.js`, route trùng tên resource.
- **Soft-delete:** không xoá cứng vệ tinh — set `status: 'INACTIVE'`; mọi truy vấn nghiệp vụ phải lọc `status: 'ACTIVE'`.
- **Bí mật & cấu hình:** đọc qua `process.env` (dotenv), không hard-code URL/khóa/credential.

---

## 5. Quy ước Git & Commit

Theo chuẩn **Conventional Commits**:
```
<type>(<scope>): <mô tả ngắn>
```
**Types:** `feat` | `fix` | `refactor` | `docs` | `chore` | `style`
**Scope** = resource/khu vực: `post`, `satellite`, `category`, `auth`, `image`, `queue`, `db`

*Ví dụ:*
- `feat(post): thêm repost cho các vệ tinh lỗi`
- `fix(satellite): lọc status ACTIVE khi đếm tổng vệ tinh`
- `refactor(queue): tách listener completed/error ra hàm riêng`

---

## 6. Kiến trúc & luồng dữ liệu

### Luồng đăng bài (publish pipeline) — đọc kỹ trước khi sửa logic post

```
POST /api/post (multipart: images + values JSON + siteInfoWithImageUrl)
  → createNewPost  [postController.js]
      → saveImageToServer    [imageController.js]  lưu ảnh (multer) + tạo Post doc
      → đếm totalSatellite (status ACTIVE)
      → pushToSatelliteWebsite  [postController.js]
            → lấy tất cả satellite ACTIVE
            → với mỗi site: enqueue task lên p-queue  [config/queue/pqueue.js]
                  ├─ replaceImagesInContent  [utils/postUtils.js]  thay <img src> theo ảnh site
                  ├─ (từ site thứ 2) createVariations  [utils/createVariations.js]  OpenAI viết lại prose, giữ nguyên HTML tag
                  └─ postToSatellite  [apis/post.js]  POST {url}/wp-json/wp/v2/posts (Basic Auth của site)
            → queue.on('completed') → $addToSet postedSatellite (link thành công)
            → lỗi → $addToSet errorSatellite { satelliteId, errorCode }
      → cập nhật successfulRate = progress / totalSatellite
```

- **Repost lỗi:** `POST /api/post/repost/:id` → `repostToErrorSatellitesOnePost` chạy lại pipeline chỉ với các site còn lỗi (`isRepost=true`, dùng ảnh host trên server thay vì ảnh theo site).
- **Theo dõi tiến độ:** `GET /api/post/track-progress?postTitle=...` trả `postedSatellite.length / totalSatellite`.

### Model (lưu ý)
- Tên model Mongoose viết thường: `'post'`, `'satellite'`, `'category'`.
- `Satellite` lưu **credential WordPress theo từng site** (`username` + application `password`), không phải dùng chung.
- `errorSatellite` lưu `satelliteId` (ObjectId) + `errorCode` (Number); khi trả client phải map sang URL bằng `convertErrorSatelliteToUrls`.
- `totalSatellite` được chụp (snapshot) lúc tạo post và tính lại khi repost.

### Auth (hiện trạng)
Đăng nhập (`loginController.js`) chỉ so khớp `APP_USERNAME`/`APP_PASSWORD` trong `.env` và trả cờ `error: true/false` — **không phát hành JWT**. Middleware `AuthenticateJWT.js` có sẵn nhưng **chưa được gắn** vào route nào. Nếu thêm bảo vệ route thật, hãy nối lại middleware này thay vì viết mới.

---

## 7. Hướng dẫn cho AI Agent

> Đọc và tuân thủ quy trình + mẫu code sau trước khi sinh/sửa code backend.

### Nguyên tắc bắt buộc

1. **Đọc code trước khi đề xuất.** Với phần đã tồn tại, phải đọc và trích lỗi thật kèm `file:line`, không nhồi giả định.
2. **Tách biệt resource:** controller xử lý request/response + điều phối; logic tái dùng tách sang `utils/`; gọi API ngoài tách sang `apis/`.
3. **Lọc `status: 'ACTIVE'`** ở mọi truy vấn vệ tinh phục vụ nghiệp vụ (đăng bài, đếm tổng, repost).
4. **Đi qua p-queue** cho mọi thao tác gửi nhiều site song song — không tự bắn axios trong vòng lặp đồng bộ (sẽ vỡ rate-limit của WordPress).
5. **Giữ contract API & message tiếng Việt** trừ khi user đồng ý đổi.
6. **Không thêm phụ thuộc nặng** (TypeScript, Joi, Prisma, framework validate...) — dự án cố tình giữ tối giản. Muốn thêm phải hỏi.

### Template: Controller mới

```javascript
const Model = require("../models/Model");

const createSomething = async (req, res) => {
  try {
    const { field } = req.body;
    if (!field) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    const doc = await Model.create({ field });
    return res.status(201).json({ doc });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { createSomething };
```

### Template: Route mới

```javascript
const express = require("express");
const router = express.Router();
const { createSomething } = require("../app/controllers/somethingController");

router.post("/", createSomething);

module.exports = router;
// rồi đăng ký trong src/routes/index.js: app.use("/api/something", something)
```

### Checklist trước khi commit

- [ ] App khởi động được (`npm start`) không lỗi runtime.
- [ ] Logic tái dùng đặt ở `utils/`, gọi API ngoài đặt ở `apis/`; controller không phình logic.
- [ ] Truy vấn vệ tinh đã lọc `status: 'ACTIVE'` ở đúng chỗ.
- [ ] Route mới đã đăng ký trong `src/routes/index.js`.
- [ ] Không hard-code secret/URL; đọc qua `process.env`.
- [ ] Commit theo Conventional Commits, scope đúng resource.

---

## 8. Biến môi trường

Khai báo trong `admin-backend/.env` (không commit).

```bash
MONGO_URI=mongodb://127.0.0.1:27017/admin_seo   # Chuỗi kết nối MongoDB
PORT=3000                                        # Cổng API
CLIENT_URL=http://localhost:5173                 # Origin được CORS cho phép (URL của SatWeb)
JWT_SECRET=...                                   # Khóa ký JWT (cho AuthenticateJWT khi được dùng)
SESSION_SECRET_KEY=...                           # Khóa express-session
APP_USERNAME=...                                 # Tài khoản admin duy nhất (login)
APP_PASSWORD=...                                 # Mật khẩu admin
OPENAI_API_KEY=...                               # Khóa OpenAI cho createVariations.js
SERVER_URL=...                                   # Base URL công khai của server (build URL ảnh tuyệt đối khi repost)

# Gửi email xác thực / reset mật khẩu (mailer.js đọc cả SMTP_* lẫn EMAIL_*)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=...                                # tài khoản SMTP (Gmail App Password)
SMTP_PASSWORD=...
EMAIL_FROM=...                                   # địa chỉ hiển thị người gửi

# SePay — thanh toán chuyển khoản (paymentController.js). Thiếu thì luồng mua gói vẫn
# tạo giao dịch pending nhưng không có QR; dùng dev-confirm để test ở môi trường dev.
SEPAY_WEBHOOK_API_KEY=...                         # khớp header "Authorization: Apikey ..." của webhook
SEPAY_ACCOUNT_NUMBER=...                          # số tài khoản nhận tiền (dựng link QR VietQR)
SEPAY_BANK_CODE=...                               # mã ngân hàng cho VietQR
```

### Hệ thống gói dịch vụ (Plan) — đọc trước khi đụng tới gói/doanh thu
- **`Plan` model** (`models/Plan.js`) là nguồn chuẩn của gói; `key` (slug) liên kết với `User.plan` và `Transaction.plan` (không dùng ObjectId để giữ tương thích). Seed 4 gói mặc định qua `config/db/seedPlans.js` khi collection rỗng.
- **`utils/plans.js`** đọc giá/nhãn động từ DB (`getPlanMap`/`planPrice`/`planLabel` — **async**, có cache 30s; gọi `invalidatePlanCache()` sau khi admin sửa gói).
- **Khóa gói:** gói đã có `Transaction` tham chiếu `key` thì `PATCH /api/admin/plans/:id` trả **409** — chỉ được `clone`.
- **Mua gói** (`planController.purchasePlan`) tạo `Transaction` **pending** + mã `reference`; kích hoạt khi `paymentController` nhận webhook SePay (hoặc `dev-confirm` ở dev). Gói giá 0 kích hoạt ngay. Doanh thu (`getStats`) chỉ tính `status:'paid'`.
- **Usage** (count & display): `Satellite.owner`/`Post.owner` set khi tạo; `User.usage.aiCount` tăng mỗi bài; `GET /api/plans/me/subscription` trả hạn mức + mức dùng.

⚠️ **Bảo mật:** hiện `.env` chứa secret thật nằm trong cây làm việc — không echo giá trị ra code/log/commit. Nếu `.env` đã lỡ vào git history, nên rotate khóa và bổ sung `.gitignore`.

---

## 9. Điểm "lệch" cần biết (đã xác minh)

- **`OPENAI_API_KEY` vs `.env`:** [createVariations.js](admin-backend/src/utils/createVariations.js) đọc `process.env.OPENAI_API_KEY`, nhưng `.env` mẫu lại chỉ có `DEEPSEEK_API_KEY` — biến lệch tên, tính năng viết lại sẽ fail nếu không set đúng `OPENAI_API_KEY`. Kiểm tra trước khi dựa vào tính năng variation.
- **JWT chưa được dùng:** middleware `AuthenticateJWT.js` tồn tại nhưng không route nào gắn; login không trả token. Auth thực tế chỉ là so khớp credential `.env`.
- **`WP_USERNAME`/`WP_PASSWORD` trong `.env` không được dùng** — credential WordPress lấy theo từng `Satellite` trong DB, không phải biến env toàn cục.
- **`SERVER_URL` bắt buộc cho repost & getErrorPost:** các hàm này build URL ảnh `${process.env.SERVER_URL}/${img}`; thiếu biến này ảnh sẽ hỏng.
- **`pqueue.js` khởi tạo bất đồng bộ:** queue được tạo trong IIFE `async`; gọi `getQueue()` quá sớm sẽ ném "Queue is not initialized yet".
