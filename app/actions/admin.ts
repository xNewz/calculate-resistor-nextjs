"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Utility to check admin auth
async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น");
  }
  return user;
}

export async function getUsersAction() {
  try {
    await checkAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastActive: true,
        _count: {
          select: {
            classroomsCreated: true,
            enrollments: true,
          }
        }
      }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch users" };
  }
}

export async function adminUpdateUserRoleAction(id: string, role: "LEARNER" | "TEACHER" | "ADMIN") {
  try {
    const adminUser = await checkAdmin();
    
    // Prevent removing the last admin or changing own role
    if (adminUser.id === id && role !== "ADMIN") {
      return { success: false, error: "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้" };
    }

    await prisma.user.update({
      where: { id },
      data: { role },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update user role" };
  }
}

export async function adminDeleteUserAction(id: string) {
  try {
    const adminUser = await checkAdmin();
    
    if (adminUser.id === id) {
      return { success: false, error: "ไม่สามารถลบบัญชีตนเองได้" };
    }

    await prisma.user.delete({
      where: { id },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete user" };
  }
}

export async function adminCreateUserAction(formData: FormData) {
  try {
    await checkAdmin();
    
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "LEARNER" | "TEACHER" | "ADMIN";

    if (!email || !name || !password || password.length < 6) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน หรือรหัสผ่านสั้นเกินไป" };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create user" };
  }
}

export async function getAdminDashboardStatsAction() {
  try {
    await checkAdmin();

    const [
      totalUsers,
      adminUsers,
      teacherUsers,
      learnerUsers,
      totalClassrooms,
      totalEnrollments,
      totalAssignments,
      totalSubmissions,
      recentUsers,
      recentClassrooms
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "LEARNER" } }),
      prisma.classroom.count(),
      prisma.enrollment.count(),
      prisma.assignment.count(),
      prisma.submission.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      prisma.classroom.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true, teacher: { select: { name: true } } }
      })
    ]);

    return {
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admin: adminUsers,
          teacher: teacherUsers,
          learner: learnerUsers
        },
        classrooms: totalClassrooms,
        enrollments: totalEnrollments,
        assignments: totalAssignments,
        submissions: totalSubmissions,
        recentUsers,
        recentClassrooms
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch dashboard stats" };
  }
}
