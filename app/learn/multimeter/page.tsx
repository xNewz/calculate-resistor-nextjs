"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MultimeterPreview from "@/components/MultimeterPreview";
import { MultimeterRange, multimeterRanges, formatMultimeterValue } from "@/lib/multimeter";

export default function MultimeterLearnPage() {
  const [selectedRange, setSelectedRange] = useState<MultimeterRange>(multimeterRanges[0]);
  const [pointerValue, setPointerValue] = useState<number>(0);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <BookOpen className="size-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100">สื่อการสอน (Learn)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">เลือกหัวข้อที่คุณต้องการศึกษา</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl w-fit">
              <Link href="/learn" className="px-5 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 font-bold text-sm transition-colors">
                ตัวต้านทาน (Resistor)
              </Link>
              <Link href="/learn/multimeter" className="px-5 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-sm border border-indigo-500/30">
                มัลติมิเตอร์ (Multimeter)
              </Link>
            </div>
          </div>

          <Link href="/">
            <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800 gap-2 shrink-0">
              <ArrowLeft className="size-4" /> กลับสู่หน้าหลัก
            </Button>
          </Link>
        </div>

        {/* Simulator Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">จำลองหน้าปัดมัลติมิเตอร์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center py-6 min-h-[250px]">
                <MultimeterPreview range={selectedRange} pointerValue={pointerValue} />
              </div>
              <Button onClick={randomizeReading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                สุ่มค่าการวัด (Randomize)
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">การตั้งค่าย่านวัดและวิธีอ่าน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-400 uppercase">เลือกย่านวัด</label>
                <div className="grid grid-cols-3 gap-2">
                  {multimeterRanges.map((range) => (
                    <Button
                      key={range.name}
                      variant={selectedRange.name === range.name ? "default" : "outline"}
                      className={
                        selectedRange.name === range.name
                          ? range.type === "OHM" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                          : "border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs"
                      }
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

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">เข็มชี้ที่สเกลเลข:</span>
                  <span className="text-xl font-bold font-mono text-zinc-200">{pointerValue}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">ย่านวัดที่ตั้ง (Range):</span>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">{selectedRange.name}</Badge>
                </div>
                <div className="flex flex-col space-y-2 pt-2">
                  <span className="text-zinc-400">วิธีการคำนวณ:</span>
                  <span className="font-mono text-sm">
                    {selectedRange.type === "OHM"
                      ? `${pointerValue} x ${selectedRange.maxScale} = ${actualValue} Ω`
                      : `อ่านค่าตรงจากสเกล ${selectedRange.maxScale} ได้เลย`}
                  </span>
                </div>
                <div className="pt-4 mt-2 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">ผลลัพธ์ที่ได้ (ค่าจริง)</span>
                  <span className="text-3xl font-black text-white drop-shadow-md">
                    {formattedValue}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theory Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="size-5 text-yellow-500" />
                <span>การอ่านค่าย่านความต้านทาน (Ω - Ohm)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-400 leading-relaxed">
              <p>
                สเกลโอห์ม (มักจะอยู่แถวบนสุด และเป็นสีดำ) จะมีลักษณะพิเศษคือ <strong>สเกลไม่เป็นเชิงเส้น (Non-linear)</strong> และ <strong>ค่า 0 จะอยู่ทางขวามือ</strong> (เมื่อเอาสายวัดช็อตกัน) ส่วนทางซ้ายสุดจะเป็นค่าอนันต์ (∞)
              </p>
              <ul className="list-none space-y-2 pt-2">
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <strong>x1:</strong> อ่านค่าจากสเกลแล้วคูณด้วย 1 (ค่าที่อ่านได้คือค่าจริงเลย)</li>
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <strong>x10:</strong> อ่านค่าจากสเกลแล้วคูณด้วย 10</li>
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <strong>x1k:</strong> อ่านค่าจากสเกลแล้วคูณด้วย 1,000 (ใส่หน่วย kΩ)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="size-5 text-yellow-500" />
                <span>การอ่านค่าย่านแรงดัน (DCV / ACV)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-400 leading-relaxed">
              <p>
                สเกลแรงดัน (มักจะเป็นสีแดง หรืออยู่แถวกลาง) จะเป็น <strong>สเกลเชิงเส้น (Linear)</strong> และ <strong>ค่า 0 จะอยู่ทางซ้ายมือสุด</strong> โดยปกติจะมีสเกลหลักให้ดู 3 แถว คือ 0-10, 0-50, และ 0-250
              </p>
              <ul className="list-none space-y-2 pt-2">
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <strong>ย่าน 10V:</strong> ให้อ่านจากสเกล 0-10 (แต่ละขีดเล็กมีค่า 0.2V)</li>
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <strong>ย่าน 50V:</strong> ให้อ่านจากสเกล 0-50 (แต่ละขีดเล็กมีค่า 1V)</li>
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <strong>ย่าน 250V:</strong> ให้อ่านจากสเกล 0-250 (แต่ละขีดเล็กมีค่า 5V)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
