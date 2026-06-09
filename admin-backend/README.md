# Admin Backend Overview

Backend này được xây dựng bằng **Node.js + Express** và dùng **MongoDB/Mongoose** làm lớp lưu trữ dữ liệu. Mục tiêu chính của hệ thống là cung cấp các API cho phần admin của dự án, bao gồm xác thực, quản lý bài viết, danh mục, hình ảnh và luồng xử lý trạng thái bài đăng.

## Công Nghệ Sử Dụng

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication/session:** `express-session`, `cookie-parser`, `jsonwebtoken`
- **Validation:** `express-validator`
- **File upload:** `multer`, `filepond`
- **HTTP client:** `axios`
- **CORS:** `cors`
- **Process dev:** `nodemon`
- **Khác:** `dotenv`, `morgan`, `openai`, `p-queue`

## Kiến Trúc Tổng Quan

Backend này đi theo hướng **module hóa theo route và controller**. Luồng chính hiện tại như sau:

1. `src/index.js` khởi tạo Express app.
2. Kết nối MongoDB thông qua `src/config/db/mongoDB.js`.
3. Gắn các middleware chung như parse JSON, cookie, session, CORS và static files.
4. Mount các nhóm route trong `src/routes/`.
5. Mỗi route chuyển tiếp sang controller tương ứng trong `src/app/controllers/`.
6. Controller xử lý nghiệp vụ và làm việc với model hoặc tiện ích liên quan.

Kiến trúc này phù hợp với backend admin quy mô nhỏ đến trung bình vì dễ tách chức năng, dễ bảo trì và dễ mở rộng thêm module mới.

## Cấu Trúc Thư Mục Chính

- `src/index.js`: entrypoint của server.
- `src/routes/`: định nghĩa các nhóm API theo domain.
- `src/app/controllers/`: xử lý logic nghiệp vụ.
- `src/app/models/`: định nghĩa model của MongoDB.
- `src/config/db/`: cấu hình và kết nối database.
- `src/config/file/`: cấu hình upload file.
- `src/middleware/`: middleware dùng chung, ví dụ xác thực JWT.
- `src/utils/`: các hàm hỗ trợ và tiện ích nghiệp vụ.
- `src/uploads/`: nơi lưu file upload.
- `src/public/`: static assets được phục vụ trực tiếp.

## Luồng Khởi Tạo Server

Trong `src/index.js`, server thực hiện các bước chính sau:

- load biến môi trường từ `.env`
- kết nối MongoDB
- bật `cookie-parser`
- phục vụ file tĩnh tại `/uploads`
- parse request body bằng `body-parser` và `express.json()`
- cấu hình CORS để cho phép frontend truy cập theo `CLIENT_URL`
- xử lý request `OPTIONS`
- cấu hình session bằng `express-session`
- mount các route từ `src/routes/index.js`
- chạy server trên `PORT` hoặc mặc định `3000`

## Danh Sách API Chính

Các route hiện được gom theo module:

- `/api/satellite`
- `/api/category`
- `/api/auth/login`
- `/api/image`
- `/api/post`

### Ghi chú một số route

- `POST /api/auth/login`: đăng nhập admin.
- `GET /api/post`: lấy danh sách bài viết.
- `POST /api/post`: tạo bài viết mới, hỗ trợ upload nhiều ảnh.
- `POST /api/post/repost/:id`: đăng lại bài viết lỗi.
- `GET /api/post/track-progress`: theo dõi tiến độ xử lý bài viết.
- `GET /api/category`: lấy danh sách danh mục.
- `POST /api/category`: tạo danh mục mới.

## Middleware Và Hạ Tầng Chung

Backend đang dùng một số lớp hạ tầng chung sau:

- **CORS**: cho phép frontend gọi API với credentials.
- **Session**: lưu trạng thái phiên đăng nhập.
- **Cookie parser**: đọc cookie từ request.
- **Static files**: phục vụ file trong `public` và `uploads`.
- **Upload handling**: `multer` được dùng để xử lý ảnh tải lên.
- **JWT middleware**: trong `src/middleware/AuthenticateJWT.js` để bảo vệ các API cần xác thực.

## Biến Môi Trường Cần Có

Backend phụ thuộc vào một số biến môi trường, thường được khai báo trong file `.env`:

- `PORT`: cổng chạy server.
- `CLIENT_URL`: domain frontend được phép gọi API.
- `MONGO_URI`: chuỗi kết nối MongoDB.
- `SESSION_SECRET_KEY`: secret cho session.

## Chạy Database Bằng Docker Compose

Máy dev không cài MongoDB trực tiếp — database chạy trong container Docker. File `docker-compose.yml` đã khai báo sẵn service `mongo` (image `mongo:7`, port `27017`, volume `posta-mongo-data` để giữ data).

**Yêu cầu:** Docker Desktop đang chạy.

Trong thư mục `admin-backend`:

```bash
# Bật MongoDB (chạy nền)
docker compose up -d

# Tắt MongoDB
docker compose stop

# Xem log
docker compose logs -f mongo
```

Sau khi container chạy, MongoDB sẵn sàng tại `mongodb://127.0.0.1:27017`. Đảm bảo `MONGO_URI` trong `.env` trỏ tới địa chỉ này, ví dụ:

```env
MONGO_URI=mongodb://127.0.0.1:27017/admin_seo
```

Kiểm tra nhanh kết nối (PowerShell):

```powershell
Test-NetConnection 127.0.0.1 -Port 27017
```

> Lưu ý: Mỗi lần khởi động lại máy cần mở Docker Desktop trước rồi mới `docker compose up -d`. Nếu backend báo `Connect failed!!!` thì phần lớn là do container chưa chạy chứ không phải lỗi code.

## Cách Chạy

Theo `package.json`, script phát triển hiện tại là:

```bash
npm run start
```

Script này dùng `nodemon` để chạy `src/index.js` trong chế độ theo dõi thay đổi.

## Kết Luận

Tóm lại, backend admin này là một ứng dụng **Express REST API** kết hợp **MongoDB/Mongoose**, tổ chức theo hướng **route -> controller -> model**. Cấu trúc hiện tại khá rõ ràng cho việc mở rộng thêm các module như xác thực, quản lý nội dung, upload file và xử lý tác vụ nền.
