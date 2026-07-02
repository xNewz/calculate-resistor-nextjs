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
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { classroom: true }
    });

    if (!assignment) {
      return { success: false, error: "Not found" };
    }

    if (session.role === "TEACHER" && assignment.classroom.teacherId !== session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const totalStudents = await prisma.enrollment.count({
      where: { classroomId: assignment.classroomId }
    });

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
    // Fetch submissions
    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { success: true, data: { violations, submissions, totalStudents } };
  } catch (error) {
    console.error("Error fetching exam monitor data:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
