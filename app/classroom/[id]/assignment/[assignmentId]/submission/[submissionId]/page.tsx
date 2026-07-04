import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SubmissionReview from "./SubmissionReview";

export const dynamic = "force-dynamic";

interface SubmissionPageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
    submissionId: string;
  }>;
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { id: classroomId, assignmentId, submissionId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch submission details
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          classroom: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (
    !submission ||
    submission.assignmentId !== assignmentId ||
    submission.assignment.classroomId !== classroomId
  ) {
    redirect(`/classroom/${classroomId}`);
  }

  // Authorization check
  if (user.role === "TEACHER") {
    // Teacher must own the classroom
    if (submission.assignment.classroom.teacherId !== user.id) {
      redirect("/classroom");
    }
  } else {
    // Learner can only view their own submissions
    if (submission.studentId !== user.id) {
      redirect(`/classroom/${classroomId}`);
    }
  }

  // Parse attempts
  let attempts: any[] = [];
  try {
    if (typeof submission.answers === "string") {
      attempts = JSON.parse(submission.answers);
    } else {
      attempts = submission.answers as any[];
    }
  } catch (e) {
    console.error("Error parsing submission answers JSON:", e);
  }

  const isTeacherOrAdmin = user.role === "TEACHER" || user.role === "ADMIN";
  const showSolutions = isTeacherOrAdmin || submission.assignment.showSolutions;

  return (
    <SubmissionReview
      classroomId={classroomId}
      assignment={{
        id: submission.assignment.id,
        title: submission.assignment.title,
        questionCount: submission.assignment.questionCount,
        assignmentType: submission.assignment.assignmentType,
      }}
      submission={{
        id: submission.id,
        score: submission.score,
        createdAt: submission.createdAt,
      }}
      attempts={attempts}
      showSolutions={showSolutions}
    />
  );
}
