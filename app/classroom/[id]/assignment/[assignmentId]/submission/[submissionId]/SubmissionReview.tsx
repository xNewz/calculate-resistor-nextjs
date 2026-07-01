"use client";

import React from "react";
import Link from "next/link";
import ResistorPreview from "@/components/ResistorPreview";
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
  BookOpen
} from "lucide-react";
import {
  COLOR_MAP,
  DIGIT_MAP,
  MULTIPLIER_MAP,
  TOLERANCE_MAP,
  formatValue
} from "@/lib/resistor";

interface Question {
  bands: 4 | 5;
  colors: string[];
  resistance: number;
  formatted: string;
  tolerance: number;
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
  };
  submission: {
    id: string;
    score: number;
    createdAt: Date;
  };
  attempts: UserAttempt[];
}

function formatMultiplierValue(value: number): string {
  if (value === 0.1) return "0.1";
  if (value === 0.01) return "0.01";
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}k`;
  return `${value}`;
}

export default function SubmissionReview({
  classroomId,
  assignment,
  submission,
  attempts,
}: SubmissionReviewProps) {

  const getVerdict = (finalScore: number, total: number) => {
    const ratio = finalScore / total;
    if (ratio === 1) return { text: "ระดับเทพ! ตอบถูกครบทุกข้อ แม่นยำและรวดเร็วไม่มีที่ติ 🎉", color: "text-indigo-400" };
    if (ratio >= 0.8) return { text: "ยอดเยี่ยมมาก! คุณมีความเข้าใจในรหัสสีอย่างดีเยี่ยม 🌟", color: "text-emerald-400" };
    if (ratio >= 0.5) return { text: "ผ่านเกณฑ์! ฝึกฝนอีกนิดจะช่วยเพิ่มความคล่องแคล่ว 💪", color: "text-yellow-400" };
    return { text: "ลองใหม่อีกครั้ง! ทบทวนตารางสีเพื่อทำคะแนนให้ดียิ่งขึ้น 📚", color: "text-red-400" };
  };

  const verdict = getVerdict(submission.score, assignment.questionCount);

  const renderExplanation = (q: Question) => {
    const is5 = q.bands === 5;
    const first = q.colors[0];
    const second = q.colors[1];
    const third = is5 ? q.colors[2] : null;
    const mult = is5 ? q.colors[3] : q.colors[2];
    const tol = is5 ? q.colors[4] : q.colors[3];

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
            <span>({d1}{d2}{d3}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance)})</span>
          ) : (
            <span>({d1}{d2}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance)})</span>
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

        {/* Detailed Solutions Accordion */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-indigo-400" />
            <span>รายละเอียดคำตอบและการเฉลยแต่ละข้อ ({attempts.length})</span>
          </h2>

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
                        แถบสี: {q.bands} สี
                      </span>

                      <div className="ml-auto pr-3 font-semibold text-zinc-300">
                        เฉลย: <span className="font-mono text-zinc-200">{q.formatted} ±{q.tolerance}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-5 pb-5 border-t border-zinc-850/60 pt-4">
                    <div className="space-y-5">
                      
                      {/* Interactive Resistor Visual */}
                      <div>
                        <ResistorPreview colors={q.colors} />
                      </div>

                      {/* Score Summary Info */}
                      <div className="grid grid-cols-2 gap-4 max-w-md text-xs">
                        <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg">
                          <span className="text-[10px] text-zinc-500 block">คำตอบของคุณ</span>
                          <span className={`font-mono font-bold ${attempt.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                            {attempt.userAnswer}
                          </span>
                        </div>
                        <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg">
                          <span className="text-[10px] text-zinc-500 block">คำตอบที่ถูกต้อง</span>
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
        </div>

      </div>
    </div>
  );
}
