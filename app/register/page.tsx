"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, Mail, User, ShieldAlert, Loader2, Zap } from "lucide-react";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("role", "LEARNER");

    startTransition(async () => {
      const result = await registerAction(null, formData);
      if (result.success) {
        // Redirect to classroom page
        router.push("/classroom");
        router.refresh();
      } else {
        if (result.error) {
          setError(result.error);
        }
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 overflow-hidden py-10">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="relative w-full max-w-md z-10 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Zap className="size-7 text-indigo-400" />
          </div>
        </div>

        <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-zinc-100">
              สร้างบัญชีใหม่
            </CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              ลงทะเบียนเพื่อเข้าใช้งานระบบเครื่องคำนวณและห้องเรียน
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  ชื่อ-นามสกุล
                </Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="นายเรียนดี ขยันยิ่ง"
                    className="pl-11 h-12 rounded-xl bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 hover:bg-zinc-900 transition-all duration-200 shadow-inner"
                    required
                  />
                </div>
                {fieldErrors.name && (
                  <span className="text-xs text-red-400 ml-1 font-medium">{fieldErrors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  อีเมล
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="student@school.ac.th"
                    className="pl-11 h-12 rounded-xl bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 hover:bg-zinc-900 transition-all duration-200 shadow-inner"
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <span className="text-xs text-red-400 ml-1 font-medium">{fieldErrors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  รหัสผ่าน
                </Label>
                <div className="relative group">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-xl bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 hover:bg-zinc-900 transition-all duration-200 shadow-inner tracking-widest"
                    required
                  />
                </div>
                {fieldErrors.password && (
                  <span className="text-xs text-red-400 ml-1 font-medium">{fieldErrors.password}</span>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 mt-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold transition-all duration-200 shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] rounded-xl text-base"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    กำลังลงทะเบียน...
                  </span>
                ) : (
                  "ลงทะเบียน"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900/80 px-2 text-zinc-500 font-medium">หรือลงทะเบียนด้วย</span>
                </div>
              </div>

              <GoogleLoginButton mode="login" />

              <div className="text-center pt-4 text-sm text-zinc-500 border-t border-zinc-800/80 mt-2">
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
                  เข้าสู่ระบบที่นี่
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

