import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logSystemEvent } from "@/lib/logger";

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

    await logSystemEvent(
      "EXAM_VIOLATION",
      "ERROR",
      `พบการละเมิดกฎการสอบใน "${assignment.title}" (${type}): ${details || "ไม่มีรายละเอียด"}`,
      session.userId
    );

    return NextResponse.json({ success: true, violation });
  } catch (error) {
    console.error("Failed to log exam violation:", error);
    // Get session if it hasn't failed there
    let userId = undefined;
    try {
      const session = await getSession();
      if (session) userId = session.userId;
    } catch(e) {}
    
    await logSystemEvent(
      "EXAM_VIOLATION",
      "ERROR",
      `เกิดข้อผิดพลาดในการบันทึกการละเมิดกฎการสอบ: ${error instanceof Error ? error.message : "Unknown error"}`,
      userId
    );
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "LEARNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });
    }

    // Fetch teacher warnings for this student and assignment
    const warnings = await prisma.examViolation.findMany({
      where: {
        assignmentId,
        studentId: session.userId,
        type: "TEACHER_WARNING",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ success: true, warnings });
  } catch (error) {
    console.error("Failed to fetch exam warnings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
