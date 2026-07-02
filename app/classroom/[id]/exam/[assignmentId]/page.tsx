import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ExamQuiz from "./ExamQuiz";

export default async function ExamPage({
  params
}: {
  params: { id: string, assignmentId: string }
}) {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    redirect("/auth/login");
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_classroomId: {
        userId: session.userId,
        classroomId: params.id,
      },
    },
  });

  if (!enrollment) {
    redirect("/classroom");
  }

  // Verify Assignment
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
  });

  if (!assignment || !assignment.isExam || assignment.classroomId !== params.id) {
    redirect(`/classroom/${params.id}`);
  }

  // Check if student already submitted
  const existingSub = await prisma.submission.findFirst({
    where: {
      assignmentId: assignment.id,
      studentId: session.userId,
    }
  });

  if (existingSub) {
    redirect(`/classroom/${params.id}/assignment/${assignment.id}/submission/${existingSub.id}`);
  }

  return (
    <ExamQuiz assignment={assignment} />
  );
}
