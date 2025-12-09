// Database Seeding Script
// Tạo dữ liệu mẫu cho development

import { PrismaClient, UserRole, DormitoryGender, RoomType, BedStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // 1. Tạo Admin User
  const adminPassword = await bcrypt.hash("admin123", 10)
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

  // 2. Tạo Student Users và Student Records (Tạo 100 sinh viên để test pagination)
  const students = []
  const majors = ["Công nghệ thông tin", "Khoa học máy tính", "Kỹ thuật phần mềm", "Hệ thống thông tin", "Kỹ thuật điện tử", "Kỹ thuật cơ điện tử"]
  const courses = ["K18", "K19", "K20", "K21", "K22"]

  for (let i = 1; i <= 100; i++) {
    const studentPassword = await bcrypt.hash("123456", 10)
    const gender = i % 2 === 0 ? "Nam" : "Nữ"
    const major = majors[Math.floor(Math.random() * majors.length)]
    const course = courses[Math.floor(Math.random() * courses.length)]
    const firstName = gender === "Nam" ? ["Nguyễn Văn", "Trần Văn", "Lê Văn", "Phạm Văn"][Math.floor(Math.random() * 4)] : ["Nguyễn Thị", "Trần Thị", "Lê Thị", "Phạm Thị"][Math.floor(Math.random() * 4)]
    const lastName = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 5) % 26))

    const user = await prisma.user.create({
      data: {
        email: `student${String(i).padStart(3, "0")}@utehy.edu.vn`,
        password: studentPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            studentCode: `2024${String(i).padStart(3, "0")}`,
            fullName: `${firstName} ${lastName}`,
            gender,
            dateOfBirth: new Date(2000 + (i % 5), i % 12, 15),
            phoneNumber: `098${String(Math.floor(Math.random() * 9000000) + 1000000).padStart(7, "0")}`,
            email: `student${String(i).padStart(3, "0")}@utehy.edu.vn`,
            major,
            course,
            address: `Số ${i}, Đường ${["ABC", "DEF", "GHI", "JKL"][i % 4]}, Hưng Yên`,
          },
        },
      },
      include: {
        student: true,
      },
    })
    students.push(user.student!)
  }
  console.log(`✅ Created ${students.length} students`)

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

  // 6. Tạo nhiều Registration mẫu để test pagination (Tạo 50 registrations)
  const statuses = ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_THANH_TOAN", "DA_HUY", "TU_CHOI"]
  const semesters = ["HK1_2024_2025", "HK2_2024_2025", "HK1_2025_2026"]

  for (let i = 0; i < 50; i++) {
    const student = students[i % students.length]
    const room = roomsA[i % roomsA.length]
    const bedsInRoom = await prisma.bed.findMany({
      where: { roomId: room.id },
    })

    if (bedsInRoom.length > 0) {
      const bed = bedsInRoom[i % bedsInRoom.length]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const semester = semesters[Math.floor(Math.random() * semesters.length)]

      await prisma.registration.create({
        data: {
          studentId: student.id,
          roomId: room.id,
          bedId: bed.id,
          semester: semester as any,
          status: status as any,
          notes: `Đăng ký phòng học kỳ ${semester}`,
        },
      })

      // Update room occupied count if status is active
      if (["CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_THANH_TOAN"].includes(status)) {
        await prisma.room.update({
          where: { id: room.id },
          data: { occupied: { increment: 1 } },
        })

        // Update bed status
        await prisma.bed.update({
          where: { id: bed.id },
          data: { status: "OCCUPIED" },
        })
      }
    }
  }

  console.log("✅ Created 50 sample registrations")
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
