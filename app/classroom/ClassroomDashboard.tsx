"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClassroomAction, joinClassroomAction } from "@/app/actions/classroom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Presentation,
  Plus,
  Compass,
  ArrowRight,
  BookOpen,
  Users,
  Copy,
  Check,
  QrCode,
  AlertCircle,
  Loader2,
  FolderOpen,
  ShieldAlert
} from "lucide-react";
import QRScanner from "@/components/QRScanner";

interface ClassroomDashboardProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: "LEARNER" | "TEACHER" | "ADMIN";
  };
  classrooms: any[];
}

export default function ClassroomDashboard({ user, classrooms }: ClassroomDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // Copy Code Helper
  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Submit Create Class Form
  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createClassroomAction(null, formData);
      if (res.success) {
        setShowCreateModal(false);
        router.refresh();
      } else {
        setError(res.error || "ไม่สามารถสร้างชั้นเรียนได้");
      }
    });
  };

  // Submit Join Class Form
  const handleJoinClass = async (e?: React.FormEvent<HTMLFormElement>, codeToUse?: string) => {
    if (e) e.preventDefault();
    setError(null);

    const code = codeToUse || inviteCode;
    if (!code) {
      setError("กรุณากรอกรหัสห้องเรียน");
      return;
    }

    const formData = new FormData();
    formData.set("code", code);

    startTransition(async () => {
      const res = await joinClassroomAction(null, formData);
      if (res.success) {
        setShowJoinModal(false);
        setInviteCode("");
        router.refresh();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการเข้าร่วมห้องเรียน");
      }
    });
  };

  // Handle Scan Success
  const handleScanSuccess = (code: string) => {
    setShowScanner(false);
    setInviteCode(code);
    // Auto submit the join request
    handleJoinClass(undefined, code);
  };

  return (
    <div className="min-h-screen lg:min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Card / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-850 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              user.role === "TEACHER" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
              : user.role === "ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {user.role === "TEACHER" ? <Presentation className="size-6" /> : user.role === "ADMIN" ? <ShieldAlert className="size-6" /> : <GraduationCap className="size-6" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>ยินดีต้อนรับ, {user.name}</span>
              </h1>
              <p className="text-xs text-zinc-400">
                สิทธิ์การใช้งาน: {user.role === "TEACHER" ? "ผู้สอน" : user.role === "ADMIN" ? "แอดมิน" : "นักเรียน"} | {user.email}
              </p>
            </div>
          </div>

          {user.role === "TEACHER" ? (
            <Button
              onClick={() => { setError(null); setShowCreateModal(true); }}
              className="w-full sm:w-auto h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all duration-200 cursor-pointer shadow-md rounded-xl gap-2 text-xs"
            >
              <Plus className="size-4 text-primary-foreground stroke-[3px]" />
              <span>สร้างชั้นเรียน</span>
            </Button>
          ) : user.role === "ADMIN" ? null : (
            <Button
              onClick={() => { setError(null); setShowJoinModal(true); }}
              className="w-full sm:w-auto h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all duration-200 cursor-pointer shadow-md rounded-xl gap-2 text-xs"
            >
              <Compass className="size-4 text-primary-foreground stroke-[3px]" />
              <span>เข้าร่วมชั้นเรียน</span>
            </Button>
          )}
        </div>

        {/* Dashboard Title */}
        {(classrooms.length > 0 || user.role === "LEARNER") && (
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="size-5 text-indigo-400" />
              <span>
                {user.role === "ADMIN" ? "ห้องเรียนทั้งหมดในระบบ"
                  : user.role === "TEACHER" ? "ห้องเรียนที่จัดการ"
                  : "ห้องเรียนของคุณ"} ({classrooms.length})
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              {user.role === "TEACHER"
                ? "คลิกห้องเรียนเพื่อสั่งแบบฝึกหัด หรือตรวจสอบคะแนนสะสมของนักเรียน"
                : user.role === "ADMIN"
                ? "ภาพรวมห้องเรียนทั้งหมดที่มีในระบบ คลิกเพื่อดูรายละเอียด"
                : "สแกนรหัสและคลิกห้องเรียนเพื่อทำแบบทดสอบรหัสแถบสีสะสมคะแนน"}
            </p>
          </div>
        )}

        {/* Classrooms Grid */}
        {classrooms.length === 0 ? (
            <Card className="bg-zinc-900/20 border-dashed border-zinc-800 text-center p-12 rounded-2xl">
              <FolderOpen className="size-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-zinc-400">ยังไม่มีห้องเรียนในตอนนี้</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-[340px] mx-auto">
                {user.role === "TEACHER"
                  ? "เริ่มต้นด้วยการสร้างห้องเรียนใหม่ เพื่อแจกรหัสห้องเรียนให้แก่ผู้เรียนของคุณ"
                  : user.role === "ADMIN"
                  ? "ยังไม่มีห้องเรียนในระบบ ผู้สอนจะเป็นผู้สร้างห้องเรียน"
                  : "กรอกรหัสเชิญชวนห้องเรียน หรือสแกน QR Code จากอาจารย์ของคุณเพื่อเข้าเรียน"}
              </p>
              <div className="mt-5 flex justify-center">
                {user.role === "TEACHER" ? (
                  <Button onClick={() => setShowCreateModal(true)} variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-xs">
                    สร้างห้องเรียนห้องแรก
                  </Button>
                ) : user.role === "ADMIN" ? null : (
                  <div className="flex gap-2">
                    <Button onClick={() => setShowJoinModal(true)} variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-xs">
                      กรอกรหัสเข้าร่วม
                    </Button>
                    <Button onClick={() => { setShowJoinModal(true); setShowScanner(true); }} variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-xs gap-1">
                      <QrCode className="size-3.5" />
                      <span>สแกนกล้อง</span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classrooms.map((cls) => (
              <Link key={cls.id} href={`/classroom/${cls.id}`} className="group block">
                <Card className="bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-850 group-hover:border-zinc-700/60 transition-all duration-300 rounded-xl overflow-hidden shadow-md flex flex-col h-full">
                  <CardHeader className="pb-3 border-b border-zinc-850">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                          {cls.name}
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-[11px] mt-0.5 line-clamp-1">
                          {cls.description || "ไม่มีคำอธิบายห้องเรียน"}
                        </CardDescription>
                      </div>
                      
                      {user.role === "TEACHER" && (
                        <div
                          onClick={(e) => handleCopyCode(e, cls.code)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] font-mono font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          title="คลิกเพื่อคัดลอกรหัสเข้าห้องเรียน"
                        >
                          <span>{cls.code}</span>
                          {copiedCode === cls.code ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-grow flex flex-col justify-between gap-4 text-xs">
                    <div className="flex flex-wrap gap-2 text-zinc-400">
                      {user.role === "TEACHER" ? (
                        <>
                          <span className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-850 py-1 px-2.5 rounded-full text-[10px]">
                            <Users className="size-3 text-zinc-500" />
                            <span>ผู้เรียน: {cls._count?.enrollments || 0} คน</span>
                          </span>
                          <span className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-850 py-1 px-2.5 rounded-full text-[10px]">
                            <BookOpen className="size-3 text-zinc-500" />
                            <span>แบบฝึก: {cls._count?.assignments || 0} ชิ้น</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-zinc-400">
                            ผู้สอน: <span className="font-semibold text-zinc-300">{cls.teacher?.name || "ไม่ระบุ"}</span>
                          </span>
                          <div className="ml-auto flex items-center gap-1 bg-zinc-950/60 border border-zinc-850 py-1 px-2.5 rounded-full text-[10px]">
                            <BookOpen className="size-3 text-zinc-500" />
                            <span>แบบฝึก: {cls._count?.assignments || 0} ชิ้น</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end text-[10px] font-bold text-zinc-500 group-hover:text-indigo-400 transition-colors pt-2">
                      <span>เข้าสู่ห้องเรียน</span>
                      <ArrowRight className="size-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* MODAL: CREATE CLASSROOM */}
        {showCreateModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-indigo-400 flex items-center gap-2">
                  <Presentation className="size-5" />
                  <span>สร้างห้องเรียนใหม่</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  ระบุรายละเอียดห้องเรียนเพื่อเชิญชวนผู้เรียนเข้าร่วม
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleCreateClass} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-zinc-400 uppercase">ชื่อห้องเรียน / วิชารหัสสี</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="เช่น ฟิสิกส์ ม.4/1, วิชาไมโครคอนโทรลเลอร์"
                      className="bg-zinc-950/60 border-zinc-800 h-10 text-xs focus:ring-zinc-750/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-semibold text-zinc-400 uppercase">รายละเอียด (ระบุหรือไม่ก็ได้)</Label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="เช่น ข้อมูลการเรียนแถบสีตัวต้านทาน 4/5 แถบสี"
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-zinc-900/60 transition-all duration-200"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                      className="h-9 px-4 text-xs hover:bg-zinc-800"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer rounded-lg shadow-sm"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          กำลังสร้าง...
                        </span>
                      ) : (
                        "สร้างห้องเรียน"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MODAL: JOIN CLASSROOM */}
        {showJoinModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-indigo-400 flex items-center gap-2">
                  <GraduationCap className="size-5" />
                  <span>เข้าร่วมชั้นเรียน</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  กรอกรหัสห้องเรียน 6 หลัก หรือ สแกน QR Code จากเครื่องอาจารย์ผู้สอน
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleJoinClass} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-xs font-semibold text-zinc-400 uppercase">รหัสเข้าห้องเรียน</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        placeholder="เช่น AB12CD"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="bg-zinc-950/60 border-zinc-800 h-11 text-center font-mono font-bold tracking-wider text-base focus:ring-zinc-750/50"
                        required
                      />
                      <Button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        variant="outline"
                        className="h-11 px-3 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 gap-1 text-xs"
                        title="เปิดกล้องสแกนคิวอาร์โค้ด"
                      >
                        <QrCode className="size-4 text-indigo-400" />
                        <span>สแกนกล้อง</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowJoinModal(false)}
                      className="h-9 px-4 text-xs hover:bg-zinc-800"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer rounded-lg shadow-sm"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          กำลังตรวจสอบ...
                        </span>
                      ) : (
                        "เข้าร่วมห้องเรียน"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* COMPONENT: CAMERA QR SCANNER */}
        {showScanner && (
          <QRScanner
            onScan={handleScanSuccess}
            onClose={() => setShowScanner(false)}
          />
        )}

      </div>
    </div>
  );
}
