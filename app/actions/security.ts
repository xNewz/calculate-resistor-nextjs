"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { clearAttempts } from "@/lib/rateLimit";

// Utility to check admin auth
async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น");
  }
  return user;
}

export async function getBannedIPsAction() {
  try {
    await checkAdmin();
    const bannedIPs = await prisma.bannedIP.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bannedBy: {
          select: { name: true }
        }
      }
    });

    // Cleanup expired bans while we're here (passive cleanup)
    const now = new Date();
    const expiredBans = bannedIPs.filter(b => b.expiresAt && b.expiresAt < now);
    if (expiredBans.length > 0) {
      await prisma.bannedIP.deleteMany({
        where: { ip: { in: expiredBans.map(b => b.ip) } }
      });
      // Filter out the expired ones from the returned list
      return { success: true, bannedIPs: bannedIPs.filter(b => !b.expiresAt || b.expiresAt >= now) };
    }

    return { success: true, bannedIPs };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch banned IPs" };
  }
}

export async function banIPAction(formData: FormData) {
  try {
    const admin = await checkAdmin();
    const ip = formData.get("ip") as string;
    const reason = formData.get("reason") as string;
    const durationHours = parseInt(formData.get("duration") as string);

    if (!ip || !reason) {
      return { success: false, error: "กรุณากรอก IP และเหตุผล" };
    }

    let expiresAt: Date | null = null;
    if (durationHours > 0) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + durationHours);
    }

    await prisma.bannedIP.upsert({
      where: { ip },
      update: {
        reason,
        expiresAt,
        bannedById: admin.id,
        createdAt: new Date(),
      },
      create: {
        ip,
        reason,
        expiresAt,
        bannedById: admin.id,
      }
    });

    await prisma.systemLog.create({
      data: {
        action: "MANUAL_BAN",
        status: "SUCCESS",
        details: `แบน IP: ${ip} (เหตุผล: ${reason}, ระยะเวลา: ${durationHours > 0 ? durationHours + " ชม." : "ถาวร"})`,
        userId: admin.id,
      }
    });

    revalidatePath("/admin/security");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to ban IP" };
  }
}

export async function unbanIPAction(ip: string) {
  try {
    const admin = await checkAdmin();
    
    await prisma.bannedIP.delete({
      where: { ip }
    });

    // Also clear from in-memory rate limit if present
    clearAttempts(ip);

    await prisma.systemLog.create({
      data: {
        action: "UNBAN_IP",
        status: "SUCCESS",
        details: `ปลดแบน IP: ${ip}`,
        userId: admin.id,
      }
    });

    revalidatePath("/admin/security");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unban IP" };
  }
}

// Internal function used by auth.ts
export async function checkIPBanStatus(ip: string): Promise<boolean> {
  const ban = await prisma.bannedIP.findUnique({
    where: { ip }
  });

  if (!ban) return false;

  if (ban.expiresAt && ban.expiresAt < new Date()) {
    // Ban expired
    await prisma.bannedIP.delete({ where: { ip } });
    clearAttempts(ip);
    return false;
  }

  return true; // Still banned
}

// Internal function used by auth.ts
export async function autoBanIP(ip: string) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins

  await prisma.bannedIP.upsert({
    where: { ip },
    update: {
      reason: "SYSTEM_BRUTE_FORCE",
      expiresAt,
      bannedById: null,
      createdAt: new Date(),
    },
    create: {
      ip,
      reason: "SYSTEM_BRUTE_FORCE",
      expiresAt,
      bannedById: null,
    }
  });
}
