import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "LEARNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId, type, details } = await req.json();

    if (!assignmentId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify assignment exists and is an exam
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment || !assignment.isExam) {
      return NextResponse.json({ error: "Invalid assignment or not an exam" }, { status: 400 });
    }

    // Record violation
    const violation = await prisma.examViolation.create({
      data: {
        assignmentId,
        studentId: session.userId,
        type,
        details: details || null,
      }
    });

    return NextResponse.json({ success: true, violation });
  } catch (error) {
    console.error("Failed to log exam violation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
