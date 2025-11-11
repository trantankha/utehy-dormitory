# 07. Tính năng Chuyển phòng

## Tổng quan
Tính năng chuyển phòng cho phép sinh viên yêu cầu chuyển đổi giữa các phòng ký túc xá và quản trị viên quản lý các yêu cầu này.

## Tính năng

### Dành cho Sinh viên
- **Xem Yêu cầu Chuyển phòng**: Sinh viên có thể xem tất cả yêu cầu chuyển phòng của mình với theo dõi trạng thái
- **Tạo Yêu cầu Chuyển phòng**: Sinh viên có thể gửi yêu cầu chuyển phòng mới với lý do
- **Lịch sử Yêu cầu**: Dòng thời gian hoàn chỉnh về các thay đổi trạng thái yêu cầu

### Dành cho Quản trị viên
- **Quản lý Yêu cầu**: Phê duyệt, từ chối hoặc hoàn thành yêu cầu chuyển phòng
- **Hoạt động Hàng loạt**: Xử lý nhiều yêu cầu một cách hiệu quả
- **Thống kê**: Xem thống kê yêu cầu chuyển phòng trên bảng điều khiển

## Luồng Người dùng

### Luồng Yêu cầu Chuyển phòng của Sinh viên
1. Sinh viên điều hướng đến trang "Chuyển phòng"
2. Nhấp vào nút "Gửi yêu cầu chuyển phòng"
3. Chọn phòng mới và cung cấp lý do
4. Gửi yêu cầu (trạng thái: CHO_XAC_NHAN)
5. Quản trị viên xem xét và phê duyệt/từ chối (trạng thái: DA_DUYET/TU_CHOI)
6. Nếu được phê duyệt, chuyển phòng được hoàn thành (trạng thái: DA_HOAN_TAT)

### Luồng Quản lý của Quản trị viên
1. Quản trị viên điều hướng đến trang "Yêu cầu chuyển phòng"
2. Xem tất cả yêu cầu đang chờ xử lý
3. Xem xét chi tiết yêu cầu và lý do
4. Phê duyệt hoặc từ chối yêu cầu với ghi chú tùy chọn
5. Đánh dấu các chuyển phòng đã hoàn thành

## Database Schema

### TransferRequest Model
```prisma
model TransferRequest {
  id            String   @id @default(cuid())
  studentId     String
  currentRoomId String
  newRoomId     String
  currentBedId  String?
  newBedId      String?
  semester      Semester
  reason        String   @db.Text
  status        TransferStatus @default(CHO_XAC_NHAN)
  adminNotes    String?  @db.Text
  requestedAt   DateTime @default(now())
  approvedAt    DateTime?
  rejectedAt    DateTime?
  completedAt   DateTime?

  // Relations
  student       Student  @relation(fields: [studentId], references: [id])
  currentRoom   Room     @relation("CurrentRoom", fields: [currentRoomId], references: [id])
  newRoom       Room     @relation("NewRoom", fields: [newRoomId], references: [id])
  currentBed    Bed?     @relation("CurrentBed", fields: [currentBedId], references: [id])
  newBed        Bed?     @relation("NewBed", fields: [newBedId], references: [id])

  @@map("transfer_requests")
}
```

### TransferStatus Enum
```prisma
enum TransferStatus {
  CHO_XAC_NHAN  // Pending approval
  DA_DUYET      // Approved
  TU_CHOI       // Rejected
  DA_HOAN_TAT   // Completed
}
```

## Điểm cuối API

### Hành động của Sinh viên
- `POST /api/transfer` - Tạo yêu cầu chuyển phòng
- `GET /api/transfer/student` - Lấy yêu cầu chuyển phòng của sinh viên

### Hành động của Quản trị viên
- `GET /api/transfer` - Lấy tất cả yêu cầu chuyển phòng (với bộ lọc)
- `PATCH /api/transfer/:id/status` - Cập nhật trạng thái chuyển phòng

## Thành phần

### Thành phần Sinh viên
- `RoomTransferDialog` - Modal để tạo yêu cầu chuyển phòng
- Trang chuyển phòng của sinh viên - Xem và quản lý yêu cầu

### Thành phần Quản trị viên
- `TransferRequestsManagement` - Giao diện quản trị chính
- `UpdateTransferDialog` - Modal để cập nhật trạng thái yêu cầu

## Quy tắc Xác thực

### Xác thực Yêu cầu Chuyển phòng
- Sinh viên phải có đăng ký hoạt động cho học kỳ hiện tại
- Phòng mới phải khác với phòng hiện tại
- Phòng mới phải có sức chứa khả dụng
- Lý do phải từ 10-500 ký tự
- Học kỳ phải hợp lệ

### Xác thực Cập nhật Trạng thái
- Chỉ yêu cầu đang chờ xử lý mới có thể được phê duyệt/từ chối
- Chỉ yêu cầu đã phê duyệt mới có thể được hoàn thành
- Ghi chú của quản trị viên tùy chọn nhưng được khuyến nghị cho việc từ chối

## Cân nhắc Bảo mật

### Ủy quyền
- Sinh viên chỉ có thể xem/sửa đổi yêu cầu của chính mình
- Quản trị viên có thể xem/sửa đổi tất cả yêu cầu
- Kiểm soát truy cập dựa trên vai trò đúng đắn

### Xác thực Dữ liệu
- Xác thực phía máy chủ cho tất cả đầu vào
- Làm sạch lý do và ghi chú do người dùng cung cấp
- Ngăn chặn việc chuyển phòng trái phép

## Xử lý Lỗi

### Lỗi Thường gặp
- Phòng không khả dụng
- Đăng ký sinh viên không hợp lệ
- Truy cập trái phép
- Vi phạm ràng buộc cơ sở dữ liệu

### Phản hồi Người dùng
- Thông báo lỗi rõ ràng bằng tiếng Việt
- Thông báo thành công cho các hành động
- Trạng thái tải trong quá trình hoạt động

## Kịch bản Kiểm thử

### Kiểm thử Sinh viên
- Tạo yêu cầu chuyển phòng hợp lệ
- Thử chuyển phòng không hợp lệ (cùng phòng, không đủ sức chứa)
- Xem lịch sử yêu cầu
- Xử lý lỗi mạng

### Kiểm thử Quản trị viên
- Phê duyệt yêu cầu đang chờ xử lý
- Từ chối với ghi chú
- Hoàn thành chuyển phòng đã phê duyệt
- Hoạt động hàng loạt
- Chức năng lọc và tìm kiếm

## Cân nhắc Hiệu suất

### Truy vấn Cơ sở dữ liệu
- Các trường được lập chỉ mục để lọc hiệu quả
- Phân trang cho các tập kết quả lớn
- Tối ưu hóa các phép nối cho dữ liệu liên quan

### Hiệu suất Giao diện Người dùng
- Tải chậm của các hộp thoại chuyển phòng
- Tái kết xuất hiệu quả khi cập nhật trạng thái
- Thiết kế đáp ứng cho thiết bị di động

## Cải tiến Tương lai

### Tính năng Tiềm năng
- Thông báo email cho các thay đổi trạng thái
- Quy trình hoàn thành chuyển phòng tự động
- Mẫu yêu cầu chuyển phòng
- Phân tích và báo cáo
- Tích hợp với lịch bảo trì phòng

### Cải tiến Kỹ thuật
- Cập nhật thời gian thực với WebSockets
- Lọc và sắp xếp nâng cao
- Chức năng xuất dữ liệu
- Giới hạn tốc độ API
- Chiến lược lưu trữ đệm
