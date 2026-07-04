"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSystemEvent } from "@/lib/logger";
import { generateSeededQuestions } from "@/lib/seededQuestions";
import { parseTextAnswer } from "@/lib/resistor";
import { parseMultimeterAnswer } from "@/lib/multimeter";

export type ActionResponse = {
  success: boolean;
  error?: string;
  data?: any;
};

// Generates a 6-character unique invite code
function generateClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted easily confused chars: I, O, 0, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Action to create a classroom (Teacher only)
 */
export async function createClassroomAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ (เฉพาะผู้สอนเท่านั้น)" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length < 2) {
    return { success: false, error: "ชื่อห้องเรียนต้องมีตัวอักษรอย่างน้อย 2 ตัว" };
  }

  try {
    // Generate unique code
    let code = "";
    let codeExists = true;
    while (codeExists) {
      code = generateClassCode();
      const existing = await prisma.classroom.findUnique({
        where: { code },
      });
      if (!existing) codeExists = false;
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description: description || null,
        code,
        teacherId: session.userId,
      },
    });

    await logSystemEvent("CREATE_CLASSROOM", "SUCCESS", `สร้างห้องเรียน "${name}" (รหัส: ${code}) สำเร็จ`, session.userId);

    revalidatePath("/classroom");
    return { success: true, data: classroom };
  } catch (error) {
    console.error("Create classroom error:", error);
    await logSystemEvent("CREATE_CLASSROOM", "ERROR", `เกิดข้อผิดพลาดในการสร้างห้องเรียน: ${error instanceof Error ? error.message : "Unknown error"}`, session.userId);
    return { success: false, error: "ไม่สามารถสร้างห้องเรียนได้เนื่องจากข้อผิดพลาดภายในระบบ" };
  }
}

/**
 * Action to join a classroom using classroom code (Learner only)
 */
export async function joinClassroomAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ (เฉพาะผู้เรียนเท่านั้น)" };
  }

  const codeInput = formData.get("code") as string;
  if (!codeInput) {
    return { success: false, error: "กรุณากรอกรหัสห้องเรียน" };
  }

  const code = codeInput.trim().toUpperCase();

  try {
    // Find classroom
    const classroom = await prisma.classroom.findUnique({
      where: { code },
    });

    if (!classroom) {
      return { success: false, error: "ไม่พบห้องเรียนตามรหัสที่ระบุ กรุณาตรวจสอบรหัสอีกครั้ง" };
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classroomId: {
          userId: session.userId,
          classroomId: classroom.id,
        },
      },
    });

    if (existingEnrollment) {
      return { success: true, error: "คุณเข้าร่วมห้องเรียนนี้อยู่แล้ว", data: classroom };
    }

    // Enroll
    await prisma.enrollment.create({
      data: {
        userId: session.userId,
        classroomId: classroom.id,
      },
    });

    await logSystemEvent("JOIN_CLASSROOM", "SUCCESS", `เข้าร่วมห้องเรียน "${classroom.name}" สำเร็จ`, session.userId);

    revalidatePath("/classroom");
    return { success: true, data: classroom };
  } catch (error) {
    console.error("Join classroom error:", error);
    await logSystemEvent("JOIN_CLASSROOM", "ERROR", `เกิดข้อผิดพลาดขณะเข้าร่วมห้องเรียน: ${error instanceof Error ? error.message : "Unknown error"}`, session.userId);
    return { success: false, error: "ไม่สามารถเข้าร่วมห้องเรียนได้เนื่องจากข้อผิดพลาดภายในระบบ" };
  }
}

/**
 * Action to assign a quiz (Teacher only)
 */
