# Hệ thống Thông báo Email

## Tổng quan
Hệ thống quản lý ký túc xá bao gồm hệ thống thông báo email tự động gửi thông báo hóa đơn điện nước đến sinh viên khi hóa đơn được tạo.

## Tính năng
- **Thông báo Email Tự động**: Khi tính hóa đơn điện nước, sinh viên sẽ nhận được thông báo qua email
- **Mẫu Email Chuyên nghiệp**: Mẫu email HTML và văn bản thuần với nội dung tiếng Việt
- **Tích hợp Resend**: Sử dụng dịch vụ email Resend để đảm bảo giao nhận tin cậy
- **Xử lý Lỗi**: Lỗi gửi email không làm gián đoạn quá trình lập hóa đơn
- **Gửi Hàng loạt**: Gửi thông báo hiệu quả đến nhiều sinh viên cùng lúc

## Thiết lập

### 1. Cài đặt Dependencies
```bash
npm install resend
```

### 2. Biến Môi trường
Thêm các biến sau vào file `.env`:
```env
# Dịch vụ Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@utehy.edu.vn"
```

### 3. Lấy API Key Resend
1. Đăng ký tại [resend.com](https://resend.com)
2. Tạo API key trong dashboard
3. Thêm key vào biến môi trường

### 4. Xác thực Tên miền (Sản xuất)
Để sử dụng trong môi trường sản xuất, xác thực tên miền trong Resend:
1. Thêm tên miền của bạn (ví dụ: utehy.edu.vn) vào Resend
2. Cấu hình bản ghi DNS theo hướng dẫn
3. Cập nhật FROM_EMAIL để sử dụng tên miền đã xác thực

## Mẫu Email

### Thông báo Hóa đơn Điện nước
- **Tiêu đề**: "Hóa đơn điện nước tháng [MM]/[YYYY] - Phòng [RoomNumber]"
- **Nội dung**:
  - Lời chào sinh viên
  - Thông tin phòng
  - Chi tiết tiêu thụ (điện và nước)
  - Phân tích chi phí
  - Hạn thanh toán
  - Lời kêu gọi hành động xem hóa đơn online

### Tính năng Mẫu
- Thiết kế HTML đáp ứng
- Địa phương hóa tiếng Việt
- Phong cách chuyên nghiệp
- Văn bản thuần dự phòng
- Thương hiệu trường Đại học Sư phạm Kỹ thuật

## Cách sử dụng

### Thông báo Tự động
Email thông báo được gửi tự động khi:
- Quản trị viên tính hóa đơn điện nước qua giao diện admin
- Hóa đơn được tạo cho tháng hiện tại
- Sinh viên có đăng ký phòng đang hoạt động

### Kiểm tra Thủ công
Bạn có thể kiểm tra việc gửi email bằng cách:
1. Tính hóa đơn trong giao diện admin
2. Kiểm tra log máy chủ để xem trạng thái email
3. Xác minh giao nhận email trong dashboard Resend

## Xử lý Lỗi
- Lỗi gửi email được ghi log nhưng không dừng quá trình lập hóa đơn
- Hệ thống tiếp tục hoạt động ngay cả khi dịch vụ email không khả dụng
- Thông báo lỗi chi tiết trong log máy chủ

## Bảo mật
- API key được lưu trữ an toàn trong biến môi trường
- Không có dữ liệu nhạy cảm được gửi trong email
- Giới hạn tốc độ được xử lý bởi dịch vụ Resend

## Giám sát
- Trạng thái giao nhận email hiển thị trong dashboard Resend
- Log máy chủ hiển thị số lượng thành công/thất bại
- Email thất bại được ghi log với chi tiết lỗi

## Cải tiến Tương lai
- Tùy chọn thông báo email cho sinh viên
- Email nhắc nhở cho hóa đơn quá hạn
- Email xác nhận đăng ký
- Email xác nhận thanh toán
- Mẫu email tùy chỉnh cho từng ký túc xá
