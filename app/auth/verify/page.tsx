import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;

  if (!token || typeof token !== "string") {
    return <VerifyResult success={false} message="ลิงก์ยืนยันไม่ถูกต้อง" />;
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return <VerifyResult success={false} message="ไม่พบข้อมูลการยืนยันนี้ หรือถูกใช้งานไปแล้ว" />;
    }

    if (verificationToken.expires < new Date()) {
      return <VerifyResult success={false} message="ลิงก์ยืนยันนี้หมดอายุแล้ว กรุณาขอลิงก์ใหม่" />;
    }

    // Mark email as verified
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return <VerifyResult success={true} message="ยืนยันอีเมลสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว" />;
  } catch (error) {
    console.error("Verify token error:", error);
    return <VerifyResult success={false} message="เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง" />;
  }
}

function VerifyResult({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 p-4">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          {success ? (
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full animate-in zoom-in duration-500">
              <CheckCircle2 className="size-16" />
            </div>
          ) : (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-full animate-in zoom-in duration-500">
              <XCircle className="size-16" />
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight">
          {success ? "ยืนยันอีเมลสำเร็จ" : "การยืนยันล้มเหลว"}
        </h1>
        
        <p className="text-zinc-400">
          {message}
        </p>

        <div className="pt-4">
          <Link href="/auth/login">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl h-11">
              ไปที่หน้าเข้าสู่ระบบ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