export async function createAssignmentAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ (เฉพาะผู้สอนเท่านั้น)" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const bandType = formData.get("bandType") as string;
  const assignmentType = formData.get("assignmentType") as string || "RESISTOR";
  const questionCountStr = formData.get("questionCount") as string;
  const classroomId = formData.get("classroomId") as string;
  const dueDateStr = formData.get("dueDate") as string;
  const allowLateStr = formData.get("allowLate") as string;

  if (!title || title.trim().length < 2) {
    return { success: false, error: "กรุณากรอกหัวข้อแบบฝึกหัดอย่างน้อย 2 ตัวอักษร" };
  }
  if (bandType !== "4" && bandType !== "5") {
    return { success: false, error: "รูปแบบแถบสีไม่ถูกต้อง" };
  }
  const questionCount = parseInt(questionCountStr, 10);
  if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
    return { success: false, error: "จำนวนข้อไม่ถูกต้อง (กำหนดได้ 1-50 ข้อ)" };
  }

  let dueDate: Date | null = null;
  if (dueDateStr && dueDateStr.trim() !== "") {
    const localDateStr = dueDateStr.includes("T") && !dueDateStr.includes("Z") && !dueDateStr.includes("+")
      ? `${dueDateStr}:00+07:00`
      : dueDateStr;
    dueDate = new Date(localDateStr);
    if (isNaN(dueDate.getTime())) {
      return { success: false, error: "วันกำหนดส่งไม่ถูกต้อง" };
    }
  }

  const allowLate = allowLateStr === "true" || allowLateStr === "on";
  
  // Exam fields
  const isExamStr = formData.get("isExam") as string;
  const timeLimitStr = formData.get("timeLimit") as string;
  const allowMobileStr = formData.get("allowMobile") as string;
  const showSolutionsStr = formData.get("showSolutions") as string;
  const questionMode = formData.get("questionMode") as string || "INPUT";
  const isExam = isExamStr === "true" || isExamStr === "on";
  let timeLimit: number | null = null;
  if (isExam && timeLimitStr && timeLimitStr.trim() !== "") {
    timeLimit = parseInt(timeLimitStr, 10);
    if (isNaN(timeLimit) || timeLimit < 1) timeLimit = null;
  }
  const allowMobile = !isExam || (allowMobileStr === "true" || allowMobileStr === "on");
  const showSolutions = !isExam || (showSolutionsStr === "true" || showSolutionsStr === "on");

  try {
    // Verify teacher owns the classroom
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        teacherId: session.userId,
      },
    });

    if (!classroom) {
      return { success: false, error: "ไม่พบห้องเรียนนี้หรือคุณไม่มีสิทธิ์ในการสร้างการบ้านในห้องนี้" };
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        bandType,
        assignmentType,
        questionCount,
        dueDate,
        allowLate,
        isExam,
        timeLimit,
        allowMobile,
        showSolutions,
        questionMode,
        classroomId,
      },
    });

    await logSystemEvent("CREATE_ASSIGNMENT", "SUCCESS", `สร้างแบบฝึกหัด "${title}" ในห้องเรียนสำเร็จ`, session.userId);

    revalidatePath(`/classroom/${classroomId}`);
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Create assignment error:", error);
    await logSystemEvent("CREATE_ASSIGNMENT", "ERROR", `เกิดข้อผิดพลาดในการสร้างแบบฝึกหัด: ${error instanceof Error ? error.message : "Unknown error"}`, session.userId);
    return { success: false, error: "ไม่สามารถสั่งแบบฝึกหัดได้เนื่องจากข้อผิดพลาดของระบบ" };
  }
}

/**
 * Submit assignment quiz (Learner only)
 */
