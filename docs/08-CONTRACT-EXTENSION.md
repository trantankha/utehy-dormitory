# Tài Liệu Gia Hạn Hợp Đồng

## Tổng Quan

Tính năng gia hạn hợp đồng cho phép sinh viên tự động gia hạn đăng ký ký túc xá cho học kỳ tiếp theo. Tính năng này được thiết kế để đơn giản hóa quy trình gia hạn bằng cách cho phép sinh viên gia hạn phòng hiện tại mà không cần trải qua toàn bộ quy trình đăng ký lại.

## Logic Nghiệp Vụ

### Tiêu Chí Đủ Điều Kiện

Sinh viên có thể gia hạn hợp đồng nếu đáp ứng các điều kiện sau:

1. **Đăng Ký Hoạt Động**: Phải có phiếu đăng ký hiện tại với trạng thái `DA_XAC_NHAN` (Đã xác nhận) hoặc `DA_THANH_TOAN` (Đã thanh toán)
2. **Không Có Đăng Ký Học Kỳ Tiếp Theo**: Không được có phiếu đăng ký hiện có cho học kỳ tiếp theo
3. **Phòng Còn Trống**: Phòng hiện tại vẫn phải hoạt động và có sức chứa khả dụng
4. **Giường Còn Trống**: Nếu sinh viên đã có giường cụ thể, giường đó vẫn phải khả dụng

### Quy Trình Gia Hạn

1. **Tính Toán Học Kỳ**: Hệ thống tự động tính toán học kỳ tiếp theo bằng tiện ích `getNextSemester`
2. **Xác Thực Phòng**: Kiểm tra xem phòng hiện tại vẫn hoạt động và có sức chứa
3. **Phân Công Giường**: Cố gắng phân công cùng giường nếu khả dụng, nếu không thì tìm giường trống trong phòng
4. **Tạo Giao Dịch**: Tạo bản ghi đăng ký mới trong giao dịch cơ sở dữ liệu
5. **Cập Nhật Trạng Thái**: Cập nhật số lượng phòng và trạng thái giường tương ứng

### Xử Lý Lỗi

Hệ thống xử lý các tình huống lỗi khác nhau:

- **Không Có Đăng Ký Hoạt Động**: Sinh viên không có phiếu đăng ký đang hoạt động để gia hạn
- **Gia Hạn Trùng Lặp**: Sinh viên đã có phiếu đăng ký cho học kỳ tiếp theo
- **Phòng Đầy**: Phòng hiện tại không hoạt động hoặc đã đầy
- **Giường Bị Chiếm**: Giường cụ thể không còn khả dụng (bị sinh viên khác chiếm)

## Triển Khai Kỹ Thuật

### Server Action: `extendContractAction`

Đặt tại `actions/registration.ts`, server action này xử lý logic gia hạn hợp đồng.

#### Tham Số
- `data: ContractExtensionInput` - Chứa ghi chú tùy chọn cho việc gia hạn

#### Giá Trị Trả Về
- `success: boolean` - Trạng thái thành công của thao tác
- `message?: string` - Thông báo thành công với thông tin học kỳ tiếp theo
- `error?: string` - Thông báo lỗi nếu thao tác thất bại

#### Schema Xác Thực

```typescript
export const contractExtensionSchema = z.object({
  notes: z.string().optional(),
})
```

### Giao Dịch Cơ Sở Dữ Liệu

Quy trình gia hạn sử dụng giao dịch Prisma để đảm bảo tính nhất quán dữ liệu:

1. Tạo bản ghi đăng ký mới
2. Tăng số lượng phòng đã chiếm
3. Cập nhật trạng thái giường thành "RESERVED" nếu giường được phân công

### Tái Xác Thực Đường Dẫn

Sau khi gia hạn thành công, các đường dẫn sau được tái xác thực:
- `/student/my-registrations` - Để hiển thị đăng ký mới

## Trải Nghiệm Người Dùng

### Tích Hợp Cổng Sinh Viên

Tính năng gia hạn hợp đồng nên được truy cập từ:

1. **Bảng Điều Khiển Sinh Viên**: Nút hành động nhanh để gia hạn hợp đồng
2. **Trang Phiếu Đăng Ký Của Tôi**: Tùy chọn gia hạn cho các đăng ký hoạt động
3. **Chi Tiết Đăng Ký**: Nút gia hạn đăng ký riêng lẻ

### Thành Phần UI Cần Thiết

