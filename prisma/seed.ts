// Database Seeding Script
// Tạo dữ liệu mẫu cho development

import { PrismaClient, UserRole, DormitoryGender, RoomType, BedStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // 1. Tạo Admin User
  const adminPassword = await bcrypt.hash("admin123456", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@utehy.edu.vn" },
    update: {},
    create: {
      email: "admin@utehy.edu.vn",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  })
  console.log("✅ Created admin user:", admin.email)

  // 2. Tạo Student Users và Student Records
  const students = []
  for (let i = 1; i <= 5; i++) {
    const studentPassword = await bcrypt.hash("student123", 10)
    const user = await prisma.user.create({
      data: {
        email: `student${i}@utehy.edu.vn`,
        password: studentPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            studentCode: `2024${String(i).padStart(3, "0")}`,
            fullName: `Nguyễn Văn ${String.fromCharCode(64 + i)}`,
            gender: i % 2 === 0 ? "Nam" : "Nữ",
            dateOfBirth: new Date(2002, i, 15),
            phoneNumber: `098765432${i}`,
            email: `student${i}@utehy.edu.vn`,
            major: i % 2 === 0 ? "Công nghệ thông tin" : "Kỹ thuật điện",
            course: "K18",
            address: `Số ${i}, Đường ABC, Hưng Yên`,
          },
        },
      },
      include: {
        student: true,
      },
    })
    students.push(user.student!)
    console.log(`✅ Created student: ${user.student!.fullName}`)
  }

  // 3. Tạo Dormitories
  const dormitoryA = await prisma.dormitory.create({
    data: {
      name: "Nhà A",
      code: "KTX-A",
      gender: DormitoryGender.NAM,
      address: "Khu A, Trường ĐH Sư phạm Kỹ thuật Hưng Yên",
      description: "Ký túc xá dành cho sinh viên nam",
      totalRooms: 20,
      isActive: true,
    },
  })

  const dormitoryB = await prisma.dormitory.create({
    data: {
      name: "Nhà B",
      code: "KTX-B",
      gender: DormitoryGender.NU,
      address: "Khu B, Trường ĐH Sư phạm Kỹ thuật Hưng Yên",
      description: "Ký túc xá dành cho sinh viên nữ",
      totalRooms: 15,
      isActive: true,
    },
  })
  console.log("✅ Created dormitories")

  // 4. Tạo Rooms cho Dormitory A (Nam)
  const roomsA = []
  for (let floor = 1; floor <= 3; floor++) {
    for (let room = 1; room <= 4; room++) {
      const roomNumber = `${floor}${String(room).padStart(2, "0")}`
      const roomData = await prisma.room.create({
        data: {
          dormitoryId: dormitoryA.id,
          roomNumber,
          floor,
          roomType: RoomType.PHONG_6,
          capacity: 6,
          occupied: 0,
          pricePerSemester: 1500000, // 1.5 triệu/học kỳ
          description: `Phòng ${roomNumber} - Tầng ${floor}`,
          isActive: true,
        },
      })
      roomsA.push(roomData)
    }
  }
  console.log(`✅ Created ${roomsA.length} rooms for Dormitory A`)

  // 5. Tạo Beds cho mỗi Room
  for (const room of roomsA) {
    for (let bedNum = 1; bedNum <= room.capacity; bedNum++) {
      await prisma.bed.create({
        data: {
          roomId: room.id,
          bedNumber: String(bedNum),
          status: BedStatus.AVAILABLE,
          description: `Giường số ${bedNum}`,
        },
      })
    }
  }
  console.log("✅ Created beds for all rooms")

  // 6. Tạo một số Registration mẫu
  const room1 = roomsA[0]
  const beds = await prisma.bed.findMany({
    where: { roomId: room1.id },
    take: 2,
  })

  await prisma.registration.create({
    data: {
      studentId: students[0].id,
      roomId: room1.id,
      bedId: beds[0].id,
      semester: "HK1_2024_2025",
      status: "CHO_XAC_NHAN",
      notes: "Đăng ký phòng học kỳ 1",
    },
  })

  // Update room occupied count
  await prisma.room.update({
    where: { id: room1.id },
    data: { occupied: 1 },
  })

  console.log("✅ Created sample registrations")
  console.log("🎉 Database seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
