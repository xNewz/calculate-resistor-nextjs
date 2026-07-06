"use client";

import React from "react";
import Link from "next/link";
import ResistorPreview from "@/components/ResistorPreview";
import MultimeterPreview from "@/components/MultimeterPreview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Trophy,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import {
  COLOR_MAP,
  DIGIT_MAP,
  MULTIPLIER_MAP,
  TOLERANCE_MAP,
  formatValue,
  formatMultiplierValue,
} from "@/lib/resistor";
import { MultimeterQuestion } from "@/lib/multimeter";

interface Question {
  id?: string;
  text?: string;
  type?: "CHOICE" | "TEXT";
  options?: string[];
  correctAnswer?: string;
  bands?: 4 | 5;
  colors?: string[];
  resistance?: number;
  formatted: string;
  tolerance?: number;
  multimeterData?: MultimeterQuestion;
}

interface UserAttempt {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  isTimeout: boolean;
}

interface SubmissionReviewProps {
  classroomId: string;
  assignment: {
    id: string;
    title: string;
    questionCount: number;
    assignmentType?: string;
    isExam?: boolean;
  };
  submission: {
    id: string;
    score: number;
    createdAt: Date;
    violationCount?: number;
    isAutoSubmitted?: boolean;
  };
  attempts: UserAttempt[];
  showSolutions: boolean;
  violations?: {
    id: string;
    type: string;
    details: string | null;
    createdAt: Date;
  }[];
}

