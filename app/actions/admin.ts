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
        image: true,
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
      recentClassrooms,
      activeUsersToday,
      bannedIPs,
      recentViolations,
      recentErrors,
      systemSettings
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
        select: { id: true, name: true, image: true, email: true, role: true, createdAt: true }
      }),
      prisma.classroom.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true, teacher: { select: { name: true } } }
      }),
      prisma.user.count({
        where: { lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }),
      prisma.bannedIP.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      }),
      prisma.examViolation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { student: { select: { name: true, image: true, email: true } }, assignment: { select: { title: true } } }
      }),
      prisma.systemLog.findMany({
        where: { status: "ERROR" },
        take: 5,
        orderBy: { createdAt: "desc" }
      }),
      prisma.systemSetting.findUnique({
        where: { id: "global" }
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
        recentClassrooms,
        activeUsersToday,
        bannedIPs,
        recentViolations,
        recentErrors,
        systemSettings
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch dashboard stats" };
  }
}

export async function getSystemLogsAction() {
  try {
    await checkAdmin();
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });
    return { success: true, logs };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch system logs" };
  }
}

export async function getSystemSettingsAction() {
  try {
    await checkAdmin();
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "global" }
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: "global" }
      });
    }

    return { success: true, settings };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch settings" };
  }
}

export async function updateSystemSettingsAction(formData: FormData) {
  try {
    const adminUser = await checkAdmin();

    const maintenanceModeStr = formData.get("maintenanceMode") as string;
    const announcementEnabledStr = formData.get("announcementEnabled") as string;
    const announcementText = formData.get("announcementText") as string;
    const announcementType = formData.get("announcementType") as string || "INFO";

    const maintenanceMode = maintenanceModeStr === "true" || maintenanceModeStr === "on";
    const announcementEnabled = announcementEnabledStr === "true" || announcementEnabledStr === "on";

    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {
        maintenanceMode,
        announcementEnabled,
        announcementText: announcementText || null,
        announcementType,
      },
      create: {
        id: "global",
        maintenanceMode,
        announcementEnabled,
        announcementText: announcementText || null,
        announcementType,
      }
    });

    // Log the change
    await prisma.systemLog.create({
      data: {
        action: "UPDATE_SETTINGS",
        status: "SUCCESS",
        details: `อัปเดตการตั้งค่าระบบ: Maintenance Mode=${maintenanceMode}, Announcement=${announcementEnabled}`,
        userId: adminUser.id,
      }
    });

    revalidatePath("/", "layout"); // Revalidate entire app structure
    return { success: true, settings };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update settings" };
  }
}
