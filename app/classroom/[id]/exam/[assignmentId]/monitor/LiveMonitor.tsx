"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getExamViolationsAction, sendExamWarningAction } from "@/app/actions/exam";
import { Activity, AlertTriangle, ArrowLeft, ShieldAlert, CheckCircle2, Send, Bell, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LiveMonitor({ assignment }: { assignment: any }) {
  const [violations, setViolations] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Send warning states
  const [warningStudent, setWarningStudent] = useState<{ id: string; name: string } | null>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchViolations = async () => {
    const res = await getExamViolationsAction(assignment.id);
    if (res.success && res.data) {
      setViolations(res.data.violations);
      setSubmissions(res.data.submissions);
      setTotalStudents(res.data.totalStudents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchViolations();
    // Poll every 3 seconds
    const interval = setInterval(() => {
      fetchViolations();
    }, 3000);

    return () => clearInterval(interval);
  }, [assignment.id]);

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningStudent || !warningMessage.trim()) return;

    setIsSending(true);
    setModalError(null);

    const res = await sendExamWarningAction(assignment.id, warningStudent.id, warningMessage);
    setIsSending(false);

    if (res.success) {
      setWarningStudent(null);
      setWarningMessage("");
      fetchViolations();
    } else {
      setModalError(res.error || "เกิดข้อผิดพลาดในการส่งคำเตือน");
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-zinc-900/60 p-6 rounded-2xl border border-zinc-850">
          <div className="space-y-1">
            <Link href={`/classroom/${assignment.classroomId}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 w-fit">
              <ArrowLeft className="size-3" /> กลับหน้าห้องเรียน
            </Link>
            <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
              <Activity className="size-6 text-red-500 animate-pulse" />
              Live Monitor: {assignment.title}
            </h1>
            <p className="text-sm text-zinc-400">
              หน้าต่างสำหรับผู้สอนเพื่อตรวจสอบการทุจริตแบบเรียลไทม์
            </p>
          </div>
          <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 px-3 py-1 font-bold">
            <div className="size-2 rounded-full bg-red-500 animate-pulse mr-2" />
            กำลังจับตาดู...
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Violations List */}
          <Card className="bg-zinc-900/40 border-zinc-850 h-[500px] flex flex-col">
          <CardHeader className="border-b border-zinc-850 pb-4">
            <CardTitle className="text-sm font-bold text-zinc-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-orange-400" />
                บันทึกการละเมิดกฎ (Real-time Logs)
              </div>
              <span className="text-xs text-zinc-500 font-normal">
                พบพฤติกรรมต้องสงสัย {violations.length} รายการ
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-10 text-center text-zinc-500 text-sm animate-pulse">
                กำลังโหลดข้อมูล...
              </div>
            ) : violations.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShieldAlert className="size-6 text-emerald-500/50" />
                </div>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">ยังไม่พบการละเมิดกฎ</p>
                  <p className="text-zinc-500 text-xs mt-1">นักเรียนทุกคนปฏิบัติตามกฎอย่างเคร่งครัด</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((v) => {
                  const isWarning = v.type === "TEACHER_WARNING";
                  return (
                    <div 
                      key={v.id} 
                      className={`flex items-start gap-4 p-4 rounded-xl bg-zinc-950/60 border ${
                        isWarning ? "border-amber-500/20" : "border-red-900/30"
                      }`}
                    >
                      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isWarning ? "bg-amber-550/10 text-amber-550" : "bg-red-500/10 text-red-500"
                      }`}>
                        {isWarning ? <Bell className="size-4" /> : <AlertTriangle className="size-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200 text-sm">
                            {isWarning ? `ส่งคำเตือนไปยัง: ${v.student.name}` : v.student.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(v.createdAt).toLocaleTimeString("th-TH")}
                          </span>
                        </div>
                        <p className={`text-xs ${isWarning ? "text-amber-400 font-bold" : "text-zinc-400"}`}>
                          {isWarning && "ส่งคำเตือนจากผู้สอน"}
                          {v.type === "TAB_SWITCH" && "สลับหน้าจอ (พับหน้าจอ / เปิดแท็บอื่น)"}
                          {v.type === "FULLSCREEN_EXIT" && "ออกจากโหมดเต็มจอ"}
                          {v.type === "COPY_PASTE" && "พยายามคัดลอก หรือ วางข้อความ"}
                          {v.type === "CONTEXT_MENU" && "พยายามเปิดเมนูคลิกขวา"}
                        </p>
                        {v.details && (
                          <p className={`text-[10px] mt-1 ${isWarning ? "text-zinc-300 italic font-bold" : "text-zinc-500"}`}>
                            {isWarning ? `"${v.details}"` : v.details}
                          </p>
                        )}
                        {!isWarning && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWarningStudent({ id: v.studentId, name: v.student.name })}
                            className="mt-2 h-7 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 text-[10px] font-bold rounded-lg px-2.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Send className="size-3" />
                            <span>เตือนผู้เรียนรายนี้</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

          {/* Submissions List */}
          <Card className="bg-zinc-900/40 border-zinc-850 h-[500px] flex flex-col">
            <CardHeader className="border-b border-zinc-850 pb-4">
              <CardTitle className="text-sm font-bold text-zinc-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  ส่งข้อสอบแล้ว (Live Submissions)
                </div>
                <span className="text-xs text-zinc-500 font-normal">
                  ทำเสร็จแล้ว {submissions.length} / {totalStudents} คน
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-10 text-center text-zinc-500 text-sm animate-pulse">
                  กำลังโหลดข้อมูล...
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="size-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <CheckCircle2 className="size-6 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-zinc-400 font-semibold text-sm">ยังไม่มีผู้ส่งข้อสอบ</p>
                    <p className="text-zinc-500 text-xs mt-1">กำลังรอผู้เรียนทำข้อสอบ...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const pct = Math.round((sub.score / assignment.questionCount) * 100);
                    const isPassed = pct >= 50;
                    return (
                      <div key={sub.id} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 transition-colors">
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${isPassed ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                          {sub.score}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200 text-sm">{sub.student.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(sub.createdAt).toLocaleTimeString("th-TH")}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">
                              คะแนน {sub.score} / {assignment.questionCount}
                            </span>
                            {sub.isAutoSubmitted && (
                              <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400 bg-red-500/10 px-1.5 py-0">
                                โดนบังคับส่ง
                              </Badge>
                            )}
                          </div>
                          
                          {sub.violationCount > 0 && (
                            <p className="text-[10px] text-orange-400 flex items-center gap-1">
                              <AlertTriangle className="size-3" /> แอบสลับจอ {sub.violationCount} ครั้ง
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* WARNING DIALOG MODAL */}
        {warningStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-850 pb-4 bg-zinc-900/40">
                <CardTitle className="text-sm font-bold text-orange-400 flex items-center gap-2">
                  <Bell className="size-4 animate-bounce" />
                  <span>ส่งคำเตือนไปยัง {warningStudent.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSendWarning} className="space-y-4">
                  {modalError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      ข้อความคำเตือน (คำแจ้งเตือนจะแสดงบนหน้าจอของผู้เรียนทันที)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={warningMessage}
                      onChange={(e) => setWarningMessage(e.target.value)}
                      placeholder="เช่น โปรดทำข้อสอบอย่างสุจริต ห้ามแอบสลับหน้าจอไปเปิดแท็บอื่นเด็ดขาด"
                      className="w-full p-3 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-zinc-650 focus:border-orange-500/30 transition-all font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setWarningStudent(null);
                        setWarningMessage("");
                        setModalError(null);
                      }}
                      className="h-9 px-4 text-xs hover:bg-zinc-900 text-zinc-450 font-bold rounded-lg cursor-pointer"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSending || !warningMessage.trim()}
                      className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>กำลังส่ง...</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5" />
                          <span>ส่งคำเตือน</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
