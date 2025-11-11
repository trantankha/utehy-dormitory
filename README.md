# Hệ Thống Đăng Ký Ký Túc Xá - UTEHY

Hệ thống quản lý đăng ký ký túc xá cho trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY), được xây dựng với Next.js 14, TypeScript, Prisma ORM và PostgreSQL.

## Mục Lục

- [Tổng Quan](#tổng-quan)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cài Đặt và Triển Khai](#cài-đặt-và-triển-khai)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Chức Năng Chính](#chức-năng-chính)
- [Phân Quyền](#phân-quyền)
- [Database Schema](#database-schema)
- [API và Server Actions](#api-và-server-actions)

---

## Tổng Quan

Hệ thống đăng ký ký túc xá UTEHY là một ứng dụng web full-stack cho phép:

- **Sinh viên**: Đăng ký phòng ký túc xá, xem và quản lý phiếu đăng ký của mình, thanh toán tiền ký túc xá trực tuyến
- **Quản lý KTX**: Quản lý danh sách sinh viên, phòng, ký túc xá, xử lý các phiếu đăng ký và quản lý thanh toán

Hệ thống tuân thủ các nguyên tắc thiết kế hiện đại (DRY, SOLID) và có cấu trúc rõ ràng, dễ bảo trì.

---

## Kiến Trúc Hệ Thống

### Sơ Đồ Tổng Quan

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  Student Portal  │              │   Admin Portal   │     │
│  │  - Dashboard     │              │  - Dashboard     │     │
│  │  - Register Room │              │  - Manage Rooms  │     │
│  │  - My Registr.   │              │  - Registrations │     │
│  └──────────────────┘              └──────────────────┘     │ 
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS 14 (App Router)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware (Auth & Authorization)       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  Server Actions  │              │   API Routes     │     │
│  │  - auth.ts       │              │  (Optional)      │     │
│  │  - registration  │              │                  │     │
│  │  - admin.ts      │              │                  │     │
│  └──────────────────┘              └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      PRISMA ORM                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Models: User, Student, Dormitory, Room, Bed,        │   │
│  │          Registration                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Quyết Định Kiến Trúc

**Server Actions vs API Routes:**
- Hệ thống sử dụng **Server Actions** làm phương thức chính cho data mutations
- Server Actions cung cấp type-safety tốt hơn và tích hợp chặt chẽ với React Server Components
- API Routes có thể được thêm vào sau nếu cần expose endpoints cho mobile apps hoặc third-party integrations

---

## Công Nghệ Sử Dụng

### Frontend
- **Next.js 14** (App Router) - React framework với server-side rendering
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Backend
- **Next.js Server Actions** - Server-side data mutations
- **Prisma ORM** - Type-safe database client
- **bcryptjs** - Password hashing
- **iron-session** - Secure session management
- **VNPay Integration** - Online payment processing

### Database
- **PostgreSQL** - Production database
- **SQLite** - Development/testing (optional)

---

## Cài Đặt và Triển Khai

### Yêu Cầu Hệ Thống

- Node.js 18.x hoặc cao hơn
- PostgreSQL 14.x hoặc cao hơn
- npm hoặc yarn

### Bước 1: Clone Repository

\`\`\`bash
git clone <repository-url>
cd utehy-dormitory-system
\`\`\`

### Bước 2: Cài Đặt Dependencies

\`\`\`bash
npm install
\`\`\`

### Bước 3: Cấu Hình Environment Variables

Tạo file `.env` từ `.env.example`:

\`\`\`bash
cp .env.example .env
\`\`\`

Cập nhật các giá trị trong `.env`:

\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/utehy_dormitory"

# Session Secret (generate a random string)
SESSION_SECRET="your-super-secret-key-min-32-characters-long"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# VNPay Configuration (Production)
VNPAY_TMN_CODE=UTEHY001
VNPAY_HASH_SECRET=your-vnpay-secret-key-here
VNPAY_URL=https://payment.vnpay.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payment/return
VNPAY_IPN_URL=http://localhost:3000/api/payment/ipn
\`\`\`

**Lưu ý quan trọng về SESSION_SECRET:**
- Phải có ít nhất 32 ký tự
- Sử dụng chuỗi ngẫu nhiên phức tạp
- Không chia sẻ secret này trong version control
- Tạo secret mới cho mỗi môi trường (dev, staging, production)

Để tạo SESSION_SECRET ngẫu nhiên:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

### Bước 4: Setup Database

\`\`\`bash
# Tạo database migrations
npx prisma migrate dev --name init

# Seed database với dữ liệu mẫu
npm run db:seed

### Bước 5: Chạy Development Server

\`\`\`bash
npm run dev
\`\`\`

Truy cập ứng dụng tại: `http://localhost:3000`

### Bước 6: Đăng Nhập với Tài Khoản Mẫu

**Admin Account:**
- Email: `admin@utehy.edu.vn`
- Password: `admin123`

**Student Account:**
- Email: `student1@utehy.edu.vn`
- Password: `student123`

---

## Cấu Trúc Dự Án

\`\`\`
utehy-dormitory-system/
├── actions/                    # Server Actions
│   ├── auth.ts                # Authentication actions
│   ├── registration.ts        # Registration business logic
│   ├── room.ts                # Room queries
│   └── admin.ts               # Admin management actions
├── app/
│   ├── (auth)/                # Auth routes (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (student)/             # Student portal routes
│   │   └── student/
│   │       ├── dashboard/
│   │       ├── register-room/
│   │       └── my-registrations/
│   ├── (admin)/               # Admin portal routes
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── registrations/
│   │       ├── students/
│   │       └── rooms/
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/
│   ├── forms/                 # Form components
│   ├── layouts/               # Layout components (nav, sidebar)
│   ├── student/               # Student-specific components
│   ├── admin/                 # Admin-specific components
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── auth.ts                # Auth utilities
│   ├── prisma.ts              # Prisma client
│   └── validations/           # Zod schemas
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── docs/                      # Documentation
├── middleware.ts              # Route protection
└── .env.example               # Environment variables template
\`\`\`

---

## Chức Năng Chính

### Dành Cho Sinh Viên

#### 1. Dashboard
- Xem thông tin cá nhân
- Thống kê phiếu đăng ký
- Quick actions

#### 2. Đăng Ký Phòng
- Xem danh sách phòng có sẵn
- Lọc theo ký túc xá, loại phòng, giới tính
- Xem chi tiết phòng (số giường, giá, tiện nghi)
- Đăng ký phòng với validation real-time

#### 3. Quản Lý Phiếu Đăng Ký
- Xem danh sách phiếu đăng ký của mình
- Xem chi tiết từng phiếu
- Hủy phiếu (chỉ khi trạng thái "Chờ xác nhận")

#### 4. Thanh Toán Ký Túc Xá
- Thanh toán tiền phòng trực tuyến qua VNPay
- Hỗ trợ QR Code, ATM, Internet Banking
- Xem lịch sử thanh toán
- Tải hóa đơn thanh toán

### Dành Cho Quản Lý KTX

#### 1. Dashboard
- Thống kê tổng quan (sinh viên, phòng, phiếu đăng ký)
- Biểu đồ và metrics

#### 2. Quản Lý Phiếu Đăng Ký
- Xem tất cả phiếu đăng ký
- Lọc theo trạng thái, ký túc xá
- Cập nhật trạng thái phiếu (Chờ XN → Đã XN → Đã TT)
- Xem chi tiết sinh viên và phòng

#### 3. Quản Lý Sinh Viên
- Xem danh sách sinh viên
- Tìm kiếm theo MSSV, tên
- Xem lịch sử đăng ký

#### 4. Quản Lý Phòng & KTX
- Xem danh sách phòng và ký túc xá
- Xem tình trạng phòng (số giường còn trống)
- Thống kê theo ký túc xá

#### 5. Quản Lý Thanh Toán
- Xem danh sách thanh toán của sinh viên
- Lọc theo trạng thái thanh toán, kỳ học
- Xem chi tiết giao dịch
- Xuất báo cáo thanh toán

---

## Database Schema

### Entity Relationship Diagram

\`\`\`
User (1) ──────── (1) Student
                       │
                       │ (1)
                       │
                       ▼
                  Registration (N)
                       │
                       │ (N)
                       │
                       ▼
Room (N) ──────── (1) Dormitory
  │
  │ (1)
  │
  ▼
Bed (N)
\`\`\`

### Key Models

**User** - Tài khoản đăng nhập
- id, email, password, role (STUDENT/ADMIN)

**Student** - Thông tin sinh viên
- id, mssv, hoTen, gioiTinh, sdt, lop, khoa
- userId (1-1 với User)

**Dormitory** - Ký túc xá
- id, tenKTX, diaChi, moTa

**Room** - Phòng
- id, soPhong, loaiPhong, soGiuongToiDa, soGiuongDaDuocDat, giaThue
- dormitoryId (N-1 với Dormitory)

**Bed** - Giường
- id, soGiuong, trangThai
- roomId (N-1 với Room)

**Registration** - Phiếu đăng ký
- id, ngayDangKy, status, ghiChu
- studentId (N-1 với Student)
- roomId (N-1 với Room)

---

## Testing

### Tài Khoản Test

Sau khi chạy `npx prisma db seed`, bạn có thể sử dụng các tài khoản sau:

**Admin:**
- Email: `admin@utehy.edu.vn`
- Password: `admin123`

**Students:**
- Email: `student1@utehy.edu.vn` - `student5@utehy.edu.vn`
- Password: `student123`

### Test Scenarios

1. **Đăng ký phòng thành công**
   - Login với tài khoản sinh viên
   - Vào "Đăng ký phòng"
   - Chọn phòng còn chỗ trống
   - Xác nhận đăng ký

2. **Hủy phiếu đăng ký**
   - Vào "Phiếu đăng ký của tôi"
   - Chọn phiếu có trạng thái "Chờ xác nhận"
   - Click "Hủy phiếu"

3. **Admin xử lý phiếu**
   - Login với tài khoản admin
   - Vào "Quản lý phiếu đăng ký"
   - Chọn phiếu cần xử lý
   - Cập nhật trạng thái

---

## Deployment

### Vercel Deployment

1. Push code lên GitHub
2. Import project vào Vercel
3. Cấu hình Environment Variables trong Vercel Dashboard
4. Deploy

### Environment Variables trên Production

Đảm bảo set các biến sau trong Vercel:

\`\`\`env
DATABASE_URL=<production-postgresql-url>
SESSION_SECRET=<production-secret-key>
NEXT_PUBLIC_APP_URL=<production-url>
\`\`\`

---

## Roadmap

### Phase 1 (Completed)
- ✅ Authentication system
- ✅ Student registration flow
- ✅ Admin management dashboard
- ✅ Role-based authorization

### Phase 2 (Completed)
- ✅ Payment integration (VNPay)
- [ ] Room transfer functionality
- [ ] Contract renewal
- [ ] Email notifications
- [ ] Mobile app

---

## Contributing

Để đóng góp vào dự án:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

MIT License - xem file LICENSE để biết thêm chi tiết.

---

## Contact

Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)
- Website: https://utehy.edu.vn
- Email: info@utehy.edu.vn