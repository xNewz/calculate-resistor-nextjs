import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Auto-seed function to create the first teacher user if none exists
async function seedDefaultTeacher() {
  try {
    const teacherCount = await prisma.user.count({
      where: { role: "TEACHER" },
    });
    if (teacherCount === 0) {
      // Use dynamic require of bcryptjs to prevent bundler issues on Edge if imported at top-level
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("teacher123456", 10);
      
      await prisma.user.create({
        data: {
          email: "teacher@resistor.com",
          name: "ครูผู้สอน (ระบบแอดมิน)",
          password: hashedPassword,
          role: "TEACHER",
        },
      });
      console.log("-----------------------------------------------------------------");
      console.log(" [Auto-Seed] Created default teacher account!");
      console.log(" Email: teacher@resistor.com");
      console.log(" Password: teacher123456");
      console.log("-----------------------------------------------------------------");
    }
  } catch (error) {
    console.error("Auto-seed default teacher error:", error);
  }
}

// Trigger auto-seed asynchronously in server environments
if (typeof window === "undefined") {
  seedDefaultTeacher();
}
