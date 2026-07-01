import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development-only-123456";
const key = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "LEARNER" | "TEACHER" | "ADMIN";
  [key: string]: unknown;
}

export async function encrypt(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT Decryption Error:", error);
    return null;
  }
}

/**
 * Gets the current authenticated user's session from cookies
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await decrypt(token);
}

/**
 * Gets full user data from database based on current session
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Clears the session cookie
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}
