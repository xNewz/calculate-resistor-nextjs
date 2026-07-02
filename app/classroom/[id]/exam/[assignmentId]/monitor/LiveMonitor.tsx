"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getExamViolationsAction } from "@/app/actions/exam";
import { Activity, AlertTriangle, ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LiveMonitor({ assignment }: { assignment: any }) {
  const [violations, setViolations] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViolations = async () => {
    const res = await getExamViolationsAction(assignment.id);
    if (res.success && res.data) {
      setViolations(res.data.violations);
      setSubmissions(res.data.submissions);
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
                {violations.map((v) => (
                  <div key={v.id} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/60 border border-red-900/30">
                    <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="size-4 text-red-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200 text-sm">{v.student.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(v.createdAt).toLocaleTimeString("th-TH")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {v.type === "TAB_SWITCH" && "สลับหน้าจอ (พับหน้าจอ / เปิดแท็บอื่น)"}
                        {v.type === "FULLSCREEN_EXIT" && "ออกจากโหมดเต็มจอ"}
                        {v.type === "COPY_PASTE" && "พยายามคัดลอก หรือ วางข้อความ"}
                        {v.type === "CONTEXT_MENU" && "พยายามเปิดเมนูคลิกขวา"}
                      </p>
                      {v.details && (
                        <p className="text-[10px] text-zinc-500 mt-1">{v.details}</p>
                      )}
                    </div>
                  </div>
                ))}
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
                  ทำเสร็จแล้ว {submissions.length} คน
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

      </div>
    </div>
  );
}
