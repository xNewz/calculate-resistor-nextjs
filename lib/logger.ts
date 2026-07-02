import { prisma } from "./prisma";

export async function logSystemEvent(
  action: string,
  status: "SUCCESS" | "ERROR",
  details: string,
  userId?: string
) {
  try {
    await prisma.systemLog.create({
      data: {
        action,
        status,
        details,
        userId: userId || null,
      },
    });
  } catch (error) {
    console.error("Failed to write to SystemLog:", error);
  }
}
