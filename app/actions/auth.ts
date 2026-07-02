"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { encrypt, getSession } from "@/lib/auth";


export type AuthState = {
  success: boolean;
  error?: string;
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
      return {
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้วในระบบ",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: roleInput as "LEARNER" | "TEACHER",
      },
    });

    // Create session token
    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // Create session token
    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
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

    return { success: true };
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
    role: session.role,
  };
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

    // If changing password, currentPassword must match
    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return { success: false, error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
      }
      if (!currentPassword) {
        return { success: false, error: "กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน" };
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return { success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
      }
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


