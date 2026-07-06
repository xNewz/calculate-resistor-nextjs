"use server";

import { cookies, headers } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { encrypt, getSession } from "@/lib/auth";
import { logSystemEvent } from "@/lib/logger";

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export type GoogleAuthState = {
  success: boolean;
  error?: string;
  role?: string;
};

export async function googleLoginAction(credential: string): Promise<GoogleAuthState> {
  try {
    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown-ip";

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { success: false, error: "ไม่สามารถยืนยันตัวตนกับ Google ได้" };
    }

    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, update googleId and picture if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          image: picture || user.image,
          lastActive: new Date(),
        },
      });
      await logSystemEvent("GOOGLE_LOGIN_SUCCESS", "SUCCESS", `เข้าสู่ระบบด้วย Google สำเร็จ (IP: ${ip})`, user.id);
    } else {
      // New user
      user = await prisma.user.create({
        data: {
          email,
          name: name || "ผู้ใช้ Google",
          googleId,
          image: picture,
          role: "LEARNER", // Default role
          // password is left null because it's optional
        },
      });
      await logSystemEvent("GOOGLE_REGISTER_SUCCESS", "SUCCESS", `สมัครสมาชิกด้วย Google สำเร็จ (IP: ${ip})`, user.id);
    }

    // Create session token
    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
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

    return { success: true, role: user.role };
  } catch (error) {
    console.error("Google Login Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google" };
  }
}

export async function linkGoogleAccountAction(credential: string): Promise<GoogleAuthState> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { success: false, error: "ไม่สามารถยืนยันตัวตนกับ Google ได้" };
    }

    const { email, picture, sub: googleId } = payload;

    // Optional: You could check if this googleId is already linked to another account
    const existingLink = await prisma.user.findUnique({
      where: { googleId },
    });

    if (existingLink && existingLink.id !== session.userId) {
      return { success: false, error: "บัญชี Google นี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว" };
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        googleId,
        image: picture,
      },
    });

    // Re-encrypt session token with new image
    const token = await encrypt({
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown-ip";
    await logSystemEvent("GOOGLE_LINK_SUCCESS", "SUCCESS", `เชื่อมต่อบัญชี Google สำเร็จ (IP: ${ip})`, user.id);

    return { success: true };
  } catch (error) {
    console.error("Link Google Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อกับบัญชี Google" };
  }
}
