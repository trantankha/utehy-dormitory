# Business Logic Implementation

Tài liệu chi tiết về các quy tắc nghiệp vụ (Business Logic) được triển khai trong hệ thống.

---

## 1. Đăng Ký Phòng (Room Registration)

### 1.1 Validation Rules

#### Rule 1: Kiểm tra phòng còn chỗ trống

\`\`\`typescript
// File: actions/registration.ts

// Phòng phải có số giường đã đặt < số giường tối đa
if (room.soGiuongDaDuocDat >= room.soGiuongToiDa) {
  return {
    success: false,
    error: 'Phòng đã hết chỗ. Vui lòng chọn phòng khác.'
  }
}
\`\`\`

**Giải thích:**
- `soGiuongDaDuocDat`: Số giường đã được đăng ký
- `soGiuongToiDa`: Tổng số giường trong phòng
- Chỉ cho phép đăng ký khi còn chỗ trống

#### Rule 2: Kiểm tra sinh viên chưa có phiếu active

\`\`\`typescript
// Sinh viên chỉ được có 1 phiếu đăng ký active tại một thời điểm
const existingRegistration = await prisma.registration.findFirst({
  where: {
    studentId: student.id,
    status: {
      in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_THANH_TOAN']
    }
  }
})

if (existingRegistration) {
  return {
    success: false,
    error: 'Bạn đã có phiếu đăng ký đang hoạt động. Vui lòng hủy phiếu cũ trước khi đăng ký mới.'
  }
}
\`\`\`

**Giải thích:**
- Ngăn sinh viên đăng ký nhiều phòng cùng lúc
- Chỉ kiểm tra các phiếu có trạng thái active (chưa hủy)

#### Rule 3: Kiểm tra giới tính phù hợp

\`\`\`typescript
// Phòng nam chỉ dành cho sinh viên nam, phòng nữ chỉ dành cho sinh viên nữ
if (room.loaiPhong === 'NAM' && student.gioiTinh !== 'NAM') {
  return {
    success: false,
    error: 'Phòng này chỉ dành cho sinh viên nam.'
  }
}

if (room.loaiPhong === 'NU' && student.gioiTinh !== 'NU') {
  return {
    success: false,
    error: 'Phòng này chỉ dành cho sinh viên nữ.'
  }
}
\`\`\`

### 1.2 Transaction Logic

**Yêu cầu:** Khi đăng ký thành công, phải đồng thời:
1. Tạo bản ghi Registration mới
2. Cập nhật Room (tăng soGiuongDaDuocDat)

**Implementation:**

\`\`\`typescript
// File: actions/registration.ts

export async function createRegistration(data: CreateRegistrationInput) {
  // ... validation code ...

  // Sử dụng Prisma transaction để đảm bảo atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Bước 1: Tạo phiếu đăng ký
    const registration = await tx.registration.create({
      data: {
        studentId: student.id,
        roomId: data.roomId,
        status: 'CHO_XAC_NHAN',
        ngayDangKy: new Date(),
        ghiChu: data.ghiChu || null,
      },
      include: {
        student: {
          include: {
            user: {
              select: { email: true }
            }
          }
        },
        room: {
          include: {
            dormitory: true
          }
        }
      }
    })

    // Bước 2: Cập nhật số giường đã đặt
    await tx.room.update({
      where: { id: data.roomId },
      data: {
        soGiuongDaDuocDat: {
          increment: 1 // Tăng 1 đơn vị
        }
      }
    })

    return registration
  })

  return { success: true, data: result }
}
\`\`\`

**Lợi ích của Transaction:**
- **Atomicity**: Cả 2 operations đều thành công hoặc đều thất bại
- **Consistency**: Dữ liệu luôn ở trạng thái nhất quán
- **Isolation**: Không có race condition khi nhiều user đăng ký cùng lúc

---

## 2. Hủy Phiếu Đăng Ký (Cancel Registration)

### 2.1 Authorization Rules

#### Rule 1: Chỉ sinh viên sở hữu phiếu mới được hủy

\`\`\`typescript
// File: actions/registration.ts

export async function cancelRegistration(registrationId: string) {
  const session = await getSession()
  
  // Kiểm tra authentication
  if (!session || session.role !== 'STUDENT') {
    return { success: false, error: 'Unauthorized' }
  }

  // Lấy thông tin phiếu đăng ký
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { student: true }
  })

  if (!registration) {
    return { success: false, error: 'Không tìm thấy phiếu đăng ký' }
  }

  // Kiểm tra ownership
  if (registration.student.userId !== session.userId) {
    return { success: false, error: 'Bạn không có quyền hủy phiếu này' }
  }

  // ... continue with cancellation logic ...
}
\`\`\`

#### Rule 2: Chỉ hủy được khi trạng thái là "CHO_XAC_NHAN"

\`\`\`typescript
// Chỉ cho phép hủy phiếu đang chờ xác nhận
if (registration.status !== 'CHO_XAC_NHAN') {
  return {
    success: false,
    error: 'Chỉ có thể hủy phiếu đang ở trạng thái "Chờ xác nhận"'
  }
}
\`\`\`

**Giải thích:**
- Phiếu đã được admin xác nhận (DA_XAC_NHAN) không thể tự hủy
- Phiếu đã thanh toán (DA_THANH_TOAN) không thể hủy
- Phiếu đã hủy (DA_HUY) không cần hủy lại

### 2.2 Transaction Logic

**Yêu cầu:** Khi hủy phiếu, phải:
1. Cập nhật trạng thái Registration thành "DA_HUY"
2. Giảm soGiuongDaDuocDat của Room

**Implementation:**

\`\`\`typescript
// File: actions/registration.ts

await prisma.$transaction(async (tx) => {
  // Bước 1: Cập nhật trạng thái phiếu
  await tx.registration.update({
    where: { id: registrationId },
    data: {
      status: 'DA_HUY',
      ghiChu: registration.ghiChu 
        ? `${registration.ghiChu}\n[Đã hủy bởi sinh viên]`
        : '[Đã hủy bởi sinh viên]'
    }
  })

  // Bước 2: Hoàn trả số giường
  await tx.room.update({
    where: { id: registration.roomId },
    data: {
      soGiuongDaDuocDat: {
        decrement: 1 // Giảm 1 đơn vị
      }
    }
  })
})
\`\`\`

---

## 3. Xử Lý Trạng Thái (Admin Status Management)

### 3.1 State Machine

Phiếu đăng ký tuân theo state machine sau:

\`\`\`
┌─────────────────┐
│  CHO_XAC_NHAN   │ (Initial state)
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐  ┌──────────┐
│  DA_XAC_NHAN    │  │  DA_HUY  │ (Terminal state)
└────────┬────────┘  └──────────┘
         │
         ▼
┌─────────────────┐
│ DA_THANH_TOAN   │ (Terminal state)
└─────────────────┘
\`\`\`

### 3.2 Valid Transitions

\`\`\`typescript
// File: actions/admin.ts

const VALID_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  'CHO_XAC_NHAN': ['DA_XAC_NHAN', 'DA_HUY'],
  'DA_XAC_NHAN': ['DA_THANH_TOAN', 'DA_HUY'],
  'DA_THANH_TOAN': [], // Terminal state - không thể chuyển
  'DA_HUY': [] // Terminal state - không thể chuyển
}

export async function updateRegistrationStatus(
  registrationId: string,
  newStatus: RegistrationStatus
) {
  // ... auth check ...

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId }
  })

  if (!registration) {
    return { success: false, error: 'Không tìm thấy phiếu đăng ký' }
  }

  // Kiểm tra transition hợp lệ
  const validNextStates = VALID_TRANSITIONS[registration.status]
  if (!validNextStates.includes(newStatus)) {
    return {
      success: false,
      error: `Không thể chuyển từ "${registration.status}" sang "${newStatus}"`
    }
  }

  // Cập nhật trạng thái
  await prisma.registration.update({
    where: { id: registrationId },
    data: { status: newStatus }
  })

  return { success: true }
}
\`\`\`

### 3.3 Business Rules

#### Rule 1: Admin có thể xác nhận phiếu

\`\`\`typescript
// CHO_XAC_NHAN → DA_XAC_NHAN
// Ý nghĩa: Admin đã kiểm tra và chấp nhận đơn đăng ký
\`\`\`

#### Rule 2: Admin có thể đánh dấu đã thanh toán

\`\`\`typescript
// DA_XAC_NHAN → DA_THANH_TOAN
// Ý nghĩa: Sinh viên đã hoàn tất thanh toán tiền phòng
// Lưu ý: Hệ thống không tích hợp payment gateway, chỉ ghi nhận trạng thái
\`\`\`

#### Rule 3: Admin có thể hủy phiếu bất kỳ lúc nào

\`\`\`typescript
// CHO_XAC_NHAN → DA_HUY
// DA_XAC_NHAN → DA_HUY
// Ý nghĩa: Admin từ chối đơn hoặc hủy vì lý do đặc biệt
\`\`\`

#### Rule 4: Không thể thay đổi phiếu đã thanh toán hoặc đã hủy

\`\`\`typescript
// DA_THANH_TOAN → (không thể chuyển)
// DA_HUY → (không thể chuyển)
// Ý nghĩa: Đây là các trạng thái cuối, không thể rollback
\`\`\`

---

## 4. Phân Quyền (Authorization)

### 4.1 Middleware Level

**File:** `middleware.ts`

\`\`\`typescript
export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes - chỉ ADMIN
  if (pathname.startsWith('/admin')) {
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // Student routes - chỉ STUDENT
  if (pathname.startsWith('/student')) {
    if (session.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return NextResponse.next()
}
\`\`\`

**Bảo vệ:**
- `/admin/*` → Chỉ ADMIN
- `/student/*` → Chỉ STUDENT
- `/login`, `/register`, `/` → Public

### 4.2 Server Action Level

Mỗi Server Action phải kiểm tra quyền:

\`\`\`typescript
// File: actions/registration.ts

export async function createRegistration(data: CreateRegistrationInput) {
  const session = await getSession()
  
  // Chỉ sinh viên mới được đăng ký
  if (!session || session.role !== 'STUDENT') {
    return { success: false, error: 'Unauthorized' }
  }

  // ... business logic ...
}
\`\`\`

\`\`\`typescript
// File: actions/admin.ts

export async function updateRegistrationStatus(
  registrationId: string,
  newStatus: RegistrationStatus
) {
  const session = await getSession()
  
  // Chỉ admin mới được cập nhật trạng thái
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  // ... business logic ...
}
\`\`\`

### 4.3 Data Access Control

**Sinh viên chỉ thấy dữ liệu của mình:**

\`\`\`typescript
// File: actions/registration.ts

export async function getMyRegistrations() {
  const session = await getSession()
  
  if (!session || session.role !== 'STUDENT') {
    return { success: false, error: 'Unauthorized' }
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId }
  })

  // Chỉ lấy phiếu của sinh viên này
  const registrations = await prisma.registration.findMany({
    where: { studentId: student.id },
    include: {
      room: {
        include: { dormitory: true }
      }
    },
    orderBy: { ngayDangKy: 'desc' }
  })

  return { success: true, data: registrations }
}
\`\`\`

**Admin thấy tất cả dữ liệu:**

\`\`\`typescript
// File: actions/admin.ts

export async function getAllRegistrations(filters?: FilterOptions) {
  const session = await getSession()
  
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  // Admin có thể lấy tất cả phiếu
  const registrations = await prisma.registration.findMany({
    where: filters,
    include: {
      student: {
        include: {
          user: { select: { email: true } }
        }
      },
      room: {
        include: { dormitory: true }
      }
    },
    orderBy: { ngayDangKy: 'desc' }
  })

  return { success: true, data: registrations }
}
\`\`\`

---

## 5. Data Integrity

### 5.1 Referential Integrity

Prisma schema đảm bảo referential integrity:

\`\`\`prisma
model Registration {
  id          String   @id @default(cuid())
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId   String
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Restrict)
  roomId      String
  // ...
}
\`\`\`

**Giải thích:**
- `onDelete: Cascade` - Khi xóa Student, tự động xóa các Registration
- `onDelete: Restrict` - Không cho phép xóa Room nếu còn Registration

### 5.2 Concurrent Access

Sử dụng Prisma transactions để xử lý concurrent access:

\`\`\`typescript
// Scenario: 2 sinh viên đăng ký cùng 1 phòng chỉ còn 1 chỗ

// User A và User B cùng gọi createRegistration()
// Prisma transaction đảm bảo:
// - Chỉ 1 trong 2 thành công
// - User còn lại nhận error "Phòng đã hết chỗ"

await prisma.$transaction(async (tx) => {
  // Lock row khi đọc
  const room = await tx.room.findUnique({
    where: { id: roomId }
  })

  if (room.soGiuongDaDuocDat >= room.soGiuongToiDa) {
    throw new Error('Phòng đã hết chỗ')
  }

  // Atomic increment
  await tx.room.update({
    where: { id: roomId },
    data: { soGiuongDaDuocDat: { increment: 1 } }
  })
})
\`\`\`

---

## 6. Error Handling

### 6.1 Validation Errors

\`\`\`typescript
// Sử dụng Zod để validate input
const result = createRegistrationSchema.safeParse(data)

if (!result.success) {
  return {
    success: false,
    error: 'Dữ liệu không hợp lệ',
    details: result.error.flatten()
  }
}
\`\`\`

### 6.2 Business Logic Errors

\`\`\`typescript
// Trả về error message rõ ràng cho user
if (room.soGiuongDaDuocDat >= room.soGiuongToiDa) {
  return {
    success: false,
    error: 'Phòng đã hết chỗ. Vui lòng chọn phòng khác.'
  }
}
\`\`\`

### 6.3 Database Errors

\`\`\`typescript
try {
  await prisma.$transaction(/* ... */)
} catch (error) {
  console.error('[Registration Error]', error)
  return {
    success: false,
    error: 'Có lỗi xảy ra khi xử lý đăng ký. Vui lòng thử lại.'
  }
}
\`\`\`

---

## 7. Performance Considerations

### 7.1 Eager Loading

\`\`\`typescript
// Sử dụng include để giảm số lượng queries
const registrations = await prisma.registration.findMany({
  include: {
    student: {
      include: {
        user: { select: { email: true } }
      }
    },
    room: {
      include: { dormitory: true }
    }
  }
})
\`\`\`

### 7.2 Indexing

\`\`\`prisma
// Prisma schema với indexes
model Registration {
  // ...
  
  @@index([studentId])
  @@index([roomId])
  @@index([status])
}
\`\`\`

### 7.3 Pagination

\`\`\`typescript
// Implement pagination cho danh sách lớn
export async function getAllRegistrations(
  page: number = 1,
  pageSize: number = 20
) {
  const skip = (page - 1) * pageSize

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      skip,
      take: pageSize,
      orderBy: { ngayDangKy: 'desc' }
    }),
    prisma.registration.count()
  ])

  return {
    data: registrations,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
\`\`\`

---

## Summary

Hệ thống đã implement đầy đủ các business logic rules:

1. **Đăng ký phòng**: Validation + Transaction
2. **Hủy phiếu**: Authorization + Transaction
3. **Xử lý trạng thái**: State machine + Valid transitions
4. **Phân quyền**: Middleware + Server Action + Data access control
5. **Data integrity**: Referential integrity + Concurrent access
6. **Error handling**: Validation + Business + Database errors
7. **Performance**: Eager loading + Indexing + Pagination

Tất cả đều tuân thủ nguyên tắc SOLID và DRY, đảm bảo code dễ bảo trì và mở rộng.
