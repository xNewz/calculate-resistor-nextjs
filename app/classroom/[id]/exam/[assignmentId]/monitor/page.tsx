import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LiveMonitor from "./LiveMonitor";

export default async function ExamMonitorPage({
  params
}: {
  params: { id: string, assignmentId: string }
}) {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    redirect("/auth/login");
  }

  // Verify ownership or admin
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { classroom: true }
  });

  if (!assignment || !assignment.isExam) {
    redirect("/classroom");
  }

  if (session.role === "TEACHER" && assignment.classroom.teacherId !== session.userId) {
    redirect("/classroom");
  }

  return (
    <LiveMonitor assignment={assignment} />
  );
}
