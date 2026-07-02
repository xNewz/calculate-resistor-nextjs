"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronRight, BookOpen, Layers, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Color data ───────────────────────────────────────────────────────────────
const COLORS = [
  { key: "black",  hex: "#000000", th: "ดำ",       digit: 0,  mult: "×1",         multVal: 1 },
  { key: "brown",  hex: "#7B3F00", th: "น้ำตาล",   digit: 1,  mult: "×10",        multVal: 10 },
  { key: "red",    hex: "#D32F2F", th: "แดง",       digit: 2,  mult: "×100",       multVal: 100 },
  { key: "orange", hex: "#EF6C00", th: "ส้ม",       digit: 3,  mult: "×1k",        multVal: 1000 },
  { key: "yellow", hex: "#F9A825", th: "เหลือง",    digit: 4,  mult: "×10k",       multVal: 10000 },
  { key: "green",  hex: "#2E7D32", th: "เขียว",     digit: 5,  mult: "×100k",      multVal: 100000 },
  { key: "blue",   hex: "#1565C0", th: "น้ำเงิน",  digit: 6,  mult: "×1M",        multVal: 1000000 },
  { key: "purple", hex: "#6A1B9A", th: "ม่วง",      digit: 7,  mult: "×10M",       multVal: 10000000 },
  { key: "gray",   hex: "#9E9E9E", th: "เทา",       digit: 8,  mult: "-",          multVal: null },
  { key: "white",  hex: "#FFFFFF", th: "ขาว",       digit: 9,  mult: "-",          multVal: null },
  { key: "gold",   hex: "#D4AF37", th: "ทอง",       digit: null, mult: "×0.1",     multVal: 0.1,  tol: "±5%" },
  { key: "silver", hex: "#BDBDBD", th: "เงิน",      digit: null, mult: "×0.01",    multVal: 0.01, tol: "±10%" },
];

// ─── Practice examples ────────────────────────────────────────────────────────
const EXAMPLES_4 = [
  { bands: ["red","red","brown","gold"],      answer: "220 Ω",    label: "แดง-แดง-น้ำตาล-ทอง",       calc: "2-2 × 10 = 220 Ω ±5%" },
  { bands: ["brown","black","orange","gold"], answer: "10 kΩ",   label: "น้ำตาล-ดำ-ส้ม-ทอง",        calc: "1-0 × 1k = 10 kΩ ±5%" },
  { bands: ["yellow","purple","red","gold"],  answer: "4.7 kΩ",  label: "เหลือง-ม่วง-แดง-ทอง",     calc: "4-7 × 100 = 4700 Ω = 4.7 kΩ ±5%" },
  { bands: ["green","blue","yellow","silver"],"answer": "560 kΩ", label: "เขียว-น้ำเงิน-เหลือง-เงิน", calc: "5-6 × 10k = 560 kΩ ±10%" },
];

const EXAMPLES_5 = [
  { bands: ["brown","black","black","brown","gold"], answer: "1 kΩ",    label: "น้ำตาล-ดำ-ดำ-น้ำตาล-ทอง",  calc: "1-0-0 × 10 = 1000 Ω = 1 kΩ ±5%" },
  { bands: ["red","red","black","black","gold"],     answer: "220 Ω",   label: "แดง-แดง-ดำ-ดำ-ทอง",       calc: "2-2-0 × 1 = 220 Ω ±5%" },
  { bands: ["orange","orange","black","brown","silver"], answer: "3.3 kΩ", label: "ส้ม-ส้ม-ดำ-น้ำตาล-เงิน", calc: "3-3-0 × 10 = 3300 Ω = 3.3 kΩ ±10%" },
];

// ─── Mini quiz ────────────────────────────────────────────────────────────────
const QUIZ = [
  { bands: ["red","black","brown","gold"], options: ["210 Ω","200 Ω","120 Ω","2.1 kΩ"], correct: 1, explain: "แดง(2) - ดำ(0) × น้ำตาล(10) = 200 Ω ±5%" },
  { bands: ["brown","green","red","gold"], options: ["152 Ω","1.5 kΩ","15 Ω","150 kΩ"], correct: 1, explain: "น้ำตาล(1) - เขียว(5) × แดง(100) = 1500 Ω = 1.5 kΩ ±5%" },
  { bands: ["orange","white","black","gold"], options: ["39 kΩ","3.9 kΩ","39 Ω","390 Ω"], correct: 2, explain: "ส้ม(3) - ขาว(9) × ดำ(1) = 39 Ω ±5%" },
];

