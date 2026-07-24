# HÀNH TRÌNH PHÁT TRIỂN & BÀN GIAO CÔNG VIỆC (HANDOFF SUMMARY)

## 1. Bối cảnh dự án (Context)
- **Project**: Hệ thống booking tour du thuyền Saigon River Star.
- **Tech stack**: Next.js 15 (App Router), TypeScript, Airtable API, SCSS.
- **Mục tiêu chính**: Nâng cấp hệ thống quản lý chỗ trống (Slot Management) và Redesign toàn bộ giao diện Step 1 (Date & Time) theo phong cách Cyber-Clean/Swiss Style.

## 2. Các công việc đã hoàn thành (Completed)
- **Redesign Calendar UI (Modal V2)**:
    - Giao diện Modal lớn, chia 2 cột: Trái (Lịch chọn ngày), Phải (Thông tin chi tiết ngày chọn).
    - Highlight các ngày có tour sẵn (`has-tour`) từ dữ liệu Airtable.
    - Tích hợp danh sách **Time Slots** có thể nhấn chọn, đổi màu border khi được active.
    - Hiển thị số ghế trống (Seats available) theo thời gian thực cho từng khung giờ.
- **Hệ thống Slot chuyên nghiệp (Phương án 2)**:
    - Đã cập nhật Schema Airtable: Thêm field `departure_time` vào bảng `TourDates` và `DepartureTime` vào bảng `Orders`.
    - Cập nhật Helper `lib/airtable.ts`: Các hàm `getTourDate`, `getOrdersByTourAndDate`, `calculateAvailableSlots` giờ đây hỗ trợ tham số `time` để tính slot chính xác cho từng chuyến trong ngày.
- **Tinh chỉnh UI/UX**:
    - Điều chỉnh chiều cao nút "Continue" (`btn-primary`) về mức **44px** (vừa vặn, không quá bự).
    - Cập nhật Trigger bar (Date & Time) và các hàng chọn khách đồng bộ ở mức **56px**.
    - Di chuyển toàn bộ phần thông tin liên hệ (Contact pills) vào trong Calendar Modal để làm gọn giao diện Step 1.
- **API Routes**:
    - `/api/tours/open-dates`: Trả về danh sách ngày có tour kèm các khung giờ cụ thể.
    - `/api/tours/availability`: Tính toán số chỗ còn lại dựa trên `tourId`, `date` và `time`.

## 3. Các công việc đang dang dở & Bước tiếp theo (Next Steps)
- **Kiểm tra dữ liệu thực tế (Real Data Testing)**:
    - Cần tạo các bản ghi thử nghiệm trên Airtable bảng `TourDates` với cùng một ngày nhưng khác `departure_time` để test việc hiển thị nhiều khung giờ ở cột phải Modal.
    - Kiểm tra xem khi chọn khung giờ khác nhau, số lượng ghế trống có cập nhật đúng không.
- **Luồng thanh toán (Payment Flow)**:
    - Đảm bảo khi tạo Order, field `DepartureTime` được ghi đúng vào Airtable để phục vụ việc trừ slot.
    - Tiếp tục làm Step 4 (Payment selection): Cho phép chọn giữa QR Bank Transfer và OnePay (Sắp có design).
- **Responsive**:
    - Kiểm tra kỹ hơn Modal V2 trên các thiết bị di động có màn hình cực ngắn để đảm bảo không bị mất nút "Continue".

## 4. Ghi chú kỹ thuật cho Agent tiếp theo
- **Airtable Logic**: Slot khả dụng = `total_slots` - (số khách đã `paid` + số khách `pending` trong 30 phút).
- **State Management**: `BookingForm.tsx` quản lý `openDatesMap`. Map này hiện đã lưu cả mảng `times` cho từng ngày. Khi user click chọn ngày trên lịch, `tempSelectedTime` sẽ tự động lấy khung giờ đầu tiên của ngày đó.
- **Style**: Toàn bộ CSS nằm trong `_booking-form.scss` dưới class `.date-picker-modal-v2`. Sử dụng biến SASS từ `_variables.scss` để đảm bảo tính nhất quán.

---
*Dữ liệu đã sẵn sàng để tiếp tục triển khai. Chúc bạn hoàn thành tốt phần còn lại của dự án!*
