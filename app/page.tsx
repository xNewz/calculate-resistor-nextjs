"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  BookOpen,
  Trophy,
  Users,
  ArrowRight,
  CheckCircle2,
  Layers,
  Brain,
  GraduationCap,
} from "lucide-react";

const BAND_COLORS = [
  { name: "ดำ", hex: "#000000" },
  { name: "น้ำตาล", hex: "#795548" },
  { name: "แดง", hex: "#F44336" },
  { name: "ส้ม", hex: "#FF9800" },
  { name: "เหลือง", hex: "#FFEB3B" },
  { name: "เขียว", hex: "#4CAF50" },
  { name: "น้ำเงิน", hex: "#2196F3" },
  { name: "ม่วง", hex: "#9C27B0" },
  { name: "เทา", hex: "#9E9E9E" },
  { name: "ขาว", hex: "#FFFFFF" },
  { name: "ทอง", hex: "#FFD700" },
  { name: "เงิน", hex: "#C0C0C0" },
];

const FEATURES = [
  {
    icon: <Brain className="size-5 text-indigo-400" />,
    title: "เรียนรู้รหัสสีตัวต้านทาน",
    desc: "ฝึกอ่านค่าความต้านทานจากแถบสี ทั้งแบบ 4 แถบ และ 5 แถบ อย่างเป็นระบบ",
  },
  {
    icon: <Zap className="size-5 text-sky-400" />,
    title: "ฝึกอ่านสเกลมัลติมิเตอร์",
    desc: "แบบจำลองหน้าปัดมัลติมิเตอร์แบบเข็ม อ่านค่าแรงดันและความต้านทานได้เสมือนจริง",
  },
  {
    icon: <Trophy className="size-5 text-amber-400" />,
    title: "ทดสอบผ่านเกม Quiz",
    desc: "ฝึกทักษะด้วยแบบทดสอบแบบ interactive ที่สนุกและท้าทาย วัดความเข้าใจของคุณได้ทันที",
  },
  {
    icon: <GraduationCap className="size-5 text-emerald-400" />,
    title: "ระบบห้องเรียนออนไลน์",
    desc: "ผู้สอนสามารถสร้างห้องเรียน มอบหมายแบบฝึกหัด และติดตามสถิติคะแนนได้",
  },
];