const LESSONS = [
  { id: "intro",      label: "บทนำ" },
  { id: "colors",     label: "ตารางสี" },
  { id: "4band",      label: "4 แถบสี" },
  { id: "5band",      label: "5 แถบสี" },
  { id: "examples",   label: "ตัวอย่างจริง" },
  { id: "quiz",       label: "ทดสอบ" },
];

// ─── Band strip component ─────────────────────────────────────────────────────
function ResistorBands({ bands, size = "md" }: { bands: string[]; size?: "sm" | "md" }) {
  const colorMap: Record<string, string> = {
    black:"#000000", brown:"#7B3F00", red:"#D32F2F", orange:"#EF6C00",
    yellow:"#F9A825", green:"#2E7D32", blue:"#1565C0", purple:"#6A1B9A",
    gray:"#9E9E9E", white:"#F5F5F5", gold:"#D4AF37", silver:"#BDBDBD",
  };
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-3" : "w-4";
  const is5Band = bands.length === 5;
  const bgClass = is5Band ? "bg-[#7FB3D5] border-blue-700/30" : "bg-[#D4A96A] border-amber-700/30";
  return (
    <div className="flex items-center">
      <div className="h-[2px] w-4 bg-zinc-500" />
      <div className={`relative flex items-center ${h} px-2 gap-2.5 ${bgClass} rounded-lg border shadow-lg`}>
        {bands.map((b, i) => (
          <div
            key={i}
            className={`${w} ${h} rounded-[3px] border border-white/10`}
            style={{ backgroundColor: colorMap[b] }}
          />
        ))}
      </div>
      <div className="h-[2px] w-4 bg-zinc-500" />
    </div>
  );
}

