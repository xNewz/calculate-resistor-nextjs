"use server";

import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { encrypt, getSession } from "@/lib/auth";
import { logSystemEvent } from "@/lib/logger";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/rateLimit";
import { checkIPBanStatus, autoBanIP } from "./security";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export type AuthState = {
  success: boolean;
  error?: string;
  role?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
  };
};

export async function registerAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const roleInput = formData.get("role") as string;

  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown-ip";
  
  const isBannedDB = await checkIPBanStatus(ip);
  if (isBannedDB) {
    return { success: false, error: "IP ของคุณถูกระงับการใช้งานชั่วคราว" };
  }

  const rateLimitKey = `register:${ip}`;

  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    return { success: false, error: "ทำรายการบ่อยเกินไป กรุณารอสักครู่ (15 นาที) แล้วลองใหม่" };
  }

  // Simple validation
  const errors: Record<string, string> = {};
  if (!email || !email.includes("@")) {
    errors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
  }
  if (!password || password.length < 6) {
    errors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
  }
  if (!name || name.trim().length < 2) {
    errors.name = "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร";
  }
  if (roleInput !== "LEARNER") {
    return {
      success: false,
      error: "ระบบไม่อนุญาตให้ผู้เรียนสมัครสมาชิกเป็นผู้สอนเองได้ กรุณาติดต่อครูแอดมินผู้ดูแลระบบ",
    };
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors };
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const justBlocked = recordFailedAttempt(rateLimitKey);
      if (justBlocked) {
        await autoBanIP(ip);
        await logSystemEvent("REGISTER_BRUTE_FORCE", "ERROR", `ตรวจพบสแปมการสมัครสมาชิกจาก IP: ${ip} (อีเมล: ${email})`);
      } else {
        await logSystemEvent("REGISTER_FAILED", "WARNING", `สมัครสมาชิกไม่สำเร็จ: อีเมล ${email} มีในระบบแล้ว (IP: ${ip})`);
      }
      return {
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้วในระบบ",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user without logging in immediately
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: roleInput as "LEARNER" | "TEACHER",
      },
    });

    // Generate Verification Token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send Verification Email
    await sendVerificationEmail(email, token);

    clearAttempts(rateLimitKey);
    await logSystemEvent("REGISTER_SUCCESS", "SUCCESS", `สมัครสมาชิกสำเร็จ (รอการยืนยันอีเมล) สำหรับอีเมล ${email} (IP: ${ip})`, user.id);

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email) {
    return { success: false, error: "กรุณากรอกอีเมล" };
  }
  if (!password) {
    return { success: false, error: "กรุณากรอกรหัสผ่าน" };
  }

  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown-ip";
  
  const isBannedDB = await checkIPBanStatus(ip);
  if (isBannedDB) {
    return { success: false, error: "IP ของคุณถูกระงับการใช้งานชั่วคราว" };
  }

  const rateLimitKey = `login:${email}:${ip}`;

  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    return { success: false, error: "เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป บัญชีถูกระงับชั่วคราวเป็นเวลา 15 นาที" };
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const justBlocked = recordFailedAttempt(rateLimitKey);
      if (justBlocked) {
        await autoBanIP(ip);
        await logSystemEvent("LOGIN_BRUTE_FORCE", "ERROR", `ตรวจพบการสุ่มรหัสผ่าน (Brute Force) สำหรับอีเมล ${email} จาก IP: ${ip}`);
      } else {
        await logSystemEvent("LOGIN_FAILED", "WARNING", `เข้าสู่ระบบไม่สำเร็จ: ไม่พบผู้ใช้งาน ${email} (IP: ${ip})`);
      }
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    if (!user.password) {
      return { success: false, error: "บัญชีนี้เชื่อมต่อกับ Google โปรดเข้าสู่ระบบด้วย Google หรือตั้งรหัสผ่านใหม่" };
    }

    if (!user.emailVerified) {
      return { success: false, error: "บัญชีของคุณยังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบกล่องจดหมาย หรือขอลิงก์ยืนยันใหม่", fieldErrors: { email: "NOT_VERIFIED" } };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const justBlocked = recordFailedAttempt(rateLimitKey);
      if (justBlocked) {
        await autoBanIP(ip);
        await logSystemEvent("LOGIN_BRUTE_FORCE", "ERROR", `ตรวจพบการสุ่มรหัสผ่าน (Brute Force) สำหรับอีเมล ${email} จาก IP: ${ip}`);
      } else {
        await logSystemEvent("LOGIN_FAILED", "WARNING", `เข้าสู่ระบบไม่สำเร็จ: รหัสผ่านผิดสำหรับ ${email} (IP: ${ip})`);
      }
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // Create session token
    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
      role: user.role,
    });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Save cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    clearAttempts(rateLimitKey);
    await logSystemEvent("LOGIN_SUCCESS", "SUCCESS", `เข้าสู่ระบบสำเร็จ (IP: ${ip})`, user.id);

    return { success: true, role: user.role };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

export async function getSessionAction() {
  const session = await getSession();
  if (!session) return null;
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    image: session.image,
    role: session.role,
  };
}

export async function pingAction() {
  try {
    const session = await getSession();
    if (!session) return { success: false };

    // Update last active
    await prisma.user.update({
      where: { id: session.userId },
      data: { lastActive: new Date() },
    });
    
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateProfileAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "ยังไม่ได้เข้าสู่ระบบ" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  const errors: Record<string, string> = {};
  if (!name || name.trim().length < 2) {
    errors.name = "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร";
  }
  if (!email || !email.includes("@")) {
    errors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors };
  }

  try {
    // Find the user in DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้งาน" };
    }

    // Check if email has changed and if it is already taken
    if (email !== user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return { success: false, error: "อีเมลนี้ถูกใช้งานแล้วโดยผู้ใช้อื่น" };
      }
    }

    let hashedPassword = user.password;

    // If changing password
    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return { success: false, error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
      }
      
      if (user.password) {
        // Has existing password, requires current password
        if (!currentPassword) {
          return { success: false, error: "กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน" };
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return { success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
        }
      }
      // If user.password is null, we just set the new password without checking current
      
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Re-encrypt session token
    const token = await encrypt({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      image: updatedUser.image || undefined,
      role: updatedUser.role,
    });

    // Save cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว" };
  }
}

export async function resendVerificationAction(email: string): Promise<AuthState> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "กรุณากรอกอีเมลให้ถูกต้อง" };
  }

  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown-ip";
  
  const rateLimitKey = `resend-verify:${ip}`;
  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    return { success: false, error: "ทำรายการบ่อยเกินไป กรุณารอสักครู่ (15 นาที) แล้วลองใหม่" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal user existence, just return success
      return { success: true }; 
    }

    if (user.emailVerified) {
      return { success: false, error: "อีเมลนี้ได้รับการยืนยันแล้ว สามารถเข้าสู่ระบบได้เลย" };
    }

    // Check existing token
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });

    let token = "";
    if (existingToken && existingToken.expires > new Date()) {
      token = existingToken.token;
    } else {
      if (existingToken) {
        await prisma.verificationToken.delete({ where: { id: existingToken.id } });
      }
      token = crypto.randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    }

    await sendVerificationEmail(email, token);
    return { success: true };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { success: false, error: "ระบบขัดข้อง ไม่สามารถส่งอีเมลได้" };
  }
}


