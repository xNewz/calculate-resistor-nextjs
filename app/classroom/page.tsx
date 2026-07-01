import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClassroomDashboard from "./ClassroomDashboard";

export const dynamic = "force-dynamic";

export default async function ClassroomPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  let classrooms: any[] = [];

  if (user.role === "ADMIN") {
    classrooms = await prisma.classroom.findMany({
      include: {
        teacher: {
          select: { name: true },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (user.role === "TEACHER") {
    classrooms = await prisma.classroom.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        classroom: {
          include: {
            teacher: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    classrooms = enrollments.map((enrollment: any) => enrollment.classroom);
  }

  return (
    <ClassroomDashboard
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      classrooms={classrooms}
    />
  );
}
