"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getExamViolationsAction(assignmentId: string) {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify assignment belongs to teacher (if not admin)
    if (session.role === "TEACHER") {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          classroom: {
            teacherId: session.userId
          }
        }
      });
      if (!assignment) {
        return { success: false, error: "Not found or unauthorized" };
      }
    }

    // Fetch violations
    const violations = await prisma.examViolation.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 for performance
    });

    return { success: true, data: violations };
  } catch (error) {
    console.error("Error fetching exam violations:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
