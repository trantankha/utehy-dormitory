# API Reference

Tài liệu chi tiết về các Server Actions và API endpoints trong hệ thống.

---

## Authentication Actions

### `login(credentials: LoginInput)`

Đăng nhập vào hệ thống.

**File:** `actions/auth.ts`

**Parameters:**
\`\`\`typescript
interface LoginInput {
  email: string      // Email đăng nhập
  password: string   // Mật khẩu
}
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  error?: string
}
\`\`\`

**Example:**
\`\`\`typescript
const result = await login({
  email: 'student1@utehy.edu.vn',
  password: 'student123'
})

if (result.success) {
  // Redirect to dashboard
} else {
  // Show error message
  console.error(result.error)
}
\`\`\`

---

### `register(data: RegisterInput)`

Đăng ký tài khoản mới (dành cho sinh viên).

**File:** `actions/auth.ts`

**Parameters:**
\`\`\`typescript
interface RegisterInput {
  // User info
  email: string
  password: string
  confirmPassword: string
  
  // Student info
  mssv: string
  hoTen: string
  gioiTinh: 'NAM' | 'NU'
  sdt: string
  lop: string
  khoa: string
}
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  error?: string
}
\`\`\`

**Validation Rules:**
- Email phải hợp lệ và chưa tồn tại
- Password tối thiểu 6 ký tự
- confirmPassword phải khớp với password
- MSSV phải unique
- Tất cả các trường bắt buộc

---

### `logout()`

Đăng xuất khỏi hệ thống.

**File:** `actions/auth.ts`

**Returns:**
\`\`\`typescript
void
\`\`\`

**Example:**
\`\`\`typescript
await logout()
// Redirect to login page
\`\`\`

---

## Registration Actions (Student)

### `createRegistration(data: CreateRegistrationInput)`

Tạo phiếu đăng ký phòng mới.

**File:** `actions/registration.ts`

**Authorization:** Chỉ STUDENT

**Parameters:**
\`\`\`typescript
interface CreateRegistrationInput {
  roomId: string      // ID của phòng muốn đăng ký
  ghiChu?: string     // Ghi chú (optional)
}
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Registration
  error?: string
}
\`\`\`

**Business Logic:**
1. Kiểm tra phòng còn chỗ trống
2. Kiểm tra sinh viên chưa có phiếu active
3. Kiểm tra giới tính phù hợp với loại phòng
4. Transaction: Tạo Registration + Cập nhật Room

**Example:**
\`\`\`typescript
const result = await createRegistration({
  roomId: 'room-123',
  ghiChu: 'Muốn ở tầng 2'
})

if (result.success) {
  console.log('Đăng ký thành công:', result.data)
} else {
  console.error(result.error)
}
\`\`\`

---

### `getMyRegistrations()`

Lấy danh sách phiếu đăng ký của sinh viên hiện tại.

**File:** `actions/registration.ts`

**Authorization:** Chỉ STUDENT

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Registration[]
  error?: string
}
\`\`\`

**Includes:**
- Room information
- Dormitory information

**Example:**
\`\`\`typescript
const result = await getMyRegistrations()

if (result.success) {
  result.data.forEach(reg => {
    console.log(`Phòng ${reg.room.soPhong} - ${reg.status}`)
  })
}
\`\`\`

---

### `cancelRegistration(registrationId: string)`

Hủy phiếu đăng ký.

**File:** `actions/registration.ts`

**Authorization:** Chỉ STUDENT (owner của phiếu)

**Parameters:**
\`\`\`typescript
registrationId: string  // ID của phiếu cần hủy
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  error?: string
}
\`\`\`

**Business Logic:**
1. Kiểm tra ownership (phiếu thuộc về sinh viên)
2. Kiểm tra trạng thái = 'CHO_XAC_NHAN'
3. Transaction: Cập nhật status + Giảm soGiuongDaDuocDat

**Example:**
\`\`\`typescript
const result = await cancelRegistration('reg-123')

if (result.success) {
  console.log('Đã hủy phiếu thành công')
} else {
  console.error(result.error)
}
\`\`\`

---

## Room Actions

### `getAvailableRooms(filters?: RoomFilters)`

Lấy danh sách phòng có sẵn (còn chỗ trống).

**File:** `actions/room.ts`

**Authorization:** Public (authenticated users)

**Parameters:**
\`\`\`typescript
interface RoomFilters {
  dormitoryId?: string        // Lọc theo ký túc xá
  loaiPhong?: 'NAM' | 'NU'   // Lọc theo loại phòng
  giaThueMin?: number         // Giá tối thiểu
  giaThueMax?: number         // Giá tối đa
}
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Room[]
  error?: string
}
\`\`\`

**Logic:**
- Chỉ trả về phòng có `soGiuongDaDuocDat < soGiuongToiDa`
- Includes: Dormitory information
- Sorted by: soPhong ASC

**Example:**
\`\`\`typescript
const result = await getAvailableRooms({
  dormitoryId: 'dorm-1',
  loaiPhong: 'NAM',
  giaThueMax: 500000
})

if (result.success) {
  console.log(`Tìm thấy ${result.data.length} phòng`)
}
\`\`\`

---

### `getRoomById(roomId: string)`

Lấy chi tiết một phòng.

**File:** `actions/room.ts`

**Authorization:** Public (authenticated users)

**Parameters:**
\`\`\`typescript
roomId: string  // ID của phòng
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Room
  error?: string
}
\`\`\`

**Includes:**
- Dormitory information
- Beds information

**Example:**
\`\`\`typescript
const result = await getRoomById('room-123')

if (result.success) {
  console.log(`Phòng ${result.data.soPhong}`)
  console.log(`Còn ${result.data.soGiuongToiDa - result.data.soGiuongDaDuocDat} chỗ`)
}
\`\`\`

---

## Admin Actions

### `getAllRegistrations(filters?: RegistrationFilters)`

Lấy tất cả phiếu đăng ký (dành cho admin).

**File:** `actions/admin.ts`

**Authorization:** Chỉ ADMIN

**Parameters:**
\`\`\`typescript
interface RegistrationFilters {
  status?: RegistrationStatus
  dormitoryId?: string
  studentId?: string
}
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Registration[]
  error?: string
}
\`\`\`

**Includes:**
- Student information (with user email)
- Room information (with dormitory)

**Example:**
\`\`\`typescript
const result = await getAllRegistrations({
  status: 'CHO_XAC_NHAN'
})

if (result.success) {
  console.log(`${result.data.length} phiếu chờ xác nhận`)
}
\`\`\`

---

### `updateRegistrationStatus(registrationId: string, newStatus: RegistrationStatus)`

Cập nhật trạng thái phiếu đăng ký.

**File:** `actions/admin.ts`

**Authorization:** Chỉ ADMIN

**Parameters:**
\`\`\`typescript
registrationId: string
newStatus: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DA_THANH_TOAN' | 'DA_HUY'
\`\`\`

**Returns:**
\`\`\`typescript
{
  success: boolean
  error?: string
}
\`\`\`

**Valid Transitions:**
\`\`\`
CHO_XAC_NHAN → DA_XAC_NHAN, DA_HUY
DA_XAC_NHAN → DA_THANH_TOAN, DA_HUY
DA_THANH_TOAN → (none)
DA_HUY → (none)
\`\`\`

**Example:**
\`\`\`typescript
const result = await updateRegistrationStatus('reg-123', 'DA_XAC_NHAN')

if (result.success) {
  console.log('Đã xác nhận phiếu')
} else {
  console.error(result.error)
}
\`\`\`

---

### `getStatistics()`

Lấy thống kê tổng quan hệ thống.

**File:** `actions/admin.ts`

**Authorization:** Chỉ ADMIN

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: {
    totalStudents: number
    totalRooms: number
    totalDormitories: number
    totalRegistrations: number
    registrationsByStatus: {
      CHO_XAC_NHAN: number
      DA_XAC_NHAN: number
      DA_THANH_TOAN: number
      DA_HUY: number
    }
    occupancyRate: number  // Tỷ lệ lấp đầy (%)
  }
  error?: string
}
\`\`\`

**Example:**
\`\`\`typescript
const result = await getStatistics()

if (result.success) {
  console.log(`Tổng sinh viên: ${result.data.totalStudents}`)
  console.log(`Tỷ lệ lấp đầy: ${result.data.occupancyRate}%`)
}
\`\`\`

---

### `getAllStudents()`

Lấy danh sách tất cả sinh viên.

**File:** `actions/admin.ts`

**Authorization:** Chỉ ADMIN

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Student[]
  error?: string
}
\`\`\`

**Includes:**
- User information (email)
- Registration count

**Example:**
\`\`\`typescript
const result = await getAllStudents()

if (result.success) {
  result.data.forEach(student => {
    console.log(`${student.mssv} - ${student.hoTen}`)
  })
}
\`\`\`

---

### `getAllRooms()`

Lấy danh sách tất cả phòng.

**File:** `actions/admin.ts`

**Authorization:** Chỉ ADMIN

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Room[]
  error?: string
}
\`\`\`

**Includes:**
- Dormitory information
- Registration count

**Example:**
\`\`\`typescript
const result = await getAllRooms()

if (result.success) {
  result.data.forEach(room => {
    const available = room.soGiuongToiDa - room.soGiuongDaDuocDat
    console.log(`Phòng ${room.soPhong}: Còn ${available} chỗ`)
  })
}
\`\`\`

---

### `getAllDormitories()`

Lấy danh sách tất cả ký túc xá.

**File:** `actions/admin.ts`

**Authorization:** Chỉ ADMIN

**Returns:**
\`\`\`typescript
{
  success: boolean
  data?: Dormitory[]
  error?: string
}
\`\`\`

**Includes:**
- Room count
- Total capacity
- Current occupancy

**Example:**
\`\`\`typescript
const result = await getAllDormitories()

if (result.success) {
  result.data.forEach(dorm => {
    console.log(`${dorm.tenKTX}: ${dorm._count.rooms} phòng`)
  })
}
\`\`\`

---

## Type Definitions

### Registration

\`\`\`typescript
interface Registration {
  id: string
  studentId: string
  roomId: string
  ngayDangKy: Date
  status: RegistrationStatus
  ghiChu: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  student?: Student
  room?: Room
}
\`\`\`

### RegistrationStatus

\`\`\`typescript
type RegistrationStatus = 
  | 'CHO_XAC_NHAN'    // Chờ xác nhận
  | 'DA_XAC_NHAN'     // Đã xác nhận
  | 'DA_THANH_TOAN'   // Đã thanh toán
  | 'DA_HUY'          // Đã hủy
\`\`\`

### Room

\`\`\`typescript
interface Room {
  id: string
  dormitoryId: string
  soPhong: string
  loaiPhong: 'NAM' | 'NU'
  soGiuongToiDa: number
  soGiuongDaDuocDat: number
  giaThue: number
  moTa: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  dormitory?: Dormitory
  beds?: Bed[]
  registrations?: Registration[]
}
\`\`\`

### Student

\`\`\`typescript
interface Student {
  id: string
  userId: string
  mssv: string
  hoTen: string
  gioiTinh: 'NAM' | 'NU'
  sdt: string
  lop: string
  khoa: string
  createdAt: Date
  updatedAt: Date
  
  // Relations
  user?: User
  registrations?: Registration[]
}
\`\`\`

### Dormitory

\`\`\`typescript
interface Dormitory {
  id: string
  tenKTX: string
  diaChi: string
  moTa: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  rooms?: Room[]
}
\`\`\`

---

## Error Codes

### Common Errors

\`\`\`typescript
// Authentication errors
'Unauthorized' - Không có quyền truy cập
'Invalid credentials' - Sai email hoặc mật khẩu
'Email already exists' - Email đã tồn tại

// Validation errors
'Dữ liệu không hợp lệ' - Input validation failed
'Phòng đã hết chỗ' - Room is full
'Bạn đã có phiếu đăng ký đang hoạt động' - Already has active registration

// Authorization errors
'Bạn không có quyền hủy phiếu này' - Not owner of registration
'Chỉ có thể hủy phiếu đang ở trạng thái "Chờ xác nhận"' - Invalid status for cancellation

// State transition errors
'Không thể chuyển từ "X" sang "Y"' - Invalid state transition

// Not found errors
'Không tìm thấy phiếu đăng ký' - Registration not found
'Không tìm thấy phòng' - Room not found
\`\`\`

---

## Best Practices

### 1. Error Handling

\`\`\`typescript
try {
  const result = await createRegistration(data)
  
  if (result.success) {
    // Handle success
    toast.success('Đăng ký thành công!')
  } else {
    // Handle business logic error
    toast.error(result.error)
  }
} catch (error) {
  // Handle unexpected error
  console.error(error)
  toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
}
\`\`\`

### 2. Loading States

\`\`\`typescript
const [isLoading, setIsLoading] = useState(false)

async function handleSubmit(data) {
  setIsLoading(true)
  try {
    const result = await createRegistration(data)
    // Handle result
  } finally {
    setIsLoading(false)
  }
}
\`\`\`

### 3. Optimistic Updates

\`\`\`typescript
// Update UI immediately, rollback if failed
const optimisticUpdate = (newData) => {
  setData(newData)
  
  updateData(newData).catch(() => {
    // Rollback on error
    setData(oldData)
    toast.error('Cập nhật thất bại')
  })
}
\`\`\`

---

## Rate Limiting

Hiện tại hệ thống chưa implement rate limiting. Trong production, nên thêm:

\`\`\`typescript
// Sử dụng middleware hoặc library như @upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function createRegistration(data) {
  const { success } = await ratelimit.limit(session.userId)
  
  if (!success) {
    return { success: false, error: 'Too many requests' }
  }
  
  // Continue with logic
}
\`\`\`

---

## Webhooks (Future)

Trong tương lai có thể thêm webhooks để notify external systems:

\`\`\`typescript
// POST /api/webhooks/registration-created
{
  event: 'registration.created',
  data: {
    registrationId: 'reg-123',
    studentId: 'student-456',
    roomId: 'room-789',
    timestamp: '2024-01-15T10:30:00Z'
  }
}
