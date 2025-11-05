# Utility Billing System (Hệ thống tính tiền điện nước)

Tài liệu chi tiết về hệ thống quản lý điện nước trong ký túc xá UTEHY.

---

## 1. Tổng quan

Hệ thống tính tiền điện nước cho phép:
- Quản lý biểu giá điện nước
- Ghi chỉ số đồng hồ hàng tháng
- Tự động tính tiền và tạo hóa đơn
- Theo dõi trạng thái thanh toán
- Sinh viên xem hóa đơn của phòng

---

## 2. Database Schema

### 2.1 UtilityRate (Biểu giá)

```prisma
model UtilityRate {
  id               String   @id @default(cuid())
  electricityRate  Decimal  @db.Decimal(10, 2) // Đơn giá điện (VNĐ/kWh)
  waterRate        Decimal  @db.Decimal(10, 2) // Đơn giá nước (VNĐ/m³)
  effectiveFrom    DateTime // Ngày bắt đầu áp dụng
  effectiveTo      DateTime? // Ngày kết thúc áp dụng
  description      String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("utility_rates")
}
```

### 2.2 MeterReading (Ghi chỉ số)

```prisma
model MeterReading {
  id                String   @id @default(cuid())
  roomId            String // Foreign key to Room
  month             Int // Tháng (1-12)
  year              Int // Năm
  electricityReading Int      @default(0) // Chỉ số điện (kWh)
  waterReading      Int      @default(0) // Chỉ số nước (m³)
  recordedBy        String // Admin ID ghi nhận
  recordedAt        DateTime @default(now())
  notes             String?  @db.Text
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([roomId, month, year])
  @@map("meter_readings")
}
```

### 2.3 UtilityBill (Hóa đơn)

```prisma
model UtilityBill {
  id                String     @id @default(cuid())
  roomId            String
  month             Int
  year              Int
  electricityUsage  Int        @default(0) // Tiêu thụ điện (kWh)
  waterUsage        Int        @default(0) // Tiêu thụ nước (m³)
  electricityAmount Decimal    @db.Decimal(10, 2) @default(0)
  waterAmount       Decimal    @db.Decimal(10, 2) @default(0)
  totalAmount       Decimal    @db.Decimal(10, 2) @default(0)
  status            BillStatus @default(PENDING)
  dueDate           DateTime
  paidAt            DateTime?
  paidBy            String?
  notes             String?    @db.Text
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([roomId, month, year])
  @@map("utility_bills")
}
```

---

## 3. Business Logic

### 3.1 Quản lý biểu giá

#### Rule 1: Biểu giá hiệu lực
- Chỉ có 1 biểu giá hiệu lực tại 1 thời điểm
- Khi tạo biểu giá mới, tự động kết thúc biểu giá cũ

#### Rule 2: Validation
- Đơn giá điện và nước phải >= 0
- Ngày bắt đầu áp dụng là bắt buộc

### 3.2 Ghi chỉ số đồng hồ

#### Rule 1: Unique constraint
- Mỗi phòng chỉ có 1 lần ghi chỉ số/tháng
- Phòng phải tồn tại và đang hoạt động

#### Rule 2: Chỉ số hợp lệ
- Chỉ số điện và nước phải >= 0
- Admin ghi nhận với đầy đủ thông tin

### 3.3 Tính tiền và tạo hóa đơn

#### Quy trình tính tiền:
1. Lấy biểu giá hiện tại
2. Lấy chỉ số tháng hiện tại
3. Lấy chỉ số tháng trước (để tính tiêu thụ)
4. Tính tiêu thụ = chỉ số hiện tại - chỉ số trước
5. Tính tiền = tiêu thụ × đơn giá
6. Tạo hóa đơn với hạn thanh toán

#### Rule 1: Tính tiêu thụ
```typescript
const electricityUsage = currentReading.electricityReading - (prevReading?.electricityReading || 0)
const waterUsage = currentReading.waterReading - (prevReading?.waterReading || 0)
```

#### Rule 2: Tính tiền
```typescript
const electricityAmount = electricityUsage * Number(currentRate.electricityRate)
const waterAmount = waterUsage * Number(currentRate.waterRate)
const totalAmount = electricityAmount + waterAmount
```

#### Rule 3: Hạn thanh toán
- Hạn thanh toán: ngày 10 tháng sau
- Ví dụ: hóa đơn tháng 12/2024 → hạn 10/01/2025

### 3.4 Trạng thái hóa đơn

```typescript
enum BillStatus {
  PENDING   // Chờ thanh toán
  PAID      // Đã thanh toán
  OVERDUE   // Quá hạn
  CANCELLED // Đã hủy
}
```

