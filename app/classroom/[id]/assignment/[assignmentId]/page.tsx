import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssignmentQuiz from "./AssignmentQuiz";

export const dynamic = "force-dynamic";

interface AssignmentPageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id: classroomId, assignmentId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch assignment details
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.classroomId !== classroomId) {
    redirect(`/classroom/${classroomId}`);
  }

  // Check if past due and late submission is blocked
  if (assignment.dueDate && new Date() > new Date(assignment.dueDate) && !assignment.allowLate) {
    redirect(`/classroom/${classroomId}`);
  }

  // Teachers do not take quizzes, redirect to class detail
  if (user.role === "TEACHER") {
    redirect(`/classroom/${classroomId}`);
  }

  // Check if student is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_classroomId: {
        userId: user.id,
        classroomId: classroomId,
      },
    },
  });

  if (!enrollment) {
    redirect("/classroom");
  }

  // Check if already submitted
  const existingSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId,
      studentId: user.id,
    },
  });

  if (existingSubmission) {
    redirect(`/classroom/${classroomId}/assignment/${assignmentId}/submission/${existingSubmission.id}`);
  }

  return (
    <AssignmentQuiz
      classroomId={classroomId}
      assignment={{
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        bandType: assignment.bandType,
        assignmentType: assignment.assignmentType,
        questionCount: assignment.questionCount,
      }}
    />
  );
}