export default function LearnPage() {
  const [activeLesson, setActiveLesson] = useState("intro");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const score = QUIZ.filter((q, i) => quizAnswers[i] === q.correct).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <BookOpen className="size-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-100">สื่อการสอน: การอ่านรหัสสีตัวต้านทาน</h1>
              <p className="text-xs text-zinc-500 mt-0.5">เรียนรู้ตั้งแต่พื้นฐานจนถึงการอ่านค่าตัวต้านทานได้อย่างถูกต้อง</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">

          {/* Sidebar navigation */}
          <div className="hidden lg:flex flex-col gap-1">
            {LESSONS.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => { setActiveLesson(l.id); setQuizSubmitted(false); }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left",
                  activeLesson === l.id
                    ? "bg-indigo-500/15 border border-indigo-500/25 text-indigo-300"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}
              >
                <span className={cn(
                  "size-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                  activeLesson === l.id ? "bg-indigo-500/30 text-indigo-300" : "bg-zinc-800 text-zinc-500"
                )}>
                  {idx + 1}
                </span>
                {l.label}
              </button>
            ))}
          </div>

          {/* Mobile tab bar */}
          <div className="lg:hidden flex overflow-x-auto gap-1 pb-2">
            {LESSONS.map((l) => (
              <button
                key={l.id}
                onClick={() => { setActiveLesson(l.id); setQuizSubmitted(false); }}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all",
                  activeLesson === l.id
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6">

            {/* ── INTRO ── */}
            {activeLesson === "intro" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2">
                    <Zap className="size-5 text-indigo-400" /> ตัวต้านทาน (Resistor) คืออะไร?
                  </h2>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    <strong className="text-white">ตัวต้านทาน</strong> เป็นอุปกรณ์อิเล็กทรอนิกส์ที่ทำหน้าที่ <strong className="text-indigo-400">ต้านการไหลของกระแสไฟฟ้า</strong> มีหน่วยวัดคือ <strong className="text-amber-400">โอห์ม (Ω)</strong> พบได้ในวงจรอิเล็กทรอนิกส์ทุกประเภท
                  </p>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    เนื่องจากตัวต้านทานมีขนาดเล็กมาก จึงใช้ <strong className="text-white">รหัสสี</strong> แทนการพิมพ์ตัวเลขลงบนตัวชิ้นงาน
                    โดยแต่ละแถบสีจะแทนค่าตัวเลขหรือตัวคูณที่กำหนดไว้ตามมาตรฐาน IEC 60062
                  </p>
                  <div className="flex justify-center py-4">
                    <ResistorBands bands={["brown","black","orange","gold"]} />
                  </div>
                  <p className="text-center text-xs text-zinc-500">ตัวอย่าง: น้ำตาล-ดำ-ส้ม-ทอง = 10 kΩ ±5%</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: <Layers className="size-4 text-amber-400" />, t: "ระบบ 4 แถบสี", d: "แถบ 1-2: ตัวเลข, แถบ 3: ตัวคูณ, แถบ 4: ค่าความผิดพลาด — ใช้กับตัวต้านทานทั่วไป" },
                    { icon: <Layers className="size-4 text-emerald-400" />, t: "ระบบ 5 แถบสี", d: "แถบ 1-3: ตัวเลข, แถบ 4: ตัวคูณ, แถบ 5: ค่าความผิดพลาด — ใช้กับตัวต้านทานความแม่นยำสูง" },
                  ].map((c) => (
                    <div key={c.t} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">{c.icon}<span className="font-bold text-zinc-200 text-sm">{c.t}</span></div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{c.d}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveLesson("colors")}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors"
                >
                  เริ่มเรียนบทถัดไป: ตารางสี <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── COLOR TABLE ── */}
            {activeLesson === "colors" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xl font-black text-zinc-100 mb-1">ตารางรหัสสีมาตรฐาน</h2>
                  <p className="text-sm text-zinc-500 mb-6">แต่ละสีมีค่าตัวเลข ตัวคูณ และค่าความผิดพลาดที่แน่นอนตามมาตรฐาน IEC</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3 text-left pl-2">สี</th>
                          <th className="pb-3 text-center">แถบสี</th>
                          <th className="pb-3 text-center">ตัวเลข</th>
                          <th className="pb-3 text-center">ตัวคูณ</th>
                          <th className="pb-3 text-center">ค่าความผิดพลาด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {COLORS.map((c) => (
                          <tr key={c.key} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="py-2.5 pl-2">
                              <span className="font-bold text-zinc-200">{c.th}</span>
                              <span className="text-zinc-500 text-xs ml-2">{c.key}</span>
                            </td>
                            <td className="py-2.5 text-center">
                              <div className="inline-flex items-center justify-center">
                                <div
                                  className="w-6 h-7 rounded border border-white/15 shadow-md"
                                  style={{ backgroundColor: c.hex }}
                                />
                              </div>
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-zinc-200">
                              {c.digit !== null ? c.digit : <span className="text-zinc-600">—</span>}
                            </td>
                            <td className="py-2.5 text-center font-mono text-indigo-400 font-semibold text-xs">
                              {c.mult !== "-" ? c.mult : <span className="text-zinc-600">—</span>}
                            </td>
                            <td className="py-2.5 text-center font-mono text-amber-400 font-semibold text-xs">
                              {c.tol ? c.tol : <span className="text-zinc-600">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300">
                    <strong className="text-indigo-300">เคล็ดลับจำสี:</strong> B-B-ROY of Great Britain has a Very Good Wife — Black, Brown, Red, Orange, Yellow, Green, Blue, Violet(Purple), Gray, White
                  </p>
                </div>

                <button onClick={() => setActiveLesson("4band")} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors">
                  บทถัดไป: การอ่านตัวต้านทาน 4 แถบสี <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── 4-BAND ── */}
            {activeLesson === "4band" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-5">
                  <h2 className="text-xl font-black text-zinc-100">การอ่านค่าตัวต้านทาน 4 แถบสี</h2>

                  <div className="flex justify-center py-2">
                    <ResistorBands bands={["brown","green","red","gold"]} />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { num: "แถบ 1", role: "ตัวเลขหลักแรก", color: "text-amber-400" },
                      { num: "แถบ 2", role: "ตัวเลขหลักสอง", color: "text-amber-400" },
                      { num: "แถบ 3", role: "ตัวคูณ", color: "text-indigo-400" },
                      { num: "แถบ 4", role: "ค่าความผิดพลาด", color: "text-emerald-400" },
                    ].map((b) => (
                      <div key={b.num} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                        <div className={`font-black ${b.color}`}>{b.num}</div>
                        <div className="text-zinc-500 mt-1 leading-snug">{b.role}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">สูตรการคำนวณ</p>
                    <div className="font-mono text-center text-base font-bold text-zinc-100">
                      ค่าความต้านทาน = (แถบ 1 <span className="text-amber-400">×10</span> + แถบ 2) <span className="text-indigo-400">× ตัวคูณ</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-zinc-300">ตัวอย่างการอ่านค่า: น้ำตาล-เขียว-แดง-ทอง</p>
                    {[
                      { step: "1", text: "น้ำตาล = 1 (ตัวเลขหลักแรก)" },
                      { step: "2", text: "เขียว = 5 (ตัวเลขหลักสอง)" },
                      { step: "3", text: "แดง = ×100 (ตัวคูณ)" },
                      { step: "4", text: "(1×10 + 5) × 100 = 15 × 100 = 1,500 Ω = 1.5 kΩ" },
                      { step: "✓", text: "ทอง = ±5% → คำตอบสุดท้าย: 1.5 kΩ ±5%" },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-3 text-sm">
                        <div className="size-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <span className="text-zinc-300">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setActiveLesson("5band")} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors">
                  บทถัดไป: การอ่านตัวต้านทาน 5 แถบสี <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── 5-BAND ── */}
            {activeLesson === "5band" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-5">
                  <h2 className="text-xl font-black text-zinc-100">การอ่านค่าตัวต้านทาน 5 แถบสี</h2>

                  <div className="flex justify-center py-2">
                    <ResistorBands bands={["red","purple","black","brown","gold"]} />
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { num: "แถบ 1", role: "หลักแรก", color: "text-amber-400" },
                      { num: "แถบ 2", role: "หลักสอง", color: "text-amber-400" },
                      { num: "แถบ 3", role: "หลักสาม", color: "text-amber-400" },
                      { num: "แถบ 4", role: "ตัวคูณ", color: "text-indigo-400" },
                      { num: "แถบ 5", role: "ค่าความผิดพลาด", color: "text-emerald-400" },
                    ].map((b) => (
                      <div key={b.num} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-2">
                        <div className={`font-black ${b.color} text-[10px]`}>{b.num}</div>
                        <div className="text-zinc-500 mt-0.5 text-[9px] leading-snug">{b.role}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">สูตรการคำนวณ</p>
                    <div className="font-mono text-center text-sm font-bold text-zinc-100">
                      ค่าต้านทาน = (แถบ 1 <span className="text-amber-400">×100</span> + แถบ 2 <span className="text-amber-400">×10</span> + แถบ 3) <span className="text-indigo-400">× ตัวคูณ</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-zinc-300">ความแตกต่างจากระบบ 4 แถบสี</p>
                    <div className="space-y-2">
                      {[
                        "มีตัวเลขหลักที่ 3 เพิ่มขึ้น ทำให้ระบุค่าได้แม่นยำกว่า",
                        "ใช้กับตัวต้านทานความแม่นยำสูง (Precision Resistor)",
                        "แถบค่าความผิดพลาดมักเป็น ทอง(±5%) หรือ เงิน(±10%)",
                        "แถบสีจะอยู่ชิดกันที่ด้านซ้าย เพื่อแยกออกจากแถบค่าความผิดพลาด",
                      ].map((t) => (
                        <div key={t} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={() => setActiveLesson("examples")} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors">
                  บทถัดไป: ตัวอย่างจริง <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── EXAMPLES ── */}
            {activeLesson === "examples" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xl font-black text-zinc-100 mb-5">ตัวอย่างการอ่านค่าจริง</h2>

                  <div className="space-y-4">
                    <p className="text-sm font-bold text-indigo-300 uppercase tracking-wider">ระบบ 4 แถบสี</p>
                    {EXAMPLES_4.map((ex, i) => (
                      <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <ResistorBands bands={ex.bands} size="sm" />
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 mb-1">{ex.label}</div>
                          <div className="font-mono text-xs text-zinc-400">{ex.calc}</div>
                        </div>
                        <div className="font-black text-lg text-indigo-400 shrink-0">{ex.answer}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 mt-6">
                    <p className="text-sm font-bold text-emerald-300 uppercase tracking-wider">ระบบ 5 แถบสี</p>
                    {EXAMPLES_5.map((ex, i) => (
                      <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <ResistorBands bands={ex.bands} size="sm" />
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 mb-1">{ex.label}</div>
                          <div className="font-mono text-xs text-zinc-400">{ex.calc}</div>
                        </div>
                        <div className="font-black text-lg text-emerald-400 shrink-0">{ex.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setActiveLesson("quiz")} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors">
                  บทสุดท้าย: ทดสอบความเข้าใจ <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── QUIZ ── */}
            {activeLesson === "quiz" && (
              <div className="space-y-5">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xl font-black text-zinc-100 mb-1">ทดสอบความเข้าใจ</h2>
                  <p className="text-zinc-500 text-sm mb-6">เลือกคำตอบที่ถูกต้องสำหรับตัวต้านทานแต่ละตัว</p>

                  <div className="space-y-8">
                    {QUIZ.map((q, qi) => (
                      <div key={qi} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-zinc-500 uppercase">ข้อ {qi + 1}</span>
                          <ResistorBands bands={q.bands} size="sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => {
                            const selected = quizAnswers[qi] === oi;
                            const isCorrect = oi === q.correct;
                            let cls = "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700";
                            if (quizSubmitted) {
                              if (isCorrect) cls = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                              else if (selected && !isCorrect) cls = "bg-red-500/15 border-red-500/40 text-red-300";
                              else cls = "bg-zinc-900/40 border-zinc-800 text-zinc-500";
                            } else if (selected) {
                              cls = "bg-indigo-500/15 border-indigo-500/30 text-indigo-300";
                            }
                            return (
                              <button
                                key={oi}
                                onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                                className={cn("border rounded-xl p-3 text-sm font-semibold text-left transition-all cursor-pointer", cls)}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className={cn("flex items-start gap-2 text-xs p-3 rounded-xl border", quizAnswers[qi] === q.correct
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : "bg-red-500/10 border-red-500/20 text-red-300"
                          )}>
                            <CheckCircle2 className="size-3.5 mt-0.5 shrink-0" />
                            <span>{q.explain}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < QUIZ.length}
                      className={cn(
                        "mt-8 w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer",
                        Object.keys(quizAnswers).length < QUIZ.length
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      )}
                    >
                      ส่งคำตอบ ({Object.keys(quizAnswers).length}/{QUIZ.length} ข้อ)
                    </button>
                  ) : (
                    <div className={cn("mt-8 rounded-2xl border p-6 text-center", score === QUIZ.length
                      ? "bg-emerald-500/10 border-emerald-500/25"
                      : "bg-indigo-500/10 border-indigo-500/25"
                    )}>
                      <div className="text-4xl font-black mb-2">
                        {score === QUIZ.length ? "🎉" : score >= 2 ? "👍" : "📚"}
                      </div>
                      <p className="font-black text-xl text-zinc-100">{score} / {QUIZ.length} คะแนน</p>
                      <p className="text-zinc-400 text-sm mt-1">
                        {score === QUIZ.length
                          ? "เยี่ยมมาก! คุณเข้าใจการอ่านรหัสสีตัวต้านทานแล้ว"
                          : score >= 2
                          ? "ดีมาก! ลองทบทวนข้อที่ผิดและลองใหม่อีกครั้ง"
                          : "ยังไม่ผ่าน ลองกลับไปทบทวนบทเรียนก่อนนะครับ"}
                      </p>
                      <Button
                        onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                        variant="outline"
                        className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer text-sm"
                      >
                        ทำใหม่อีกครั้ง
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