export default function SubmissionReview({
  classroomId,
  assignment,
  submission,
  attempts,
  showSolutions,
  violations = [],
}: SubmissionReviewProps) {

  const getVerdict = (finalScore: number, total: number, type: string) => {
    const ratio = finalScore / total;
    if (type === "MULTIMETER") {
      if (ratio === 1) return { text: "ระดับเทพ! ตอบถูกครบทุกข้อ อ่านค่ามัลติมิเตอร์ได้แม่นยำไม่มีที่ติ 🎉", color: "text-indigo-400" };
      if (ratio >= 0.8) return { text: "ยอดเยี่ยมมาก! คุณมีความเข้าใจในการตั้งย่านวัดและอ่านหน้าปัดอย่างดีเยี่ยม 🌟", color: "text-emerald-400" };
      if (ratio >= 0.5) return { text: "ผ่านเกณฑ์! ฝึกฝนการอ่านสเกลอีกนิดจะช่วยเพิ่มความคล่องแคล่ว 💪", color: "text-yellow-400" };
      return { text: "ลองใหม่อีกครั้ง! ทบทวนวิธีอ่านค่ามัลติมิเตอร์เพื่อทำคะแนนให้ดียิ่งขึ้น 📚", color: "text-red-400" };
    }
    
    // Default / RESISTOR
    if (ratio === 1) return { text: "ระดับเทพ! ตอบถูกครบทุกข้อ แม่นยำและรวดเร็วไม่มีที่ติ 🎉", color: "text-indigo-400" };
    if (ratio >= 0.8) return { text: "ยอดเยี่ยมมาก! คุณมีความเข้าใจในรหัสสีอย่างดีเยี่ยม 🌟", color: "text-emerald-400" };
    if (ratio >= 0.5) return { text: "ผ่านเกณฑ์! ฝึกฝนอีกนิดจะช่วยเพิ่มความคล่องแคล่ว 💪", color: "text-yellow-400" };
    return { text: "ลองใหม่อีกครั้ง! ทบทวนตารางสีเพื่อทำคะแนนให้ดียิ่งขึ้น 📚", color: "text-red-400" };
  };

  const verdict = getVerdict(submission.score, assignment.questionCount, assignment.assignmentType ?? "RESISTOR");

  const renderExplanation = (q: Question) => {
    if (assignment.assignmentType === "MULTIMETER" && q.multimeterData) {
      const type = q.multimeterData.range.type;
      return (
        <div className="space-y-3 text-[11px] text-zinc-400 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 mt-3">
          <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
            <HelpCircle className="size-3.5 text-indigo-400" />
            <span>วิธีอ่านค่ามัลติมิเตอร์ (ย่านวัด {q.multimeterData.range.name}):</span>
          </h4>
          <p className="text-zinc-300">
            เข็มชี้ที่เลข <strong className="text-white">{q.multimeterData.pointerValue}</strong> บนสเกล
          </p>
          {type === "OHM" ? (
            <p className="text-zinc-300">
              นำค่าที่อ่านได้คูณด้วยตัวคูณย่านวัด (x{q.multimeterData.range.maxScale}) <br/>
              = {q.multimeterData.pointerValue} × {q.multimeterData.range.maxScale} = <strong className="text-emerald-400">{q.multimeterData.value} Ω</strong>
            </p>
          ) : (
            <p className="text-zinc-300">
              ย่านวัดตั้งไว้ที่ {q.multimeterData.range.name} (สเกลสูงสุด = {q.multimeterData.range.maxScale})<br/>
              = <strong className="text-emerald-400">{q.multimeterData.value} {type}</strong>
            </p>
          )}
        </div>
      );
    }



    const is5 = q.bands === 5;
    const first = q.colors![0];
    const second = q.colors![1];
    const third = is5 ? q.colors![2] : null;
    const mult = is5 ? q.colors![3] : q.colors![2];
    const tol = is5 ? q.colors![4] : q.colors![3];

    const d1 = DIGIT_MAP[first] ?? 0;
    const d2 = DIGIT_MAP[second] ?? 0;
    const d3 = third ? (DIGIT_MAP[third] ?? 0) : 0;
    const multiplierVal = MULTIPLIER_MAP[mult] ?? 1;
    const toleranceVal = TOLERANCE_MAP[tol] ?? 5;

    const info1 = COLOR_MAP[first];
    const info2 = COLOR_MAP[second];
    const info3 = third ? COLOR_MAP[third] : null;
    const infoMult = COLOR_MAP[mult];
    const infoTol = COLOR_MAP[tol];

    return (
      <div className="space-y-3 text-[11px] text-zinc-400 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 mt-3">
        <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
          <HelpCircle className="size-3.5 text-indigo-400" />
          <span>วิธีคำนวณรหัสสี ({q.bands} แถบสี):</span>
        </h4>
        <ul className="space-y-2 list-none pl-0">
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบที่ 1 (หลักที่ 1):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info1?.hex }} />
            <span className="font-semibold text-zinc-300">{info1?.nameTh} ({info1?.nameEn})</span>
            <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800">{d1}</Badge>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบที่ 2 (หลักที่ 2):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info2?.hex }} />
            <span className="font-semibold text-zinc-300">{info2?.nameTh} ({info2?.nameEn})</span>
            <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800">{d2}</Badge>
          </li>
          {is5 && info3 && (
            <li className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 w-28">แถบที่ 3 (หลักที่ 3):</span>
              <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info3?.hex }} />
              <span className="font-semibold text-zinc-300">{info3?.nameTh} ({info3?.nameEn})</span>
              <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800">{d3}</Badge>
            </li>
          )}
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบที่ {is5 ? 4 : 3} (ตัวคูณ):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: infoMult?.hex }} />
            <span className="font-semibold text-zinc-300">{infoMult?.nameTh} ({infoMult?.nameEn})</span>
            <Badge variant="outline" className="font-mono px-1.5 h-4.5 rounded text-[9px] border-zinc-800 text-zinc-400">x {formatMultiplierValue(multiplierVal)}</Badge>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบความคลาดเคลื่อน:</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: infoTol?.hex }} />
            <span className="font-semibold text-zinc-300">{infoTol?.nameTh} ({infoTol?.nameEn})</span>
            <Badge variant="outline" className="font-mono text-indigo-400 border-indigo-500/20 bg-indigo-500/5 px-1.5 h-4.5 rounded text-[9px]">±{toleranceVal}%</Badge>
          </li>
        </ul>
        <div className="pt-2 border-t border-zinc-850/80 font-mono text-zinc-300 flex flex-wrap gap-1.5 items-center">
          <span className="font-semibold text-zinc-400">คำนวณเป็นสมการ:</span>
          {is5 ? (
            <span>({d1}{d2}{d3}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance || 0)})</span>
          ) : (
            <span>({d1}{d2}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance || 0)})</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link href="/classroom" className="hover:text-zinc-300">ห้องเรียน</Link>
          <ChevronRight className="size-3" />
          <Link href={`/classroom/${classroomId}`} className="hover:text-zinc-300">รายละเอียดห้อง</Link>
          <ChevronRight className="size-3" />
          <span className="text-zinc-300">สรุปคะแนน</span>
        </div>

        {/* Score Card Banner */}
        <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full w-fit animate-bounce">
              <Trophy className="size-12" />
            </div>
            
            <div className="space-y-1.5">
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                {assignment.title}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                ส่งทำเมื่อ: {new Date(submission.createdAt).toLocaleString("th-TH")} น.
              </CardDescription>
            </div>

            <div className="flex items-baseline justify-center gap-1 py-1">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500 font-heading">
                {submission.score}
              </span>
              <span className="text-2xl text-zinc-500">/{assignment.questionCount}</span>
              <span className="text-sm font-bold text-zinc-400 ml-1.5">คะแนน</span>
            </div>

            <p className={`text-xs font-semibold max-w-md ${verdict.color}`}>
              {verdict.text}
            </p>

            <Link href={`/classroom/${classroomId}`} className="pt-2">
              <Button variant="outline" className="border-zinc-850 hover:bg-zinc-800 text-xs font-semibold gap-1.5 rounded-lg h-9 cursor-pointer">
                <ArrowLeft className="size-4" />
                <span>กลับไปยังห้องเรียน</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Proctoring / Cheating Report for Exams */}
        {assignment.isExam && (
          <Card className="bg-zinc-900/40 border-zinc-850 shadow-md rounded-2xl overflow-hidden backdrop-blur-md">
            <CardHeader className="border-b border-zinc-850 pb-4">
              <CardTitle className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <ShieldAlert className="size-4 text-red-400" />
                <span>รายงานพฤติกรรมระหว่างการสอบ (Exam Proctoring Report)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {submission.violationCount === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="size-5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">ไม่พบประวัติพฤติกรรมน่าสงสัย</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">ผู้เรียนทำข้อสอบตามกฎระเบียบอย่างเคร่งครัด ไม่มีประวัติการสลับจอหรือการคัดลอกใดๆ</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`flex items-start gap-3 p-4 rounded-xl text-xs border ${
                    submission.isAutoSubmitted 
                      ? "bg-red-500/5 border-red-500/10 text-red-400" 
                      : "bg-orange-500/5 border-orange-500/10 text-orange-400"
                  }`}>
                    <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {submission.isAutoSubmitted 
                          ? "ตรวจพบการทุจริตเกินกำหนด - ระบบทำการส่งข้อสอบทันที" 
                          : `ตรวจพบประวัติพฤติกรรมน่าสงสัยทั้งหมด ${submission.violationCount} ครั้ง`}
                      </p>
                      <p className="text-[10px] text-zinc-550 mt-0.5">
                        {submission.isAutoSubmitted 
                          ? "นักเรียนสลับแท็บหรือออกจากการแสดงผลเต็มจอเกินจำนวนที่ครูกำหนดไว้ ทำให้ระบบตัดสิทธิ์และล็อกคำตอบแบบอัตโนมัติ" 
                          : "นักเรียนมีการสลับแท็บ หรือหลุดออกจากหน้าจอเต็มจอระหว่างการทำข้อสอบ รายละเอียดแสดงผลย้อนหลังอยู่ด้านล่าง"}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Logs */}
                  {violations && violations.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-1">
                        ลำดับเหตุการณ์การละเมิดกฎการสอบ (Timeline Logs)
                      </h4>
                      <div className="relative border-l border-zinc-800 ml-4 pl-4 space-y-4 text-xs py-1">
                        {violations.map((v, idx) => (
                          <div key={v.id} className="relative">
                            {/* Dot indicator */}
                            <div className="absolute size-2 rounded-full bg-red-500 -left-[21px] top-1.5 border border-black shadow" />
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-300 font-sans">ละเมิดกฎครั้งที่ {idx + 1}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {new Date(v.createdAt).toLocaleTimeString("th-TH")} น.
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400">
                                {v.details || (
                                  <>
                                    {v.type === "TAB_SWITCH" && "สลับหน้าจอ (พับหน้าจอ / เปิดแท็บอื่น)"}
                                    {v.type === "FULLSCREEN_EXIT" && "ออกจากโหมดเต็มจอ"}
                                    {v.type === "COPY_PASTE" && "พยายามคัดลอก หรือ วางข้อความ"}
                                    {v.type === "CONTEXT_MENU" && "พยายามเปิดเมนูคลิกขวา"}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed Solutions Accordion */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-indigo-400" />
            <span>รายละเอียดคำตอบและการเฉลยแต่ละข้อ ({attempts.length})</span>
          </h2>

          {showSolutions ? (
            <Accordion className="space-y-3 border-none">
              {attempts.map((attempt, index) => {
                const q = attempt.question;
                return (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline text-xs flex justify-between cursor-pointer">
                      <div className="flex items-center gap-3.5 w-full text-left">
                        <span className="font-bold text-zinc-400">ข้อที่ {index + 1}</span>
                        
                        <div className="flex items-center gap-1.5">
                          {attempt.isCorrect ? (
                            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-0.5 px-2 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="size-3.5" />
                              <span>ถูกต้อง</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 py-0.5 px-2 rounded-full text-[10px] font-bold">
                              <XCircle className="size-3.5" />
                              <span>{attempt.isTimeout ? "หมดเวลา" : "ผิด"}</span>
                            </div>
                          )}
                        </div>

                        <span className="text-zinc-500 hidden sm:inline">
                          {`แถบสี: ${q.bands} สี`}
                        </span>

                        <div className="ml-auto pr-3 font-semibold text-zinc-300">
                          เฉลย: <span className="font-mono text-zinc-200">
                            {`${q.formatted} ${q.tolerance ? `±${q.tolerance}%` : ''}`}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-5 pb-5 border-t border-zinc-850/60 pt-4">
                      <div className="space-y-5">
                        
                        {/* Interactive Visual or Question Text */}
                        <div>
                          {assignment.assignmentType === "MULTIMETER" && q.multimeterData ? (
                            <MultimeterPreview range={q.multimeterData.range} pointerValue={q.multimeterData.pointerValue} />
                          ) : (
                            <ResistorPreview colors={q.colors!} />
                          )}
                        </div>

                        {/* Score Summary Info */}
                        <div className="grid grid-cols-2 gap-4 max-w-md text-xs">
                          <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg">
                            <span className="text-[10px] text-zinc-550 block">คำตอบของคุณ</span>
                            <span className={`font-mono font-bold ${attempt.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                              {attempt.userAnswer}
                            </span>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg">
                            <span className="text-[10px] text-zinc-550 block">คำตอบที่ถูกต้อง</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {q.formatted}
                            </span>
                          </div>
                        </div>

                        {/* Mathematical Explanation */}
                        {renderExplanation(q)}

                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <Card className="bg-zinc-900/40 border-zinc-850 p-6 rounded-2xl text-center backdrop-blur-md">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                <div className="p-2.5 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 rounded-full w-fit">
                  <BookOpen className="size-6 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-300">
                  ผู้สอนไม่ได้เปิดใช้งานระบบการแสดงเฉลยสำหรับการทดสอบนี้
                </p>
                <p className="text-xs text-zinc-500">
                  คุณจะสามารถตรวจสอบคะแนนดิบที่ทำได้เท่านั้น
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
