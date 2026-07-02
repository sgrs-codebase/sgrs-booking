# TÀI LIỆU HỆ THỐNG: TOUR BOOKING & SLOT MANAGEMENT

Tài liệu này tổng hợp các luồng dữ liệu (Data Flow), logic nghiệp vụ và cấu trúc hệ thống quản lý slot cho website Saigon River Star.

---

## 1. KIẾN TRÚC DỮ LIỆU (AIRTABLE)

Hệ thống sử dụng cơ chế **Dynamic Calculation** (tính toán động) để quản lý slot, không lưu số lượng slot đã đặt vào database để tránh sai lệch.

### 2.1. Table: `TourDates` (Cấu hình ngày)
Dùng để override (ghi đè) cấu hình mặc định của từng ngày tour.
- `tourId`: ID của tour (khớp với table Tours).
- `date`: Ngày tour (YYYY-MM-DD).
- `date_type`: `pre-set` (Luôn bắt thanh toán) hoặc `default` (Tự động phân luồng).
- `total_slots`: Tổng số chỗ cho ngày đó (Mặc định: 35).

### 2.2. Table: `Orders` (Dữ liệu thực tế)
- `Adults`, `Children`, `Infants`: Số lượng khách cụ thể (dạng Number).
- `booking_status`: `awaiting_confirmation`, `confirmed`, `cancelled`.
- `payment_status`: `pending`, `paid`, `failed`.
- `created_at` (Created Time): Dùng để tính toán timeout 30 phút cho các đơn hàng `pending`.

---

## 2. LUỒNG DỮ LIỆU CHÍNH (DATA FLOW)

### 2.1. Quy trình Kiểm tra Slot (Availability Check)
Mỗi khi khách chọn ngày trên UI, hệ thống thực hiện:
1. Truy vấn `TourDates` để lấy `total_slots` (Nếu không có, mặc định = 35).
2. Truy vấn `Orders` lấy tất cả đơn hàng cùng ngày có:
   - `payment_status = 'paid'`
   - **HOẶC** (`payment_status = 'pending'` **VÀ** `created_at` trong vòng 30 phút qua).
3. **Công thức:** `Available Slots = Total Slots - Sum(Adults + Children) của các đơn thỏa mãn`.

### 2.2. Quy trình Phân luồng Booking (Flow Decision)
Khi khách bấm "Thanh toán", hệ thống quyết định luồng dựa trên:
- **Luồng Awaiting Confirmation (Chờ xác nhận):**
  - Ngày là `default`.
  - **VÀ** Là booking đầu tiên của ngày đó.
  - **VÀ** Số người lớn (Adults) < 6.
  - *Kết quả:* Tạo order -> Chuyển hướng tới trang Success (Awaiting UI) -> Gửi email xác nhận yêu cầu.
- **Luồng Payment (Thanh toán ngay):**
  - Ngày là `pre-set`.
  - **HOẶC** Đã có ít nhất 1 booking khác trong ngày.
  - **HOẶC** Số người lớn >= 6.
  - *Kết quả:* Tạo order -> Chuyển hướng sang OnePay.

### 2.3. Quy trình Callback (IPN)
Sau khi khách thanh toán tại OnePay:
1. OnePay gọi về `/api/ipn`.
2. Hệ thống verify chữ ký bảo mật.
3. Nếu thành công:
   - Cập nhật `payment_status = 'paid'`.
   - Cập nhật `booking_status = 'confirmed'`.
   - Gửi email Receipt chính thức.

---

## 3. CƠ CHẾ BẢO VỆ & HIỆU NĂNG (AIRTABLE SAFE)

Do Airtable giới hạn 5 requests/giây, hệ thống triển khai lớp wrapper `airtableSafe`:
1. **Rate Limiting:** Sử dụng `p-queue` để giới hạn tối đa 4 concurrent requests.
2. **Micro-caching:** Cache kết quả đọc (Read) trong **5 giây** để phục vụ nhiều người dùng cùng lúc mà không gọi API liên tục.
3. **Retry Logic:** Tự động thử lại (Retry) với độ trễ tăng dần (Exponential Backoff) nếu nhận lỗi 429 từ Airtable.

---

## 4. CÔNG CỤ HỖ TRỢ TEST (DEVELOPER ONLY)

Trong file `BookingForm.tsx`, một nút **"Autofill Test Data"** đã được thêm vào Bước 3:
- Tự động điền thông tin hợp lệ cho tất cả khách hàng.
- `lastName` luôn là "Tester" để vượt qua validation.
- Giúp test nhanh các kịch bản đặt 6+ khách hoặc chặn slot.

---

## 5. CÁC TRẠNG THÁI TRÊN UI

- **Trang Success:** Tự động đổi Icon (Tích xanh / Đồng hồ) và nội dung dựa trên `PaymentStatus`.
- **Trang Failed:** Thông báo khách hàng rằng slot vẫn được giữ trong 30 phút để họ yên tâm đặt lại.
