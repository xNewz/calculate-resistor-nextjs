"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle2, ChevronRight, Zap, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MultimeterPreview from "@/components/MultimeterPreview";
import { MultimeterRange, multimeterRanges, formatMultimeterValue } from "@/lib/multimeter";
import { cn } from "@/lib/utils";

const LESSONS = [
  { id: "intro",      label: "บทนำ & อุปกรณ์" },
  { id: "scale",      label: "วิธีอ่านสเกล" },
  { id: "ohm",        label: "ย่านวัดโอห์ม (Ω)" },
  { id: "voltage",    label: "ย่านวัดแรงดัน (V)" },
  { id: "simulator",  label: "ฝึกอ่านหน้าปัด" },
  { id: "quiz",       label: "แบบทดสอบ" },
];

const QUIZ = [
  {
    range: { type: "OHM" as const, name: "Ω x10", maxScale: 10 },
    pointerValue: 15,
    options: ["15 Ω", "150 Ω", "1.5 kΩ", "150 kΩ"],
    correct: 1,
    explain: "ย่านวัด Ω x10 และเข็มชี้ที่ 15: นำ 15 × 10 = 150 Ω"
  },
  {
    range: { type: "DCV" as const, name: "DCV 10", maxScale: 10 },
    pointerValue: 4.6,
    options: ["0.46 V", "4.6 V", "46 V", "460 V"],
    correct: 1,
    explain: "ย่านวัด DCV 10 และเข็มชี้ที่สเกล 4.6 (บนสเกล 0-10): อ่านได้ 4.6 V ตรงๆ"
  },
  {
    range: { type: "OHM" as const, name: "Ω x1k", maxScale: 1000 },
    pointerValue: 30,
    options: ["30 Ω", "300 Ω", "3 kΩ", "30 kΩ"],
    correct: 3,
    explain: "ย่านวัด Ω x1k และเข็มชี้ที่ 30: นำ 30 × 1,000 = 30,000 Ω = 30 kΩ"
  },
  {
    range: { type: "ACV" as const, name: "ACV 250", maxScale: 250 },
    pointerValue: 150,
    options: ["15 V", "150 V", "1.5 V", "250 V"],
    correct: 1,
    explain: "ย่านวัด ACV 250 และเข็มชี้ที่สเกล 150 (บนสเกล 0-250): อ่านได้ 150 V ตรงๆ"
  }
];

