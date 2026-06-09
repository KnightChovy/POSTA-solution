# Social Auto-Publish (n8n + WordPress + AI)

Pipeline đăng bài tự động lên mạng xã hội, mỗi nơi một bản **paraphrase** riêng để tránh
trùng nội dung (duplicate content / phạt SEO). Hiện hỗ trợ **Twitter/X** đầu tiên.

```
[Bạn trigger] → n8n Webhook → HTTP POST /api/social/paraphrase (Express + AI)
                                  → node Twitter/X đăng tweet → trả kết quả
```

- **Express** (`/api/social/paraphrase`) = bộ não AI, viết lại nội dung theo từng platform.
- **n8n** = điều phối + đăng social (node X tự lo OAuth).
- **Docker** = service `n8n` trong `docker-compose.yml`.

---

## 1. Chạy hạ tầng

```bash
# Backend Express (chạy trên host, port 3000)
cd admin-backend
npm install
npm start

# n8n (Docker) — chạy ở thư mục có docker-compose.yml
docker compose up -d n8n
```

- n8n UI: http://localhost:5678 (user/pass mặc định `admin` / `changeme` —
  đổi qua biến `N8N_USER` / `N8N_PASSWORD` trong `admin-backend/.env`).
- Trong workflow, backend được gọi qua `http://host.docker.internal:3000`
  (vì Express chạy trên host, không nằm trong Docker).

---

## 2. Lấy Twitter/X API keys (bắt buộc, làm 1 lần)

1. Vào https://developer.x.com → **Sign up** Free tier (Free cho phép ~1.500 post/tháng).
2. Tạo **Project** → tạo **App** bên trong project.
3. Trong App → **User authentication settings** → **Set up**:
   - **App permissions**: chọn **Read and write** (bắt buộc, nếu để Read sẽ không đăng được).
   - **Type of App**: Web App / Automated App.
   - **Callback URL**: `http://localhost:5678/rest/oauth2-credential/callback`
   - **Website URL**: điền tạm domain của bạn (vd `http://localhost:5678`).
4. Sang tab **Keys and tokens**, lấy:
   - **OAuth 2.0 Client ID** và **Client Secret** (dùng cho n8n — khuyến nghị).
   - (Tuỳ chọn) API Key/Secret + Access Token/Secret nếu dùng OAuth 1.0a.

> ⚠️ Nếu bạn đổi App permissions sang "Read and write" **sau khi** đã tạo token,
> phải **regenerate** Access Token thì quyền ghi mới có hiệu lực.

---

## 3. Kết nối Twitter trong n8n

1. n8n UI → **Credentials** → **New** → tìm **Twitter/X OAuth2 API**.
2. Dán **Client ID** + **Client Secret** ở bước 2.
3. Bấm **Connect my account** → đăng nhập X → cho phép.
4. Lưu credential.

---

## 4. Import & chạy workflow

1. n8n UI → **Workflows** → **Import from File** → chọn
   `admin-backend/n8n/social-publish.workflow.json`.
2. Mở node **Post to Twitter/X** → chọn credential vừa tạo
   (file import để placeholder `REPLACE_WITH_YOUR_CREDENTIAL_ID`).
3. Bấm **Active** để bật workflow (webhook production), hoặc dùng **Test workflow**
   với URL webhook test.
4. Lấy URL webhook ở node **Manual Trigger** — dạng:
   `http://localhost:5678/webhook/social-publish`

### Trigger thử (PowerShell)

```powershell
$body = @{
  content  = "<h2>Diamond Sky</h2><p>Dự án căn hộ cao cấp tại Thủ Đức...</p>"
  platform = "twitter"
  language = "vi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/social-publish" `
  -Method Post -ContentType "application/json" -Body $body
```

Kết quả mong đợi: `{ "status": "published", "platform": "twitter", "tweetId": "...", "text": "..." }`

### Test riêng tầng AI (không cần Twitter)

```powershell
$body = @{ content = "Diamond Sky là dự án căn hộ cao cấp tại Thủ Đức"; platform = "twitter"; language = "vi" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/social/paraphrase" -Method Post -ContentType "application/json" -Body $body
```

---

## 5. Mở rộng sang nền tảng khác

`paraphraseForSocial` đã hỗ trợ sẵn `facebook`, `linkedin`, `threads`
(`src/utils/createVariations.js` → `SOCIAL_PLATFORMS`, mỗi platform có giới hạn ký tự riêng).
Để đăng nền tảng mới: thêm node tương ứng trong n8n và truyền `platform` khác khi gọi webhook.
