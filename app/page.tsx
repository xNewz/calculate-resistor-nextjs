"use client";
import { useMemo, useState } from "react";
import ResistorPreview from "@/components/ResistorPreview";
import {
  digits,
  multipliers,
  tolerances,
  type Digit,
  type Multiplier,
  type Tolerance,
  calculate4Band,
  calculate5Band,
  COLOR_MAP,
  DIGIT_MAP,
  MULTIPLIER_MAP,
  TOLERANCE_MAP,
  formatValue,
} from "@/lib/resistor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Info, Table, Sparkles } from "lucide-react";

function formatMultiplierValue(value: number): string {
  if (value === 0.1) return "0.1";
  if (value === 0.01) return "0.01";
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}k`;
  return `${value}`;
}

function BandSelect({
  label,
  value,
  onChange,
  options,
  tooltipText,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly string[];
  tooltipText: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</Label>
        <Tooltip>
          <TooltipTrigger className="text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors cursor-pointer bg-transparent border-0 p-0 inline-flex items-center justify-center">
            <Info className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-850 text-zinc-100 border border-zinc-700 max-w-[200px] text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </div>
      <Select value={value} onValueChange={(val) => { if (val !== null) onChange(val); }}>
        <SelectTrigger className="w-full h-11 bg-zinc-950/60 border-zinc-800 text-zinc-100 focus:ring-zinc-750/50 hover:bg-zinc-900 transition-all duration-200 cursor-pointer">
          <SelectValue placeholder="เลือกสี..." />
        </SelectTrigger>
        <SelectContent className="bg-zinc-950/98 border border-zinc-800 text-zinc-100 max-h-[300px] shadow-2xl rounded-xl">
          {options.map((color) => {
            const info = COLOR_MAP[color];
            if (!info) return null;

            // Calculate representation for value
            let valRepr = "";
            if (options === digits) {
              valRepr = `(${DIGIT_MAP[color]})`;
            } else if (options === multipliers) {
              const m = MULTIPLIER_MAP[color];
              if (m >= 1_000_000) valRepr = `(x${m / 1_000_000}M)`;
              else if (m >= 1_000) valRepr = `(x${m / 1_000}k)`;
              else valRepr = `(x${m})`;
            } else if (options === tolerances) {
              valRepr = `(±${TOLERANCE_MAP[color]}%)`;
            }

            return (
              <SelectItem key={color} value={color} className="focus:bg-zinc-850 focus:text-zinc-100 cursor-pointer py-2 px-3 rounded-lg">
                <div className="flex items-center gap-2.5 w-full">
                  <div
                    className="size-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: info.hex }}
                  />
                  <span className="font-semibold text-sm">{info.nameEn}</span>
                  <span className="text-xs text-zinc-400">({info.nameTh})</span>
                  {valRepr && <span className="ml-auto text-xs text-zinc-500 font-mono font-bold">{valRepr}</span>}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function Page() {
  const [bandType, setBandType] = useState<"4" | "5">("4");

  // State for 4-band
  const [first4, setFirst4] = useState<Digit>("brown");
  const [second4, setSecond4] = useState<Digit>("black");
  const [mult4, setMult4] = useState<Multiplier>("red");
  const [tol4, setTol4] = useState<Tolerance>("gold");

  // State for 5-band
  const [first5, setFirst5] = useState<Digit>("yellow");
  const [second5, setSecond5] = useState<Digit>("purple");
  const [third5, setThird5] = useState<Digit>("black");
  const [mult5, setMult5] = useState<Multiplier>("brown");
  const [tol5, setTol5] = useState<Tolerance>("gold");

  const randomizeColors = () => {
    if (bandType === "4") {
      setFirst4(digits[Math.floor(Math.random() * (digits.length - 1)) + 1]); // don't start with black for first band
      setSecond4(digits[Math.floor(Math.random() * digits.length)]);
      setMult4(multipliers[Math.floor(Math.random() * multipliers.length)]);
      setTol4(tolerances[Math.floor(Math.random() * tolerances.length)]);
    } else {
      setFirst5(digits[Math.floor(Math.random() * (digits.length - 1)) + 1]); // don't start with black
      setSecond5(digits[Math.floor(Math.random() * digits.length)]);
      setThird5(digits[Math.floor(Math.random() * digits.length)]);
      setMult5(multipliers[Math.floor(Math.random() * multipliers.length)]);
      setTol5(tolerances[Math.floor(Math.random() * tolerances.length)]);
    }
  };

  const result = useMemo(() => {
    if (bandType === "4") {
      return calculate4Band(first4, second4, mult4, tol4);
    } else {
      return calculate5Band(first5, second5, third5, mult5, tol5);
    }
  }, [bandType, first4, second4, mult4, tol4, first5, second5, third5, mult5, tol5]);

  const activeColors = useMemo(() => {
    if (bandType === "4") {
      return [first4, second4, mult4, tol4];
    } else {
      return [first5, second5, third5, mult5, tol5];
    }
  }, [bandType, first4, second4, mult4, tol4, first5, second5, third5, mult5, tol5]);

  return (
    <TooltipProvider>
      <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Calculator Card */}
          <Card className="bg-zinc-900/60 backdrop-blur-md border-zinc-850 shadow-2xl overflow-visible rounded-2xl">
            <CardHeader className="border-b border-zinc-800/80 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <Calculator className="size-5 text-indigo-400" />
                    <span>ตัวคำนวณค่าตัวต้านทาน</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-400">เลือกประเภทแถบสีและกำหนดแถบสีที่ต้องการคำนวณ</CardDescription>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <Button
                    onClick={randomizeColors}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 cursor-pointer border-zinc-850 bg-zinc-900/50 hover:bg-zinc-900 hover:text-zinc-100 h-9 px-3 rounded-lg text-xs"
                  >
                    <Sparkles className="size-4 text-indigo-400 animate-pulse" />
                    <span className="font-semibold">สุ่มแถบสี</span>
                  </Button>

                  <Tabs value={bandType} onValueChange={(v) => setBandType(v as "4" | "5")} className="w-full md:w-auto">
                    <TabsList className="grid grid-cols-2 w-full md:w-[240px] bg-zinc-950 border border-zinc-850 p-1 rounded-lg h-9">
                      <TabsTrigger value="4" className="text-xs h-7 rounded-md cursor-pointer">4 แถบสี (4-Band)</TabsTrigger>
                      <TabsTrigger value="5" className="text-xs h-7 rounded-md cursor-pointer">5 แถบสี (5-Band)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">

              {/* Visual Preview */}
              <div className="py-4">
                <ResistorPreview colors={activeColors} />
              </div>

              {/* Selector Inputs */}
              <div>
                {bandType === "4" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <BandSelect
                      label="แถบที่ 1 (หลักที่ 1)"
                      value={first4}
                      onChange={(val) => setFirst4(val as Digit)}
                      options={digits}
                      tooltipText="ตัวเลขหลักแรกของค่าความต้านทาน"
                    />
                    <BandSelect
                      label="แถบที่ 2 (หลักที่ 2)"
                      value={second4}
                      onChange={(val) => setSecond4(val as Digit)}
                      options={digits}
                      tooltipText="ตัวเลขหลักที่สองของค่าความต้านทาน"
                    />
                    <BandSelect
                      label="แถบที่ 3 (ตัวคูณ)"
                      value={mult4}
                      onChange={(val) => setMult4(val as Multiplier)}
                      options={multipliers}
                      tooltipText="ตัวเลขตัวคูณความต้านทาน (10^N)"
                    />
                    <BandSelect
                      label="แถบที่ 4 (ความคลาดเคลื่อน)"
                      value={tol4}
                      onChange={(val) => setTol4(val as Tolerance)}
                      options={tolerances}
                      tooltipText="เปอร์เซ็นต์ความคลาดเคลื่อนของค่าความต้านทาน"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <BandSelect
                      label="แถบที่ 1 (หลักที่ 1)"
                      value={first5}
                      onChange={(val) => setFirst5(val as Digit)}
                      options={digits}
                      tooltipText="ตัวเลขหลักแรกของค่าความต้านทาน"
                    />
                    <BandSelect
                      label="แถบที่ 2 (หลักที่ 2)"
                      value={second5}
                      onChange={(val) => setSecond5(val as Digit)}
                      options={digits}
                      tooltipText="ตัวเลขหลักที่สองของค่าความต้านทาน"
                    />
                    <BandSelect
                      label="แถบที่ 3 (หลักที่ 3)"
                      value={third5}
                      onChange={(val) => setThird5(val as Digit)}
                      options={digits}
                      tooltipText="ตัวเลขหลักที่สามของค่าความต้านทาน"
                    />
                    <BandSelect
                      label="แถบที่ 4 (ตัวคูณ)"
                      value={mult5}
                      onChange={(val) => setMult5(val as Multiplier)}
                      options={multipliers}
                      tooltipText="ตัวเลขตัวคูณความต้านทาน (10^N)"
                    />
                    <BandSelect
                      label="แถบที่ 5 (ความคลาดเคลื่อน)"
                      value={tol5}
                      onChange={(val) => setTol5(val as Tolerance)}
                      options={tolerances}
                      tooltipText="เปอร์เซ็นต์ความคลาดเคลื่อนของค่าความต้านทาน"
                    />
                  </div>
                )}
              </div>

              {/* Output & Detail Card */}
              <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 shadow-inner flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">ค่าความต้านทานรวม</span>
                    <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] py-0.5 px-2">
                      {bandType === "4" ? "4-Band" : "5-Band"}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2 justify-center md:justify-start">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 font-heading">
                      {result.formatted}
                    </h2>
                    <span className="text-xl md:text-2xl font-bold text-zinc-400">
                      ±{result.tolerance}%
                    </span>
                  </div>

                  {/* Visual color dot sequence */}
                  <div className="flex items-center justify-center md:justify-start gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500 mr-1 uppercase tracking-wider">ลำดับสี:</span>
                    {activeColors.map((color, index) => {
                      const info = COLOR_MAP[color];
                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger className="cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center">
                            <div
                              className="size-3.5 rounded-full border border-white/20 shadow-md transform hover:scale-125 transition-transform duration-200"
                              style={{ backgroundColor: info?.hex || "#000" }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="bg-zinc-850 text-zinc-100 border border-zinc-700 text-[10px] py-1 px-2">
                            {index + 1}. {info?.nameEn} ({info?.nameTh})
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full md:w-auto grid grid-cols-2 gap-x-8 gap-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 text-sm">
                  <div>
                    <span className="text-zinc-500 block text-xs">ค่าต่ำสุดที่เป็นไปได้</span>
                    <span className="font-semibold text-zinc-300">{formatValue(result.minResistance)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs">ค่าสูงสุดที่เป็นไปได้</span>
                    <span className="font-semibold text-zinc-300">{formatValue(result.maxResistance)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-550 block text-xs">ช่วงค่าความต้านทานที่ยอมรับได้</span>
                    <span className="font-mono text-xs text-indigo-400/90 font-medium">{result.formattedRange}</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Reference Table Component */}
          <Card className="bg-zinc-900/40 border-zinc-850 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Table className="size-5 text-indigo-400/80" />
                <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-1.5">
                  <Table className="size-4.5" />
                  <span>ตารางอ้างอิงรหัสสีตัวต้านทาน</span>
                </CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                ข้อมูลรหัสสีมาตรฐานสากล EIA (International Color Code Standard)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion className="border-t border-zinc-800">
                <AccordionItem value="color-table" className="border-zinc-800">
                  <AccordionTrigger className="text-zinc-200 text-sm font-semibold hover:text-indigo-400 hover:no-underline py-3 cursor-pointer">
                    แสดงตารางค่าสีทั้งหมด
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/40">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold">
                            <th className="p-3">สี (Color)</th>
                            <th className="p-3 text-center">ตัวเลข (Digit)</th>
                            <th className="p-3 text-center">ตัวคูณ (Multiplier)</th>
                            <th className="p-3 text-center">ความคลาดเคลื่อน (Tolerance)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-zinc-300">
                          {Object.entries(COLOR_MAP).map(([key, value]) => {
                            const isDigit = DIGIT_MAP[key] !== undefined;
                            const isMult = MULTIPLIER_MAP[key] !== undefined;
                            const isTol = TOLERANCE_MAP[key] !== undefined;

                            return (
                              <tr key={key} className="hover:bg-zinc-900/20 transition-colors">
                                <td className="p-3 font-medium flex items-center gap-2">
                                  <div
                                    className="size-3 rounded-full border border-white/20 shadow-sm"
                                    style={{ backgroundColor: value.hex }}
                                  />
                                  <span>{value.nameEn}</span>
                                  <span className="text-zinc-500">({value.nameTh})</span>
                                </td>
                                <td className="p-3 text-center font-mono text-zinc-400">
                                  {isDigit ? (
                                    <Badge variant="secondary" className="font-mono px-1.5 h-4.5 rounded text-[10px]">
                                      {DIGIT_MAP[key]}
                                    </Badge>
                                  ) : "-"}
                                </td>
                                <td className="p-3 text-center font-mono text-zinc-400">
                                  {isMult ? (
                                    <Badge variant="outline" className="font-mono border-zinc-800 px-1.5 h-4.5 rounded text-[10px]">
                                      x {formatMultiplierValue(MULTIPLIER_MAP[key])}
                                    </Badge>
                                  ) : "-"}
                                </td>
                                <td className="p-3 text-center font-mono text-zinc-400">
                                  {isTol ? (
                                    <Badge variant="outline" className="font-mono border-indigo-500/20 bg-indigo-500/5 text-indigo-400 px-1.5 h-4.5 rounded text-[10px]">
                                      ±{TOLERANCE_MAP[key]}%
                                    </Badge>
                                  ) : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Footer */}
          <footer className="text-center text-xs text-zinc-500 space-y-1">
            <p>เครื่องคำนวณนี้คำนวณตามมาตรฐานรหัสสี EIA-RS-279</p>
            <p>© {new Date().getFullYear()} Resistor Calculator. พัฒนาด้วย Next.js, Tailwind CSS และ shadcn/ui</p>
          </footer>

        </div>
      </div>
    </TooltipProvider>
  );
}