#### State transitions:
- PENDING → PAID (thanh toán thành công)
- PENDING → CANCELLED (hủy hóa đơn)
- PAID → không thể thay đổi
- OVERDUE → PAID (thanh toán trễ)
- CANCELLED → không thể thay đổi

---

## 4. Server Actions

### 4.1 Utility Rates

#### `getCurrentUtilityRatesAction()`
- Lấy biểu giá hiện tại
- Authorization: ADMIN

#### `createUtilityRateAction(data)`
- Tạo biểu giá mới
- Tự động kết thúc biểu giá cũ
- Authorization: ADMIN

### 4.2 Meter Readings

#### `getMeterReadingsAction(month, year)`
- Lấy danh sách ghi chỉ số theo tháng/năm
- Authorization: ADMIN

#### `createMeterReadingAction(data)`
- Ghi chỉ số mới
- Validation: phòng tồn tại, chưa ghi tháng này
- Authorization: ADMIN

### 4.3 Utility Bills

#### `calculateUtilityBillsAction(month, year)`
- Tính tiền cho tất cả phòng
- Tạo hóa đơn tự động
- Authorization: ADMIN

#### `getUtilityBillsAction(month, year)`
- Lấy danh sách hóa đơn
- Authorization: ADMIN

#### `updateUtilityBillStatusAction(billId, data)`
- Cập nhật trạng thái hóa đơn
- Authorization: ADMIN

#### `getStudentUtilityBillsAction()`
- Sinh viên xem hóa đơn của phòng
- Authorization: STUDENT

---

## 5. UI Components

### 5.1 Admin Interface

#### UtilityRatesManager
- Hiển thị biểu giá hiện tại
- Form tạo biểu giá mới
- Dialog với validation

#### MeterReadingsManager
- Lọc theo tháng/năm
- Danh sách ghi chỉ số
- Form ghi chỉ số mới

#### UtilityBillsManager
- Tính tiền hàng loạt
- Danh sách hóa đơn
- Cập nhật trạng thái

### 5.2 Student Interface

#### StudentUtilityBillsPage
- Hiển thị hóa đơn của phòng
- Badge trạng thái
- Chi tiết tiêu thụ và tiền

---

## 6. Error Handling

### 6.1 Validation Errors
- Biểu giá: đơn giá âm, ngày bắt đầu trống
- Chỉ số: phòng không tồn tại, đã ghi tháng này
- Hóa đơn: không có biểu giá, không có chỉ số

### 6.2 Business Logic Errors
- "Chưa có biểu giá điện nước"
- "Đã ghi chỉ số cho phòng này trong tháng này"
- "Không thể chuyển từ X sang Y"

### 6.3 Database Errors
- Transaction failures
- Unique constraint violations
- Foreign key constraints

---

## 7. Performance Considerations

### 7.1 Indexing
- roomId, month, year cho MeterReading và UtilityBill
- effectiveTo IS NULL cho UtilityRate

### 7.2 Eager Loading
```typescript
const bills = await prisma.utilityBill.findMany({
  include: {
    room: {
      include: { dormitory: true }
    }
  }
})
```

### 7.3 Pagination
- Danh sách hóa đơn có thể lớn
- Implement pagination cho admin interface

---

## 8. Security

### 8.1 Authorization
- Chỉ ADMIN được quản lý biểu giá, ghi chỉ số, tính tiền
- Chỉ STUDENT sở hữu phòng được xem hóa đơn
- Server action level validation

### 8.2 Data Access Control
- Sinh viên chỉ thấy hóa đơn của phòng đang ở
- Admin thấy tất cả dữ liệu

---

## 9. Future Enhancements

### 9.1 Automatic Billing
- Cron job tính tiền tự động hàng tháng
- Email notification cho sinh viên

### 9.2 Payment Integration
- Tích hợp cổng thanh toán
- QR code cho thanh toán

### 9.3 Analytics
- Báo cáo tiêu thụ theo thời gian
- Thống kê doanh thu

### 9.4 Excel Import/Export ✅ (Đã triển khai)

#### Export Excel
- **Ghi chỉ số đồng hồ**: Xuất danh sách chỉ số điện nước theo tháng/năm
- **Hóa đơn điện nước**: Xuất danh sách hóa đơn với chi tiết tiêu thụ và thanh toán
- **Danh sách sinh viên**: Xuất thông tin sinh viên cho quản lý

#### Import Excel
- **Ghi chỉ số đồng hồ**: Nhập hàng loạt chỉ số từ file Excel
- **Template mẫu**: Tải template Excel với định dạng chuẩn
- **Validation**: Kiểm tra dữ liệu đầu vào và báo lỗi chi tiết
- **Transaction**: Đảm bảo tính toàn vẹn dữ liệu khi nhập

**File:** `actions/excel.ts`, `lib/excel.ts`
**Components:** `MeterReadingsManager`, `UtilityBillsManager`
