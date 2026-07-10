import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClassroomDetail from "./ClassroomDetail";

export const dynamic = "force-dynamic";

interface ClassroomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassroomDetailPage({ params }: ClassroomPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch classroom details
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!classroom) {
    redirect("/classroom");
  }

  // Authorization Check
  if (user.role === "ADMIN") {
    // Admin has access to all classrooms
  } else if (user.role === "TEACHER") {
    if (classroom.teacherId !== user.id) {
      redirect("/classroom");
    }
  } else {
    // Check if student is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classroomId: {
          userId: user.id,
          classroomId: id,
        },
      },
    });

    if (!enrollment) {
      redirect("/classroom");
    }
  }

  // Fetch enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classroomId: id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          badges: {
            select: {
              badgeId: true,
            }
          }
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  // Fetch assignments
  const assignments = await prisma.assignment.findMany({
    where: {
      classroomId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch submissions for this classroom's assignments
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        classroomId: id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <ClassroomDetail
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      classroom={{
        id: classroom.id,
        code: classroom.code,
        name: classroom.name,
        description: classroom.description,
        teacher: classroom.teacher,
      }}
      assignments={assignments}
      enrollments={enrollments}
      submissions={submissions}
    />
  );
}