export async function submitQuizAction(
  assignmentId: string,
  score: number,
  answers: any[],
  violationCount: number = 0,
  isAutoSubmitted: boolean = false
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ (เฉพาะผู้เรียนเท่านั้น)" };
  }

  try {
    // Verify assignment exists and student is enrolled in its classroom
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { classroom: true },
    });

    if (!assignment) {
      return { success: false, error: "ไม่พบการมอบหมายแบบฝึกหัดนี้" };
    }

    // Verify due date and late submission allowance
    if (assignment.dueDate && new Date() > assignment.dueDate && !assignment.allowLate) {
      await logSystemEvent("SUBMIT_QUIZ", "ERROR", `พยายามส่งแบบฝึกหัด "${assignment.title}" ล่าช้าแต่ระบบปิดรับแล้ว`, session.userId);
      return { success: false, error: "เลยกำหนดส่งแล้วและผู้สอนปิดรับการส่งล่าช้า" };
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classroomId: {
          userId: session.userId,
          classroomId: assignment.classroomId,
        },
      },
    });

    if (!enrollment) {
      await logSystemEvent("SUBMIT_QUIZ", "ERROR", `พยายามส่งแบบฝึกหัด "${assignment.title}" โดยไม่ได้อยู่ในห้องเรียนนี้`, session.userId);
      return { success: false, error: "คุณไม่ได้อยู่ในห้องเรียนนี้" };
    }

    // Re-generate questions on the server side dynamically based on student ID and assignment ID
    const serverQuestions = generateSeededQuestions(
      session.userId,
      assignmentId,
      assignment.assignmentType || "RESISTOR",
      assignment.questionCount,
      assignment.questionMode || "INPUT",
      assignment.bandType
    );

    // Re-grade each answer on the server to prevent score tampering
    let calculatedScore = 0;
    const gradedAnswers = answers.map((attempt: any, index: number) => {
      const currentQuestion = serverQuestions[index];
      if (!currentQuestion) return attempt;

      const cleanAnswer = (attempt.userAnswer || "").trim();
      let isCorrect = false;

      if (cleanAnswer && !attempt.isTimeout) {
        if (assignment.assignmentType === "MULTIMETER" && currentQuestion.multimeterData) {
          const parsed = parseMultimeterAnswer(cleanAnswer, currentQuestion.multimeterData.range.type);
          if (parsed !== null) {
            const diff = Math.abs(parsed - currentQuestion.multimeterData.value);
            isCorrect = diff <= 0.001;
          }
        } else {
          const parsed = parseTextAnswer(cleanAnswer);
          if (parsed !== null && currentQuestion.resistance !== undefined) {
            const diff = Math.abs(parsed - currentQuestion.resistance);
            const limit = 0.01 * currentQuestion.resistance;
            isCorrect = diff <= limit;
          }
        }
      }

      if (isCorrect) {
        calculatedScore++;
      }

      return {
        ...attempt,
        question: currentQuestion, // Force the question data to match what was generated on server
        isCorrect,
      };
    });

    // Create submission with verified score
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: session.userId,
        score: calculatedScore,
        answers: JSON.stringify(gradedAnswers),
        violationCount,
        isAutoSubmitted,
      },
    });

    await logSystemEvent("SUBMIT_QUIZ", "SUCCESS", `ส่งแบบฝึกหัด "${assignment.title}" สำเร็จ ได้คะแนน ${calculatedScore}/${assignment.questionCount}`, session.userId);

    revalidatePath(`/classroom/${assignment.classroomId}`);
    return { success: true, data: submission };
  } catch (error) {
    console.error("Submit quiz error:", error);
    await logSystemEvent("SUBMIT_QUIZ", "ERROR", `เกิดข้อผิดพลาดในการบันทึกคำตอบแบบฝึกหัด: ${error instanceof Error ? error.message : "Unknown error"}`, session.userId);
    return { success: false, error: "ไม่สามารถบันทึกคำตอบได้เนื่องจากข้อผิดพลาดของระบบ" };
  }
}

