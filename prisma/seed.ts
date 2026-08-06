import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();
  await prisma.otpRequest.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@lnmiit.ac.in",
      role: "admin",
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Student 1",
      email: "student1@lnmiit.ac.in",
      role: "student",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Student 2",
      email: "student2@lnmiit.ac.in",
      role: "student",
    },
  });

  const resources = await prisma.resource.createMany({
    data: [
      {
        name: "Main Auditorium",
        description: "500-seater hall equipped with modern audio-visual setup, stage lighting, and central air conditioning.",
        location: "Central Block, 1st Floor",
        category: "hall",
        openTime: "09:00",
        closeTime: "21:00",
        isActive: true,
      },
      {
        name: "Music Room",
        description: "Acoustically treated space with acoustic guitars, drum kit, synthesizer, and amplifier stack.",
        location: "Student Activity Centre (SAC)",
        category: "room",
        openTime: "08:00",
        closeTime: "22:00",
        isActive: true,
      },
      {
        name: "Seminar Hall 1",
        description: "120-seat interactive seminar room with dual HD projectors and wireless microphones.",
        location: "Academic Block 2, Ground Floor",
        category: "hall",
        openTime: "09:00",
        closeTime: "20:00",
        isActive: true,
      },
      {
        name: "Sony Alpha Camera Kit",
        description: "4K Cinema camera package with 24-70mm f/2.8 GM lens, tripod, memory card, and shotgun mic.",
        location: "Media Club Desk",
        category: "equipment",
        openTime: "09:00",
        closeTime: "18:00",
        isActive: true,
      },
      {
        name: "Digital Oscilloscope Kit",
        description: "Rigol 100MHz dual-channel digital storage oscilloscope with probe accessories.",
        location: "ECE Lab 3",
        category: "equipment",
        openTime: "09:00",
        closeTime: "17:00",
        isActive: true,
      },
      {
        name: "Executive Conference Room A",
        description: "16-person board room with 75-inch smart display and video conferencing bar.",
        location: "Administration Block",
        category: "room",
        openTime: "09:00",
        closeTime: "21:00",
        isActive: true,
      },
      {
        name: "VR & Robotics Setup",
        description: "Meta Quest 3 VR headset with high-performance gaming PC workstation.",
        location: "Innovation Lab 102",
        category: "other",
        openTime: "10:00",
        closeTime: "19:00",
        isActive: true,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