function TypewriterText({ texts, speed = 60, delay = 3000 }: { texts: string[]; speed?: number; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentText = texts[currentIndex] || "";

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, speed / 2);
    } else {
      timer = setTimeout(() => {
        setDisplayText((prev) => currentText.slice(0, prev.length + 1));
      }, speed);
    }

    if (!isDeleting && displayText === currentText) {
      clearTimeout(timer);
      timer = setTimeout(() => setIsDeleting(true), delay);
    } else if (isDeleting && displayText === "") {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsDeleting(false);
      }, 500);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentText, speed, delay, texts.length]);

  return (
    <span className="font-mono">
      {displayText}
      <span className="inline-block w-[1.5px] h-3 bg-indigo-400 animate-pulse ml-0.5" />
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-x-hidden">

      {/* ───── Hero Section ───── */}
      <section className="relative isolate flex flex-col items-center text-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute left-1/4 bottom-0 w-[300px] h-[200px] bg-purple-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full min-h-[30px]">
          <Zap className="size-3.5 fill-indigo-400 shrink-0" />
          <TypewriterText texts={[
            "Learning Resistors and Multimeters Made Easy",
            "Instructional for Improvement Resistor and Multimeter Reading Skills",
            "Perfect for Electronics Classrooms & Learners"
          ]} />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-3xl">
          เรียนรู้
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
            {" "}ตัวต้านทานและมัลติมิเตอร์
          </span>
          <br />
          ได้ง่ายกว่าเดิม
        </h1>
        <p className="mt-5 text-zinc-500 dark:text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Practice-Lab คือแพลตฟอร์มฝึกทักษะการอ่านรหัสสีตัวต้านทานและการอ่านสเกลมัลติมิเตอร์แบบเข็ม
          ผ่านระบบห้องเรียนออนไลน์และเกมทดสอบที่สนุก
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link href="/register">
            <Button className="h-11 px-7 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm rounded-xl gap-2 cursor-pointer shadow-lg shadow-indigo-900/40">
              เริ่มใช้งานฟรี
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/quiz">
            <Button variant="outline" className="h-11 px-7 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 text-sm rounded-xl cursor-pointer">
              ลองทำแบบฝึกหัด
            </Button>
          </Link>
          <Link href="/learn/multimeter">
            <Button variant="outline" className="h-11 px-7 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 text-sm rounded-xl cursor-pointer">
              บทเรียนมัลติมิเตอร์
            </Button>
          </Link>
        </div>

        {/* Color band decorative strip */}
        <div className="mt-16 flex justify-center gap-1.5 flex-wrap max-w-lg mx-auto">
          {BAND_COLORS.map((c) => (
            <div
              key={c.name}
              title={c.name}
              className="relative group"
            >
              <div
                className="w-7 h-14 rounded-lg shadow-md border border-white/10 transition-transform group-hover:scale-110 group-hover:-translate-y-1 cursor-default"
                style={{ backgroundColor: c.hex }}
              />
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {c.name}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-widest">แถบสีมาตรฐาน IEC 60062</p>
      </section>

      {/* ───── What is a Resistor? ───── */}
      <section className="py-20 px-4 bg-white/30 dark:bg-zinc-900/30 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                <Layers className="size-3.5" />
                ทำความรู้จักตัวต้านทาน
              </div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                ตัวต้านทานคืออะไร?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                <strong className="text-zinc-800 dark:text-zinc-200">ตัวต้านทาน (Resistor)</strong> เป็นอุปกรณ์อิเล็กทรอนิกส์พื้นฐานที่ทำหน้าที่ต้านการไหลของกระแสไฟฟ้า
                มีหน่วยเป็น <strong className="text-indigo-400">โอห์ม (Ω)</strong>
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                ค่าความต้านทานจะถูกแสดงด้วย <strong className="text-zinc-800 dark:text-zinc-200">แถบสี</strong> ที่พิมพ์บนตัวชิ้นงาน
                ซึ่งแต่ละสีแทนตัวเลขตามมาตรฐาน — ทักษะการอ่านค่าเหล่านี้จำเป็นอย่างยิ่งในงานอิเล็กทรอนิกส์
              </p>
              <div className="space-y-2">
                {["แถบ 4 สี: ตัวเลข × ตัวเลข × คูณ × ค่าความผิดพลาด", "แถบ 5 สี: ตัวเลข × ตัวเลข × ตัวเลข × คูณ × ค่าความผิดพลาด"].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual resistor diagram */}
            <div className="relative bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center gap-6">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">ตัวอย่างตัวต้านทาน 4 แถบสี</p>
              <div className="flex items-center gap-0 w-full">
                {/* left lead */}
                <div className="h-[3px] flex-1 bg-zinc-600 rounded-l" />
                {/* body */}
                <div className="relative h-10 w-[200px] bg-[#d4a96a] rounded-[10px] flex items-center justify-center gap-3 shadow-lg shadow-amber-900/20 border border-amber-700/30">
                  {[
                    { hex: "#F44336" }, // red - 2
                    { hex: "#FF9800" }, // orange - 3
                    { hex: "#000000" }, // black - x1
                    { hex: "#FFD700" }, // gold - ±5%
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-full rounded-sm border border-white/10 shadow-sm"
                      style={{ backgroundColor: b.hex, marginLeft: i === 3 ? "auto" : undefined }}
                    />
                  ))}
                </div>
                {/* right lead */}
                <div className="h-[3px] flex-1 bg-zinc-600 rounded-r" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-indigo-400">23 Ω <span className="text-amber-400 text-base">±5%</span></div>
                <p className="text-[11px] text-zinc-500 mt-1">แดง-ส้ม-ดำ-ทอง = 23 โอห์ม ±5%</p>
              </div>
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-4 gap-2 text-center">
                {["แดง = 2", "ส้ม = 3", "ดำ = ×1", "ทอง = ±5%"].map((t) => (
                  <div key={t} className="text-[10px] text-zinc-500">{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── What is a Multimeter? ───── */}
      <section className="py-20 px-4 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Visual Multimeter Diagram */}
            <div className="relative bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center gap-6 order-2 md:order-1">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">จำลองหน้าปัดและย่านวัด</p>
              
              <div className="w-full max-w-[280px] bg-zinc-850 rounded-xl p-3 border border-zinc-300/50 dark:border-zinc-700/50 shadow-lg flex flex-col gap-4">
                {/* Dial screen */}
                <div className="relative w-full aspect-[1.8] bg-zinc-100 rounded-t-xl rounded-b border border-zinc-300 overflow-hidden flex justify-center shadow-inner">
                  {/* Stylized arc scale */}
                  <div className="absolute top-4 w-48 h-48 border-4 border-zinc-400 border-dashed rounded-full opacity-40" />
                  <div className="absolute top-7 w-40 h-40 border-2 border-indigo-500/20 rounded-full" />
                  
                  {/* Needle */}
                  <div className="absolute bottom-0 left-1/2 w-[2px] h-[85%] bg-red-500 origin-bottom -translate-x-1/2 rotate-[15deg]" />
                  
                  {/* Pivot */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-zinc-900 rounded-full border-2 border-zinc-650" />
                  
                  {/* Numbers */}
                  <span className="absolute left-4 bottom-2 text-[9px] font-bold text-zinc-600">0</span>
                  <span className="absolute right-4 bottom-2 text-[9px] font-bold text-zinc-600">∞</span>
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-indigo-500">Ω / V</span>
                </div>

                {/* Knob */}
                <div className="flex justify-center items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-zinc-300 dark:border-zinc-700 flex items-center justify-center shadow-md relative">
                    {/* Dial mark */}
                    <div className="absolute top-1 w-1.5 h-3 bg-red-500 rounded-full" />
                    <div className="text-[7px] text-zinc-500 dark:text-zinc-400 font-bold uppercase mt-2">OHM</div>
                  </div>
                  <div className="text-left text-xs space-y-1">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ย่านวัดที่เลือก</div>
                    <div className="text-indigo-400 font-bold font-mono">Ω x10</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">บิดเพื่อคูณค่าจากเข็มชี้</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-black text-indigo-400">150 Ω</div>
                <p className="text-[11px] text-zinc-500 mt-1">เข็มชี้ที่เลข 15 × ย่านวัด x10 = 150 โอห์ม</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-5 order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                <Layers className="size-3.5" />
                ทำความรู้จักมัลติมิเตอร์
              </div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                มัลติมิเตอร์คืออะไร?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                <strong className="text-zinc-800 dark:text-zinc-200">มัลติมิเตอร์ (Multimeter)</strong> เป็นอุปกรณ์วัดปริมาณทางไฟฟ้าอเนกประสงค์ สามารถวัดได้ทั้งกระแสตรง/สลับ, แรงดันไฟ และความต้านทานไฟฟ้า
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                การฝึกอ่านค่ามัลติมิเตอร์แบบอนาล็อก (แบบเข็ม) เป็นทักษะพื้นฐานหลักในการวิเคราะห์และตรวจซ่อมวงจรอิเล็กทรอนิกส์
              </p>
              <div className="space-y-2">
                {[
                  "ย่านความต้านทาน (Ω): อ่านตัวเลขแถวบนสุดจากขวาไปซ้าย แล้วคูณด้วยย่านวัด",
                  "ย่านแรงดัน (DCV/ACV): อ่านสเกลเชิงเส้นจากซ้ายไปขวาตามแถบย่านวัดที่ถูกต้อง",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              
              {/* <div className="pt-2">
                <Link href="/learn/multimeter">
                  <Button variant="outline" className="h-10 px-5 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 text-xs rounded-xl cursor-pointer">
                    ศึกษาบทเรียนมัลติมิเตอร์
                  </Button>
                </Link>
              </div> */}
            </div>

          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">ระบบที่ครบครัน</h2>
            <p className="text-zinc-500 text-sm mt-2">ทุกสิ่งที่ต้องการสำหรับการเรียนรู้รหัสสีตัวต้านทาน</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:bg-white/80 dark:hover:bg-zinc-900/80 group"
              >
                <div className="p-2.5 bg-zinc-100/60 dark:bg-zinc-800/60 border border-zinc-300/60 dark:border-zinc-700/60 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-bold text-zinc-900 dark:text-zinc-100 text-base">{f.title}</h3>
                <p className="mt-1.5 text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Banner ───── */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto relative bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden text-center">
          {/* Inner glows */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 mx-auto">
            <GraduationCap className="size-3.5" />
            <span>เริ่มต้นพัฒนาการเรียนรู้วันนี้</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            ยกระดับทักษะการวัดและการอ่านค่าอิเล็กทรอนิกส์
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-4 max-w-xl mx-auto leading-relaxed">
            เข้าร่วมแพลตฟอร์มการเรียนรู้รูปแบบ Interactive ฟรี เรียนรู้รหัสสีตัวต้านทานและเครื่องมือวัดมัลติมิเตอร์อย่างเป็นขั้นตอน เหมาะสำหรับการเรียนการสอนในชั้นเรียนและการศึกษาด้วยตนเอง
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white font-bold text-sm rounded-xl gap-2 cursor-pointer w-full sm:w-auto transition-all shadow-lg shadow-indigo-900/35">
                เริ่มต้นใช้งานบัญชีฟรี
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="h-11 px-8 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white text-sm rounded-xl cursor-pointer w-full sm:w-auto transition-all">
                เข้าสู่ระบบผู้ใช้งาน
              </Button>
            </Link>
          </div>

          {/* Core highlights row */}
          <div className="mt-12 pt-8 border-t border-zinc-850/60 grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {[
              { label: "Interactive Tools", val: "เครื่องมือแบบโต้ตอบ" },
              { label: "Classroom Support", val: "รองรับระบบห้องเรียน" },
              { label: "100% Free to Use", val: "ใช้งานฟรีไม่มีค่าใช้จ่าย" }
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</div>
                <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-8 text-center text-xs text-zinc-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20">
            <Zap className="size-3 text-indigo-400" />
          </div>
          <span className="font-bold text-zinc-500 dark:text-zinc-400">Practice-Lab</span>
        </div>
        <p>ระบบฝึกทักษะการอ่านค่าตัวต้านทานและมัลติมิเตอร์ | Resistor & Multimeter Learning Platform</p>
      </footer>

    </div>
  );
}