1. **Nút Gia Hạn**: CTA nổi bật để gia hạn hợp đồng
2. **Hộp Thoại Xác Nhận**: Xác nhận gia hạn với chi tiết học kỳ
3. **Thông Báo Thành Công**: Hiển thị chi tiết học kỳ tiếp theo và phòng
4. **Xử Lý Lỗi**: Thông báo lỗi rõ ràng cho các tình huống thất bại khác nhau

### Khả Năng Quan Sát Của Quản Lý

Người dùng quản lý nên có thể:

1. Xem các hợp đồng gia hạn trong giao diện quản lý đăng ký
2. Phân biệt giữa đăng ký mới và gia hạn hợp đồng
3. Xử lý yêu cầu gia hạn thông qua quy trình phê duyệt tương tự

## Tích Hợp API

### Cách Sử Dung Frontend

```typescript
// Ví dụ sử dụng trong component React
const handleExtendContract = async (notes?: string) => {
  const result = await extendContractAction({ notes })

  if (result.success) {
    toast.success(result.message)
    // Làm mới danh sách đăng ký
    router.refresh()
  } else {
    toast.error(result.error)
  }
}
```

### Tích Hợp Form

Việc gia hạn có thể được tích hợp với form bằng React Hook Form:

```typescript
const form = useForm<ContractExtensionInput>({
  resolver: zodResolver(contractExtensionSchema),
})

const onSubmit = async (data: ContractExtensionInput) => {
  await handleExtendContract(data.notes)
}
```

## Kịch Bản Kiểm Tra

### Đường Đi Vui Vẻ
1. Sinh viên có đăng ký hoạt động nhấp "Gia Hạn Hợp Đồng"
2. Hệ thống tính toán học kỳ tiếp theo chính xác
3. Phòng và giường khả dụng
4. Đăng ký mới được tạo thành công
5. Sinh viên thấy thông báo thành công với chi tiết học kỳ tiếp theo

### Trường Hợp Lỗi
1. **Không Có Đăng Ký Hoạt Động**: Thông báo lỗi "Bạn không có phiếu đăng ký đang hoạt động để gia hạn"
2. **Gia Hạn Trùng Lặp**: Thông báo lỗi "Bạn đã có phiếu đăng ký cho học kỳ tiếp theo"
3. **Phòng Đầy**: Thông báo lỗi "Phòng hiện tại đã đầy"
4. **Giường Bị Chiếm**: Việc gia hạn tiếp tục mà không có phân công giường cụ thể

### Trường Hợp Cạnh
1. **Ranh Giới Học Kỳ**: Gia hạn qua ranh giới năm học
2. **Thay Đổi Phòng**: Xử lý trường hợp cấu hình phòng thay đổi
3. **Gia Hạn Đồng Thời**: Nhiều sinh viên gia hạn hợp đồng cùng lúc

## Cải Tiến Tương Lai

### Tính Năng Tiềm Năng
1. **Gia Hạn Hàng Loạt**: Khả năng quản lý gia hạn nhiều hợp đồng
2. **Nhắc Nhở Gia Hạn**: Thông báo tự động trước khi kết thúc học kỳ
3. **Lịch Sử Gia Hạn**: Theo dõi các mẫu gia hạn và thống kê
4. **Điều Khoản Linh Hoạt**: Hỗ trợ các khoảng thời gian gia hạn khác nhau (1, 2 hoặc nhiều học kỳ hơn)

### Tối Ưu Hiệu Suất
1. **Caching**: Cache dữ liệu khả dụng phòng
2. **Xử Lý Hàng Loạt**: Xử lý nhiều gia hạn hiệu quả
3. **Công Việc Nền**: Xử lý gia hạn không đồng bộ cho các lô lớn

## Cân Nhắc Bảo Mật

1. **Ủy Quyền**: Chỉ sinh viên đã xác thực mới có thể gia hạn hợp đồng của chính mình
2. **Xác Thực**: Tất cả đầu vào được xác thực bằng schema Zod
3. **An Toàn Giao Dịch**: Giao dịch cơ sở dữ liệu ngăn chặn cập nhật một phần
4. **Dấu Vết Kiểm Toán**: Tất cả gia hạn được ghi log với dấu thời gian

## Giám Sát và Phân Tích

Theo dõi các chỉ số chính:
- Tỷ lệ thành công gia hạn
- Lý do thất bại phổ biến
- Thời gian đỉnh gia hạn
- Tỷ lệ sử dụng phòng sau gia hạn

Tài liệu này cung cấp tổng quan toàn diện về tính năng gia hạn hợp đồng, bao gồm logic nghiệp vụ, triển khai kỹ thuật, trải nghiệm người dùng và cân nhắc tương lai.