export default function MultimeterLearnPage() {
  const [activeLesson, setActiveLesson] = useState("intro");
  const [selectedRange, setSelectedRange] = useState<MultimeterRange>(multimeterRanges[0]);
  const [pointerValue, setPointerValue] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const score = QUIZ.filter((q, i) => quizAnswers[i] === q.correct).length;

  // Generate a random reading
  const randomizeReading = () => {
    if (selectedRange.type === "OHM") {
      const ohmTicks = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 2000];
      setPointerValue(ohmTicks[Math.floor(Math.random() * ohmTicks.length)]);
    } else {
      if (selectedRange.maxScale === 10) {
        setPointerValue(Math.round(Math.floor(Math.random() * 51) * 0.2 * 10) / 10);
      } else if (selectedRange.maxScale === 50) {
        setPointerValue(Math.floor(Math.random() * 51));
      } else if (selectedRange.maxScale === 250) {
        setPointerValue(Math.floor(Math.random() * 51) * 5);
      }
    }
  };

  const actualValue = selectedRange.type === "OHM" ? pointerValue * selectedRange.maxScale : pointerValue;
  const formattedValue = formatMultimeterValue(actualValue, selectedRange.type);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <BookOpen className="size-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">สื่อการสอน (Learn)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">เลือกหัวข้อที่คุณต้องการศึกษา</p>
              </div>
            </div>

            {/* <Link href="/">
              <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2 shrink-0 cursor-pointer text-xs h-9 rounded-lg">
                <ArrowLeft className="size-4" /> กลับสู่หน้าหลัก
              </Button>
            </Link> */}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2 p-1 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl w-fit">
            <Link href="/learn" className="px-5 py-2.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-sm transition-colors">
              ตัวต้านทาน (Resistor)
            </Link>
            <Link href="/learn/multimeter" className="px-5 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-sm border border-indigo-500/30">
              มัลติมิเตอร์ (Multimeter)
            </Link>
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
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40"
                )}
              >
                <span className={cn(
                  "size-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                  activeLesson === l.id ? "bg-indigo-500/30 text-indigo-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}>
                  {idx + 1}
                </span>
                {l.label}
              </button>
            ))}
          </div>

          {/* Mobile tab bar */}
          <div className="lg:hidden flex overflow-x-auto gap-1 pb-2">
            {LESSONS.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => { setActiveLesson(l.id); setQuizSubmitted(false); }}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all",
                  activeLesson === l.id
                    ? "bg-indigo-600 text-zinc-900 dark:text-white"
                    : "bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
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
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Zap className="size-5 text-indigo-400" /> มัลติมิเตอร์ (Multimeter) คืออะไร?
                  </h2>
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                    <strong className="text-zinc-900 dark:text-white">มัลติมิเตอร์ (Multimeter)</strong> เป็นเครื่องมือวัดทางไฟฟ้าที่รวมเอาความสามารถในการวัดหลายๆ อย่างมารวมไว้ในเครื่องเดียว เช่น การวัดแรงดันไฟฟ้า (Voltage), กระแสไฟฟ้า (Current), และความต้านทานไฟฟ้า (Resistance)
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                    ในบทเรียนนี้เราจะเน้นศึกษา <strong className="text-zinc-900 dark:text-white">มัลติมิเตอร์แบบอนาล็อก (แบบเข็มชี้)</strong> ซึ่งต้องอาศัยการอ่านค่าจากสเกลบนหน้าปัดร่วมกับตำแหน่งการตั้งค่าของปุ่มปรับย่านวัด เพื่อให้เข้าใจหลักการวัดพื้นฐานอย่างลึกซึ้ง
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-zinc-50/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 space-y-2">
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider text-indigo-400">ขั้วและสายวัด (Probes)</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        สายวัดมี 2 สีหลัก: <span className="text-red-400 font-bold">สีแดง (+)</span> สำหรับขั้วบวก และ <span className="text-zinc-500 dark:text-zinc-400 font-bold">สีดำ (-)</span> สำหรับขั้วลบ (COM)
                      </p>
                    </div>
                    <div className="bg-zinc-50/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 space-y-2">
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider text-amber-400">ปุ่มปรับย่านวัด (Selector Dial)</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        ใช้สำหรับบิดเลือกฟังก์ชันการวัด (DCV, ACV, Ω, DCA) และค่าตัวคูณหรือสเกลสูงสุดที่จะใช้วัด
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                  <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-2">
                    <Layers className="size-4 text-indigo-400" /> ส่วนประกอบสำคัญบนหน้าปัด
                  </h3>
                  <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    <p>• <strong className="text-zinc-800 dark:text-zinc-200">สเกลวัด (Scale):</strong> แถบเส้นโค้งที่มีตัวเลขระบุค่าอยู่บนหน้าปัด ใช้สำหรับดูตำแหน่งเข็มชี้</p>
                    <p>• <strong className="text-zinc-800 dark:text-zinc-200">เข็มชี้ (Needle):</strong> ชี้ไปยังตัวเลขบนสเกลตามปริมาณไฟฟ้าที่วัดได้จริง</p>
                    <p>• <strong className="text-zinc-800 dark:text-zinc-200">ปุ่มปรับศูนย์โอห์ม (0Ω Adjust):</strong> ใช้ปรับให้เข็มชี้ที่เลข 0 บนสเกลโอห์มพอดิบพอดีเมื่อนำสายวัดทั้งสองขั้วมาสัมผัสกัน (ก่อนทำการวัดทุกครั้ง)</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveLesson("scale")}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors"
                >
                  เริ่มเรียนบทถัดไป: วิธีอ่านสเกลหน้าปัด <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── SCALE ── */}
            {activeLesson === "scale" && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-1">การแบ่งสเกลบนหน้าปัดมัลติมิเตอร์</h2>
                  <p className="text-sm text-zinc-500">ทำความเข้าใจความแตกต่างของสองสเกลหลักที่เราใช้งานบ่อยที่สุด</p>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black">Ω</span>
                        <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">สเกลโอห์ม (Resistance)</h3>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        • อยู่ที่ <strong className="text-blue-400">แถวบนสุด</strong> ของหน้าปัด มักเป็นเส้นสีดำ<br />
                        • เป็นสเกลแบบ <strong className="text-zinc-900 dark:text-white">ไม่เป็นเชิงเส้น (Non-linear)</strong> (ฝั่งขวาขีดห่าง ฝั่งซ้ายขีดชิดกันมาก)<br />
                        • เลข <strong className="text-emerald-400">0 จะอยู่ทางขวามือสุด</strong> และค่า <strong className="text-red-400">อนันต์ (∞) อยู่ทางซ้ายสุด</strong>
                      </p>
                    </div>

                    <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">V</span>
                        <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">สเกลแรงดัน (DCV / ACV)</h3>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        • อยู่ที่ <strong className="text-emerald-400">แถวถัดลงมา</strong> มักมีสเกลหลักสามแถวคือ 0-10, 0-50, 0-250<br />
                        • เป็นสเกลแบบ <strong className="text-zinc-900 dark:text-white">เป็นเชิงเส้น (Linear)</strong> มีระยะห่างเท่าๆ กันหมด<br />
                        • เลข <strong className="text-emerald-400">0 จะอยู่ซ้ายมือสุด</strong> และค่าสูงสุดอยู่ขวามือสุด
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">ข้อสังเกต</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      เนื่องจากสเกลแรงดันและสเกลโอห์มมีทิศทางการเคลื่อนที่ of เข็มชี้ตรงกันข้ามกัน (โอห์มอ่านจากขวามาซ้าย ส่วนแรงดันอ่านจากซ้ายไปขวา) จึงต้องใช้สมาธิและความแม่นยำสูงในการฝึกสังเกตแถบตัวเลขที่ถูกต้อง
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveLesson("ohm")}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors"
                >
                  บทถัดไป: ย่านวัดความต้านทาน (Ohm) <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── OHM RANGE ── */}
            {activeLesson === "ohm" && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">การอ่านและคำนวณย่านวัดโอห์ม (Ω)</h2>

                  <div className="bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">สูตรการคำนวณความต้านทาน</p>
                    <div className="font-mono text-center text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      ค่าความต้านทาน = <span className="text-blue-400">ตัวเลขที่เข็มชี้ (สเกลบนสุด)</span> × <span className="text-amber-400">ตัวคูณย่านวัด</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">การตั้งย่านวัดแต่ละประเภท</h3>
                    <div className="grid gap-3">
                      {[
                        { range: "Ω x1", desc: "คูณ 1 — อ่านได้เท่าไร ตอบค่านั้นเลย เหมาะสำหรับตัวต้านทานค่าต่ำๆ (0 - 100 Ω)" },
                        { range: "Ω x10", desc: "คูณ 10 — อ่านค่าได้จากสเกลแล้วนำมาคูณด้วย 10 เหมาะสำหรับค่าปานกลาง (100 - 1k Ω)" },
                        { range: "Ω x1k", desc: "คูณ 1,000 — อ่านค่าได้แล้วคูณด้วย 1k (1,000) เหมาะสำหรับความต้านทานสูง (1k - 100k Ω)" },
                      ].map((item) => (
                        <div key={item.range} className="flex gap-4 p-3 bg-white/60 dark:bg-zinc-900/60 border border-zinc-850 rounded-xl items-center">
                          <div className="w-16 text-center font-bold text-blue-400 shrink-0 border border-blue-500/20 bg-blue-500/5 py-1.5 rounded-lg text-xs font-mono">
                            {item.range}
                          </div>
                          <div className="text-xs text-zinc-700 dark:text-zinc-300">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">ตัวอย่างขั้นตอนการวัดจริง:</p>
                    {[
                      { step: "1", text: "หมุนสวิตช์ย่านวัดไปที่ย่านวัดโอห์มที่ต้องการ เช่น x10" },
                      { step: "2", text: "นำปลายสายวัดสีแดงและสีดำมาสัมผัสกัน (Short Circuit) แล้วหมุนปุ่ม 0Ω ADJ เพื่อให้เข็มชี้ที่เลข 0 ทางขวาสุดพอดิบพอดี" },
                      { step: "3", text: "นำสายวัดทั้งสองไปทาบกับขั้วตัวต้านทานที่ต้องการวัด (ตัวต้านทานต้องไม่มีไฟฟ้าป้อนอยู่)" },
                      { step: "4", text: "อ่านตัวเลขที่เข็มชี้บนหน้าปัดแถวบนสุด เช่น ชี้เลข 20" },
                      { step: "✓", text: "คำนวณ: 20 × 10 (ตัวคูณ) = 200 Ω (โอห์ม)" },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-3 text-sm">
                        <div className="size-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <span className="text-zinc-700 dark:text-zinc-300">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveLesson("voltage")}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors"
                >
                  บทถัดไป: ย่านวัดแรงดัน (Voltage) <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── VOLTAGE RANGE ── */}
            {activeLesson === "voltage" && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">การอ่านค่าสเกลแรงดันไฟฟ้า (DCV / ACV)</h2>

                  <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    การวัดแรงดันมีทั้งกระแสตรง (<strong className="text-zinc-900 dark:text-white">DCV</strong>) และกระแสสลับ (<strong className="text-zinc-900 dark:text-white">ACV</strong>) มัลติมิเตอร์จะมีสเกลตัวเลขหลักอยู่ 3 แถวคือ <strong className="text-indigo-400 font-mono">0-10, 0-50, และ 0-250</strong> ซึ่งเราจะเลือกอ่านแถวไหนขึ้นอยู่กับย่านวัดที่เราตั้งค่า
                  </p>

                  <div className="bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">หลักการอ่านสเกลให้ตรงย่านวัดที่บิด</p>
                    <div className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">ตั้งย่านวัดที่ 10V</span>
                        <span>ให้อ่านจากแถวตัวเลขสเกล <strong className="text-indigo-400 font-bold">0-10</strong> (แต่ละขีดเล็ก = 0.2V)</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">ตั้งย่านวัดที่ 50V</span>
                        <span>ให้อ่านจากแถวตัวเลขสเกล <strong className="text-indigo-400 font-bold">0-50</strong> (แต่ละขีดเล็ก = 1.0V)</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">ตั้งย่านวัดที่ 250V</span>
                        <span>ให้อ่านจากแถวตัวเลขสเกล <strong className="text-indigo-400 font-bold">0-250</strong> (แต่ละขีดเล็ก = 5.0V)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">ตัวอย่างการอ่านแรงดันกระแสตรง (DCV):</p>
                    <div className="space-y-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      <p>• บิดสวิตช์ย่านวัดไปที่ <strong className="text-emerald-400 font-mono font-bold">DCV 50</strong></p>
                      <p>• เสียบสายแดงวัดจุดทดสอบแรงดันบวก สายดำวัดจุดทดสอบแรงดันลบ/กราวด์</p>
                      <p>• สังเกตเข็มชี้ เช่น ชี้เลยขีดเลข 30 ไป 4 ขีดเล็ก บนสเกลแถว 0-50</p>
                      <p>• คำนวณขีด: เลข 30 + 4 ขีดเล็ก (ขีดละ 1V) = <strong className="text-zinc-900 dark:text-white font-bold">34 V</strong></p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveLesson("simulator")}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors"
                >
                  บทถัดไป: ฝึกฝนอ่านหน้าปัดจำลอง <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── SIMULATOR ── */}
            {activeLesson === "simulator" && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">ระบบจำลองการวัดหน้าปัดมัลติมิเตอร์</h2>
                  <p className="text-sm text-zinc-500">เลือกย่านวัดที่ต้องการ จากนั้นกดสุ่มเข็มวัดเพื่อฝึกคำนวณและอ่านค่าจริง</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Simulator screen */}
                  <Card className="bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col py-0 gap-0">
                    <CardHeader className="border-b border-zinc-850 pt-4 pb-4 px-4">
                      <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200">หน้าปัดเข็มจำลอง</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex justify-center py-6 min-h-[250px] bg-zinc-50/20 dark:bg-zinc-950/20 rounded-lg">
                        <MultimeterPreview range={selectedRange} pointerValue={pointerValue} />
                      </div>
                      <Button onClick={randomizeReading} className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer font-bold text-xs py-2.5 rounded-lg">
                        สุ่มตำแหน่งเข็มชี้ (Randomize)
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Right: Controls & Details */}
                  <Card className="bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col py-0 gap-0">
                    <CardHeader className="border-b border-zinc-850 pt-4 pb-4 px-4">
                      <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200">แผงควบคุมและวิธีคำนวณ</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">เลือกย่านวัด (Range)</label>
                        <div className="grid grid-cols-3 gap-2">
                          {multimeterRanges.map((range) => (
                            <Button
                              key={range.name}
                              variant={selectedRange.name === range.name ? "default" : "outline"}
                              className={cn(
                                "text-xs h-9 font-bold rounded-lg cursor-pointer font-mono",
                                selectedRange.name === range.name
                                  ? range.type === "OHM" ? "bg-blue-600 hover:bg-blue-700 text-zinc-900 dark:text-white" : "bg-emerald-600 hover:bg-emerald-700 text-zinc-900 dark:text-white"
                                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400"
                              )}
                              onClick={() => {
                                setSelectedRange(range);
                                setPointerValue(0);
                              }}
                            >
                              {range.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-850 space-y-3.5 text-xs">
                        <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                          <span className="text-zinc-500">เข็มชี้สเกลตัวเลข:</span>
                          <span className="text-base font-bold font-mono text-zinc-800 dark:text-zinc-200">{pointerValue}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                          <span className="text-zinc-500">ย่านวัดที่ตั้ง (Range):</span>
                          <Badge variant="outline" className={cn(
                            "border-opacity-35 font-bold font-mono",
                            selectedRange.type === "OHM" ? "border-blue-500/30 text-blue-400" : "border-emerald-500/30 text-emerald-400"
                          )}>
                            {selectedRange.name}
                          </Badge>
                        </div>
                        <div className="flex flex-col space-y-1.5 pt-1">
                          <span className="text-zinc-500">วิธีการคำนวณ:</span>
                          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                            {selectedRange.type === "OHM"
                              ? `${pointerValue} × ${selectedRange.maxScale} = ${actualValue} Ω`
                              : `ย่าน ${selectedRange.maxScale}V → เข็มชี้ที่เลขสเกล ${pointerValue} → อ่านได้ ${actualValue}V`}
                          </span>
                        </div>
                        <div className="pt-3 mt-1.5 border-t border-zinc-850">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">ผลลัพธ์การวัดจริง (Value)</span>
                          <span className="text-2xl font-black text-indigo-400 drop-shadow-md font-mono">
                            {formattedValue}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <button
                  onClick={() => setActiveLesson("quiz")}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm py-3 rounded-xl cursor-pointer transition-colors"
                >
                  บทสุดท้าย: แบบทดสอบความเข้าใจ <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* ── QUIZ ── */}
            {activeLesson === "quiz" && (
              <div className="space-y-5">
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-1">ทดสอบความเข้าใจมัลติมิเตอร์</h2>
                  <p className="text-zinc-500 text-sm mb-6">สังเกตย่านวัดและเข็มชี้ของจำลอง แล้วเลือกคำตอบที่ถูกต้องที่สุด</p>

                  <div className="space-y-8">
                    {QUIZ.map((q, qi) => (
                      <div key={qi} className="space-y-4 border-b border-zinc-850/60 pb-8 last:border-b-0 last:pb-0">
                        {/* Question Header */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-500 uppercase">ข้อ {qi + 1}</span>
                          <div className="h-[1px] flex-1 bg-zinc-850/50" />
                          <span className={cn("font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono border", q.range.type === "OHM" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
                            ย่านวัด {q.range.name}
                          </span>
                        </div>

                        {/* Large centered Multimeter Dial */}
                        <div className="bg-zinc-50/30 dark:bg-zinc-950/30 border border-zinc-850/80 rounded-2xl p-4 flex justify-center shadow-inner">
                          <div className="w-full max-w-sm">
                            <MultimeterPreview range={q.range} pointerValue={q.pointerValue} />
                          </div>
                        </div>

                        <div className="space-y-4 w-full">
                          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            จากภาพหน้าปัดที่ตั้งย่านวัดเป็น <span className="text-indigo-400 font-mono">{q.range.name}</span> ค่าที่วัดได้จริงคือเท่าใด?
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt, oi) => {
                              const selected = quizAnswers[qi] === oi;
                              const isCorrect = oi === q.correct;
                              let cls = "bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700";
                              if (quizSubmitted) {
                                if (isCorrect) cls = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                                else if (selected && !isCorrect) cls = "bg-red-500/15 border-red-500/40 text-red-300";
                                else cls = "bg-white/40 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500";
                              } else if (selected) {
                                cls = "bg-indigo-500/15 border-indigo-500/30 text-indigo-300";
                              }
                              return (
                                <button
                                  key={oi}
                                  onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                                  className={cn("border rounded-xl p-3.5 text-xs sm:text-sm font-semibold text-left transition-all cursor-pointer font-mono", cls)}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className={cn("flex items-start gap-2.5 text-xs p-3.5 rounded-xl border", quizAnswers[qi] === q.correct
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                              : "bg-red-500/10 border-red-500/20 text-red-300"
                            )}>
                              <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                              <span>{q.explain}</span>
                            </div>
                          )}
                        </div>
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
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white"
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
                        {score === QUIZ.length ? "🎉" : score >= 3 ? "👍" : "📚"}
                      </div>
                      <p className="font-black text-xl text-zinc-900 dark:text-zinc-100">{score} / {QUIZ.length} คะแนน</p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        {score === QUIZ.length
                          ? "สุดยอด! คุณมีความเชี่ยวชาญการอ่านสเกลมัลติมิเตอร์แล้ว"
                          : score >= 3
                          ? "ทำได้ดีมาก! ลองทบทวนข้อยากๆ และลองใหม่อีกครั้งนะ"
                          : "ยังไม่ผ่าน ลองกลับไปเรียนวิธีอ่านสเกลก่อนนะครับ"}
                      </p>
                      <Button
                        onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                        variant="outline"
                        className="mt-4 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-sm"
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
