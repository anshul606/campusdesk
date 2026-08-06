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
        name: "Music Room",
        description: "Acoustic guitars, drum kit, and amplifier stack.",
        location: "Student Activity Centre (SAC)",
        category: "room",
        openTime: "08:00",
        closeTime: "22:00",
        isActive: true,
      },
      {
        name: "Sony Alpha Camera Kit",
        description: "4K Cinema camera package with 24-70mm f/2.8 GM lens, tripod, memory card, and shotgun mic.",
        location: "Imagination Club",
        category: "equipment",
        openTime: "09:00",
        closeTime: "18:00",
        isActive: true,
      },
      {
        name: "Conference Room",
        description: "Board conference room.",
        location: "Ground Floor Acad Block",
        category: "room",
        openTime: "09:00",
        closeTime: "21:00",
        isActive: true,
      },
      {
        name: "LT1",
        description: "Lecture Theatre 1",
        location: "Ground Floor Acad Block",
        category: "hall",
        openTime: "12:00",
        closeTime: "21:00",
        isActive: true,
      },
      {
        name: "LT2",
        description: "Lecture Theatre 2",
        location: "Ground Floor Acad Block",
        category: "hall",
        openTime: "12:00",
        closeTime: "20:00",
        isActive: true,
      },
      {
        name: "Mechanical Lab",
        description: "Mechanical lab with all equipment of mechanics.",
        location: "Behind Acad Block",
        category: "other",
        openTime: "10:00",
        closeTime: "19:00",
        isActive: true,
      },
      {
        name: "LT16",
        description: "Lecture Theatre 16",
        location: "Incubation",
        category: "hall",
        openTime: "09:00",
        closeTime: "17:00",
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
