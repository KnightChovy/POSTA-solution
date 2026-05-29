# PROMPT_PLAYBOOK.md — Admin Satellite

> Khuôn dựng prompt chuẩn để yêu cầu hiện thực / tối ưu một chức năng.
> **Mục đích:** mỗi lần user yêu cầu một feature, AI agent dựng prompt theo đúng cấu trúc dưới đây để output luôn nhất quán, an toàn và đúng convention dự án.
>
> File này BỔ TRỢ cho `admin-backend/AGENTS.md` và `SatWeb/AGENTS.md` — các AGENTS.md định nghĩa *luật code*, file này định nghĩa *cách dựng prompt & quy trình làm việc*. Khi mâu thuẫn → AGENTS.md thắng.

---

## ⭐ Nguyên tắc cốt lõi #0 — Clean, đơn giản, dễ hiểu

> Đây là dự án **môn học (EXE101)**. Người đọc code là giảng viên/hội đồng và sinh viên khác → **tính dễ hiểu quan trọng hơn sự "thông minh" hay tối ưu cực đại** (chỉ sau tính đúng & bảo mật).

- **Rõ ràng hơn ngắn-gọn-khó-hiểu.** Tránh abstraction/metaprogramming không cần thiết.
- **Hàm ngắn, một nhiệm vụ.** Tên tự giải thích.
- **YAGNI / không tối ưu sớm.** Không thêm design pattern, cache, xử lý trường hợp chưa cần.
- **Comment giải thích "tại sao"** cho đoạn không hiển nhiên (nhất là bảo mật); KHÔNG comment điều hiển nhiên.
- **Nhất quán với code xung quanh** — giữ đúng style phân tầng và cách đặt tên file/biến hiện có.

---

## 1. Anatomy — các mục bắt buộc của một prompt chuẩn

| # | Mục | Nội dung |
|---|-----|----------|
| 1 | **Bối cảnh** | Package nào (`admin-backend` hay `SatWeb`), ràng buộc AGENTS.md tương ứng, liệt kê file liên quan kèm `file:line`. |
| 2 | **Mục tiêu** | 1–2 câu kết quả mong muốn. Nêu rõ có/không được phá contract API `/api/*`. |
| 3 | **Yêu cầu bắt buộc** | Correctness + security. Với code đã có: trích lỗi thật kèm `file:line`. |
| 4 | **Yêu cầu chất lượng** | Clean (§0), giữ message tiếng Việt, lọc `status: ACTIVE`, đi qua p-queue (backend) / qua store (frontend)... |
| 5 | **Quy trình** | Đọc trước → báo cáo → kế hoạch theo ưu tiên → chờ duyệt → sửa. |
| 6 | **Định nghĩa hoàn thành (DoD)** | Checklist (xem §3). |
| 7 | **Câu kết điều khiển luồng** | Nêu rõ bắt đầu từ bước nào và CHƯA làm gì cho tới khi được duyệt. |

> **Quy tắc vàng:** nếu code đã tồn tại, BẮT BUỘC đọc nó trước và trích lỗi thật kèm `file:line` — không nhồi lời giả định.

---

## 2. Quy trình 2 pha (mặc định)

```
PHA 1 — RÀ SOÁT & KẾ HOẠCH
  • Đọc file liên quan + model/store + config
  • Báo cáo lỗi/điểm cải thiện (đánh số, kèm file:line)
  • Đề xuất kế hoạch theo ưu tiên (security > correctness > tối ưu)
  • HỎI user nếu chạm contract API hoặc schema dữ liệu
  • [CHỜ DUYỆT]

PHA 2 — THỰC THI
  • Sửa theo kế hoạch đã duyệt
  • Cập nhật cả 2 đầu nếu đổi contract /api/*
  • Chạy DoD (§3)
```
Chỉ gộp 1 pha (làm thẳng) khi user nói rõ "làm luôn / tự quyết" hoặc feature nhỏ rõ ràng.

---

## 3. Definition of Done

**Chung:**
- [ ] Clean & dễ hiểu (§0): hàm ngắn-một-nhiệm-vụ, tên tự giải thích, comment "tại sao" cho đoạn khó.
- [ ] Không hard-code secret/URL; đọc qua env.
- [ ] Giữ message/UI tiếng Việt.
- [ ] Commit theo Conventional Commits, scope đúng (xem AGENTS.md).
- [ ] Nếu đổi contract `/api/*` → cập nhật **cả** `admin-backend` và `SatWeb`.

**Backend (`admin-backend`):**
- [ ] App `npm start` không lỗi runtime.
- [ ] Logic tái dùng ở `utils/`, gọi API ngoài ở `apis/`; controller không phình.
- [ ] Truy vấn vệ tinh đã lọc `status: 'ACTIVE'`; gửi nhiều site đi qua p-queue.
- [ ] Route mới đã đăng ký trong `src/routes/index.js`.

**Frontend (`SatWeb`):**
- [ ] `npm run lint` sạch (0 warning).
- [ ] State/API trong Zustand store, component không gọi axios trực tiếp.
- [ ] Dùng lại `components/ui/`, icon lucide (không emoji), phần tử click có `cursor-pointer` + focus state.

---

## 4. Mẫu prompt rút gọn (copy-paste)

```
# NHIỆM VỤ: <hiện thực | tối ưu> feature <tên> — package <admin-backend | SatWeb>

## Bối cảnh
Tuân thủ <admin-backend/AGENTS.md | SatWeb/AGENTS.md>.
File liên quan: <liệt kê file:line>.

## Mục tiêu
<1–2 câu>. Contract API /api/*: <giữ nguyên | được đổi, nêu rõ>.

## Yêu cầu bắt buộc (correctness + security)
<từ AGENTS.md + lỗi thật trích từ code kèm file:line>

## Yêu cầu chất lượng
<clean §0, message tiếng Việt, lọc ACTIVE / qua p-queue / qua store...>

## Quy trình
1. Đọc code + model/store + config, báo cáo lỗi (đánh số, file:line).
2. Đề xuất kế hoạch ưu tiên; hỏi nếu chạm contract/schema.
3. Chờ duyệt rồi mới sửa; đổi contract → cập nhật cả 2 đầu.

## Definition of Done
<copy §3 phần phù hợp>

Bắt đầu từ bước 1 (rà soát & báo cáo), CHƯA sửa code cho tới khi tôi duyệt.
```

---

## 5. Quy ước tự áp cho AI agent

1. **Luôn đọc trước khi đề xuất** — không dựng "Yêu cầu bắt buộc" từ giả định khi code đã tồn tại.
2. **Trích `file:line`** cho mọi vấn đề nêu ra để user kiểm chứng nhanh.
3. **Ưu tiên security** cho mọi feature chạm tới credential WordPress, login, dữ liệu vệ tinh.
4. **Ưu tiên clean & dễ hiểu (§0)** — chọn giải pháp đơn giản, rõ ràng thay vì "thông minh"/tối ưu sớm.
5. **Không phá contract `/api/*`** khi không được phép; cần đổi → nêu rõ và xin xác nhận, sửa đồng bộ 2 package.
6. **Cập nhật file này** khi rút ra convention prompt mới có giá trị tái sử dụng.
```
