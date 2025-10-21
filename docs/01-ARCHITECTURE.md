# Kiến trúc Hệ thống Đăng ký Ký túc xá UTEHY

## 1. Tổng quan Kiến trúc (Architecture Overview)

### 1.1. Sơ đồ Tổng quan

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  Student Portal  │              │  Admin Dashboard │     │
│  │  (Next.js Pages) │              │  (Next.js Pages) │     │
│  └──────────────────┘              └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                         │
│              (Authentication & Authorization)               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                       │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │ Server Actions   │              │   API Routes     │     │
│  │ (Business Logic) │              │  (RESTful APIs)  │     │
│  └──────────────────┘              └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                      │
│                      (Prisma ORM)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                         │
│                      (PostgreSQL)                           │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 1.2. Công nghệ Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod (Form validation)
- shadcn/ui Components

**Backend:**
- Next.js Server Actions (Primary)
- Next.js API Routes (Secondary)
- TypeScript

**Database:**
- PostgreSQL (Production)
- Prisma ORM (Data Access Layer)

**Authentication:**
- Cookie-based sessions
- bcryptjs (Password hashing)
- Role-based access control (RBAC)

## 2. Quyết định Kiến trúc

### 2.1. Server Actions vs API Routes

**Sử dụng Server Actions cho:**
- ✅ Form submissions (Đăng ký, Login, Update)
- ✅ CRUD operations đơn giản
- ✅ Mutations có liên quan trực tiếp đến UI
- ✅ Tận dụng React Server Components

**Sử dụng API Routes cho:**
- ✅ RESTful APIs cần expose cho external clients
- ✅ Webhook handlers
- ✅ Complex business logic cần tách biệt
- ✅ File uploads/downloads

**Trong dự án này:** Ưu tiên Server Actions vì tích hợp tốt với App Router và giảm boilerplate code.

### 2.2. Cấu trúc Thư mục

\`\`\`
utehy-dormitory-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group routes
│   │   ├── login/
│   │   └── register/
│   ├── (student)/                # Student portal
│   │   ├── dashboard/
│   │   ├── register-room/
│   │   └── my-registrations/
│   ├── (admin)/                  # Admin dashboard
│   │   ├── dashboard/
│   │   ├── dormitories/
│   │   ├── rooms/
│   │   ├── students/
│   │   └── registrations/
│   ├── api/                      # API Routes (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── layouts/                  # Layout components
│   └── shared/                   # Shared components
├── lib/                          # Utilities & Configurations
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # Auth utilities
│   ├── validations/              # Zod schemas
│   └── utils.ts                  # Helper functions
├── actions/                      # Server Actions
│   ├── auth.ts
│   ├── registration.ts
│   ├── room.ts
│   └── student.ts
├── prisma/                       # Prisma configuration
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── middleware.ts                 # Next.js middleware (Auth)
├── .env                          # Environment variables
└── package.json
\`\`\`

## 3. Database Schema

Xem chi tiết trong file `prisma/schema.prisma`

**Core Entities:**
1. **User** - Authentication & Authorization
2. **Student** - Thông tin sinh viên
3. **Dormitory** - Thông tin ký túc xá
4. **Room** - Thông tin phòng
5. **Bed** - Thông tin giường
6. **Registration** - Phiếu đăng ký

**Key Relationships:**
- User 1:1 Student
- Dormitory 1:N Room
- Room 1:N Bed
- Student 1:N Registration
- Room 1:N Registration
- Bed 1:N Registration

## 4. Business Logic Implementation

### 4.1. Quy trình Đăng ký Phòng

\`\`\`typescript
// Pseudo-code
async function registerRoom(studentId, roomId, bedId, semester) {
  // 1. Validation
  - Check student exists
  - Check room exists and is active
  - Check room has available capacity (occupied < capacity)
  - Check student hasn't registered for this semester
  - Check bed is available (if bedId provided)
  
  // 2. Transaction (Atomic operation)
  await prisma.$transaction([
    // Create registration
    prisma.registration.create({
      studentId, roomId, bedId, semester,
      status: 'CHO_XAC_NHAN'
    }),
    
    // Update room occupied count
    prisma.room.update({
      where: { id: roomId },
      data: { occupied: { increment: 1 } }
    }),
    
    // Update bed status (if applicable)
    prisma.bed.update({
      where: { id: bedId },
      data: { status: 'RESERVED' }
    })
  ])
  
  // 3. Return success
}
\`\`\`

### 4.2. Xử lý Trạng thái Registration

**State Machine:**
\`\`\`
CHO_XAC_NHAN → DA_XAC_NHAN → DA_THANH_TOAN
       ↓              ↓
    DA_HUY        TU_CHOI
\`\`\`

**Rules:**
- Student chỉ có thể hủy khi status = 'CHO_XAC_NHAN'
- Admin có thể chuyển: CHO_XAC_NHAN → DA_XAC_NHAN/TU_CHOI
- Admin có thể chuyển: DA_XAC_NHAN → DA_THANH_TOAN
- Khi hủy/từ chối: phải hoàn tác room.occupied và bed.status

### 4.3. Authorization Rules

**Student Role:**
- ✅ View own profile
- ✅ Register for room
- ✅ View own registrations
- ✅ Cancel own registration (if CHO_XAC_NHAN)
- ❌ Cannot access admin routes

**Admin Role:**
- ✅ View all students, rooms, registrations
- ✅ Manage dormitories, rooms, beds
- ✅ Approve/reject registrations
- ✅ Update registration status
- ❌ Cannot register as student

## 5. Security Considerations

1. **Authentication:**
   - Password hashing với bcryptjs
   - HTTP-only cookies cho session
   - Secure cookies trong production

2. **Authorization:**
   - Middleware kiểm tra role trước khi access routes
   - Server Actions validate user permissions
   - Database queries filter by user context

3. **Input Validation:**
   - Zod schemas cho tất cả inputs
   - Server-side validation (không tin client)
   - Sanitize user inputs

4. **Database Security:**
   - Prisma ORM prevents SQL injection
   - Use transactions cho operations phức tạp
   - Proper foreign key constraints

## 6. Performance Optimization

1. **Database:**
   - Indexes trên các trường thường query
   - Use select để chỉ lấy fields cần thiết
   - Pagination cho danh sách lớn

2. **Frontend:**
   - Server Components cho static content
   - Client Components chỉ khi cần interactivity
   - React Hook Form giảm re-renders

3. **Caching:**
   - Next.js automatic caching cho Server Components
   - Revalidate data khi có mutations

## 7. Deployment Strategy

**Development:**
\`\`\`bash
npm run dev              # Start dev server
npm run db:push          # Push schema to DB
npm run db:seed          # Seed sample data
\`\`\`

**Production:**
\`\`\`bash
npm run build            # Build for production
npm run db:migrate       # Run migrations
npm start                # Start production server
\`\`\`

**Recommended Hosting:**
- **Frontend + Backend:** Vercel
- **Database:** Supabase, Neon, or Railway (PostgreSQL)
- **Environment Variables:** Vercel Environment Variables

## 8. Future Enhancements

- [ ] Email notifications (Nodemailer)
- [ ] Payment integration (VNPay, Momo)
- [ ] Room transfer functionality
- [ ] Contract renewal
- [ ] Maintenance request system
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced reporting & analytics
- [ ] Mobile app (React Native)
