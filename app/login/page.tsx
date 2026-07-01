"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, Mail, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(null, formData);
      if (result.success) {
        // Redirect to classroom page
        router.push("/classroom");
        router.refresh();
      } else {
        if (result.error) {
          setError(result.error);
        }
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border-zinc-850 shadow-2xl rounded-2xl">
        <CardHeader className="space-y-1 pb-6 text-center border-b border-zinc-800/80">
          <CardTitle className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
            เข้าสู่ระบบ
          </CardTitle>
          <CardDescription className="text-zinc-400">
            ลงชื่อเข้าใช้เพื่อเข้าถึงห้องเรียนและบันทึกคะแนนสอบของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                อีเมล
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@domain.com"
                  className="pl-10 h-11 bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:ring-zinc-750/50 hover:bg-zinc-900 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  รหัสผ่าน
                </Label>
              </div>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="pl-10 h-11 bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:ring-zinc-750/50 hover:bg-zinc-900 transition-all duration-200"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all duration-200 cursor-pointer shadow-md rounded-xl"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary-foreground" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>

            <div className="text-center pt-2 text-xs text-zinc-400">
              ยังไม่มีบัญชีสมาชิก?{" "}
              <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                สมัครใช้งานฟรีที่นี่
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