export async function getUserClassroomsAction() {
  const session = await getSession();
  if (!session) return [];
  try {
    if (session.role === "TEACHER") {
      return await prisma.classroom.findMany({
        where: { teacherId: session.userId },
        select: { id: true, name: true, code: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: session.userId },
        include: {
          classroom: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return enrollments.map((enr: { classroom: any; }) => enr.classroom);
    }
  } catch (e) {
    return [];
  }
}

/**
 * Action to update a classroom (Teacher only)
 */
export async function updateClassroomAction(
  classroomId: string,
  name: string,
  description: string | null
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
  }

  if (!name || name.trim().length < 2) {
    return { success: false, error: "ชื่อห้องเรียนต้องมีตัวอักษรอย่างน้อย 2 ตัว" };
  }

  try {
    // Verify owner if not ADMIN
    const existing = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        ...(session.role !== "ADMIN" && { teacherId: session.userId }),
      },
    });

    if (!existing) {
      return { success: false, error: "ไม่พบห้องเรียนนี้หรือคุณไม่มีสิทธิ์ในการดำเนินการ" };
    }

    const updated = await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath(`/classroom`);
    revalidatePath(`/classroom/${classroomId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update classroom error:", error);
    return { success: false, error: "ไม่สามารถอัปเดตข้อมูลห้องเรียนได้เนื่องจากข้อผิดพลาดของระบบ" };
  }
}

/**
 * Action to delete a classroom (Teacher only)
 */
export async function deleteClassroomAction(
  classroomId: string,
  confirmText: string
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
  }

  if (confirmText !== "DELETE") {
    return { success: false, error: "กรุณาพิมพ์ยืนยันให้ถูกต้อง" };
  }

  try {
    // Verify owner if not ADMIN
    const existing = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        ...(session.role !== "ADMIN" && { teacherId: session.userId }),
      },
    });

    if (!existing) {
      return { success: false, error: "ไม่พบห้องเรียนนี้หรือคุณไม่มีสิทธิ์ในการดำเนินการ" };
    }

    await prisma.classroom.delete({
      where: { id: classroomId },
    });

    revalidatePath(`/classroom`);
    return { success: true };
  } catch (error) {
    console.error("Delete classroom error:", error);
    return { success: false, error: "ไม่สามารถลบห้องเรียนได้เนื่องจากข้อผิดพลาดของระบบ" };
  }
}


export async function updateAssignmentAction(
  assignmentId: string,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ (เฉพาะผู้สอนเท่านั้น)" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const bandType = formData.get("bandType") as string;
  const assignmentType = formData.get("assignmentType") as string || "RESISTOR";
  const questionCountStr = formData.get("questionCount") as string;
  const dueDateStr = formData.get("dueDate") as string;
  const allowLateStr = formData.get("allowLate") as string;
  const timeLimitStr = formData.get("timeLimit") as string;
  const allowMobileStr = formData.get("allowMobile") as string;
  const showSolutionsStr = formData.get("showSolutions") as string;
  const questionMode = formData.get("questionMode") as string || "INPUT";

  if (!title || title.trim().length < 2) {
    return { success: false, error: "กรุณากรอกหัวข้อแบบฝึกหัดอย่างน้อย 2 ตัวอักษร" };
  }
  if (bandType !== "4" && bandType !== "5") {
    return { success: false, error: "รูปแบบแถบสีไม่ถูกต้อง" };
  }
  const questionCount = parseInt(questionCountStr, 10);
  if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
    return { success: false, error: "จำนวนข้อไม่ถูกต้อง (กำหนดได้ 1-50 ข้อ)" };
  }

  let dueDate: Date | null = null;
  if (dueDateStr && dueDateStr.trim() !== "") {
    const localDateStr = dueDateStr.includes("T") && !dueDateStr.includes("Z") && !dueDateStr.includes("+")
      ? `${dueDateStr}:00+07:00`
      : dueDateStr;
    dueDate = new Date(localDateStr);
    if (isNaN(dueDate.getTime())) {
      return { success: false, error: "วันกำหนดส่งไม่ถูกต้อง" };
    }
  }

  const allowLate = allowLateStr === "true" || allowLateStr === "on";

  try {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { classroom: true },
    });

    if (!existing || existing.classroom.teacherId !== session.userId) {
      return { success: false, error: "ไม่พบแบบฝึกหัด หรือไม่มีสิทธิ์ในการดำเนินการ" };
    }

    let timeLimit: number | null = existing.timeLimit;
    if (existing.isExam && timeLimitStr !== null) {
      if (timeLimitStr.trim() === "") {
        timeLimit = null;
      } else {
        const parsed = parseInt(timeLimitStr, 10);
        timeLimit = isNaN(parsed) || parsed < 1 ? null : parsed;
      }
    }

    const allowMobile = existing.isExam
      ? (allowMobileStr === "true" || allowMobileStr === "on")
      : true;

    const showSolutions = existing.isExam
      ? (showSolutionsStr === "true" || showSolutionsStr === "on")
      : true;

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title,
        description: description || null,
        bandType,
        assignmentType,
        questionCount,
        dueDate,
        allowLate,
        timeLimit,
        allowMobile,
        showSolutions,
        questionMode,
      },
    });

    revalidatePath(`/classroom/${existing.classroomId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update assignment error:", error);
    return { success: false, error: "ไม่สามารถอัปเดตแบบฝึกหัดได้" };
  }
}

export async function deleteAssignmentAction(
  assignmentId: string
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return { success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ (เฉพาะผู้สอนเท่านั้น)" };
  }

  try {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { classroom: true },
    });

    if (!existing || existing.classroom.teacherId !== session.userId) {
      return { success: false, error: "ไม่พบแบบฝึกหัด หรือไม่มีสิทธิ์ในการดำเนินการ" };
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath(`/classroom/${existing.classroomId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete assignment error:", error);
    return { success: false, error: "ไม่สามารถลบแบบฝึกหัดได้" };
  }
}
