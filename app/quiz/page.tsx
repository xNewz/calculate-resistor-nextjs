"use client";
import { useState, useEffect, useCallback } from "react";
import ResistorPreview from "@/components/ResistorPreview";
import {
  digits,
  multipliers,
  tolerances,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Award, Trophy, HelpCircle, CheckCircle2, XCircle, ArrowRight, Eye } from "lucide-react";

interface Question {
  bands: 4 | 5;
  colors: string[];
  resistance: number;
  formatted: string;
  tolerance: number;
}

function formatMultiplierValue(value: number): string {
  if (value === 0.1) return "0.1";
  if (value === 0.01) return "0.01";
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}k`;
  return `${value}`;
}

const generateQuestion = (): Question => {
  const bands = Math.random() > 0.5 ? 5 : 4;

  if (bands === 4) {
    const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1]; // no black first
    const second = digits[Math.floor(Math.random() * digits.length)];
    const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
    const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
    const res = calculate4Band(first, second, mult, tol);
    return {
      bands: 4,
      colors: [first, second, mult, tol],
      resistance: res.resistance,
      formatted: res.formatted,
      tolerance: res.tolerance
    };
  } else {
    const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1]; // no black first
    const second = digits[Math.floor(Math.random() * digits.length)];
    const third = digits[Math.floor(Math.random() * digits.length)];
    const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
    const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
    const res = calculate5Band(first, second, third, mult, tol);
    return {
      bands: 5,
      colors: [first, second, third, mult, tol],
      resistance: res.resistance,
      formatted: res.formatted,
      tolerance: res.tolerance
    };
  }
};

function parseTextAnswer(input: string): number | null {
  // Strip spacing, common units and Ω / ohm
  const clean = input.trim().toLowerCase().replace(/[\sΩohmωโอห์ม]/g, "");

  // Regex to match number and optional unit
  const match = clean.match(/^([0-9.]+)(k|m|g)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const unit = match[2];
  if (unit === "k") return num * 1_000;
  if (unit === "m") return num * 1_000_000;
  if (unit === "g") return num * 1_000_000_000;
  return num;
}

export default function QuizPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Load highscore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("resistor_quiz_highscore");
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
    // Generate first question
    setQuestion(generateQuestion());
  }, []);

  const handleNext = useCallback(() => {
    setQuestion(generateQuestion());
    setUserAnswer("");
    setFeedback({ type: null, message: "" });
    setIsAnswerRevealed(false);
    setHasChecked(false);
  }, []);

  const handleCheck = () => {
    if (!question || !userAnswer.trim()) {
      setFeedback({ type: "warning", message: "กรุณากรอกคำตอบก่อนตรวจคำตอบครับ" });
      return;
    }

    const parsed = parseTextAnswer(userAnswer);
    if (parsed === null) {
      setFeedback({
        type: "warning",
        message: "รูปแบบคำตอบไม่ถูกต้อง ตัวอย่างที่ถูกต้อง: 150, 1.5k, 2.2M",
      });
      return;
    }

    // Compare with margin for floats
    const diff = Math.abs(parsed - question.resistance);
    const limit = 0.01 * question.resistance; // 1% tolerance margin on answer math rounding

    if (diff <= limit) {
      const nextScore = score + 10 + streak * 2;
      setScore(nextScore);
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem("resistor_quiz_highscore", nextScore.toString());
      }

      setFeedback({
        type: "success",
        message: `ถูกต้องแล้ว! 🎉 คำตอบคือ ${formatValue(question.resistance)} (คุณได้รับ +${10 + streak * 2} คะแนน)`,
      });
      setHasChecked(true);
    } else {
      setStreak(0);
      setFeedback({
        type: "error",
        message: `ยังไม่ถูกต้อง! ลองคำนวณใหม่อีกครั้ง หรือกดปุ่มเฉลย`,
      });
    }
  };

  const handleReveal = () => {
    setIsAnswerRevealed(true);
    setStreak(0);
    setFeedback({
      type: "error",
      message: `เฉลยคำตอบคือ: ${formatValue(question!.resistance)} (ระบบรีเซ็ต Streak ของคุณ)`,
    });
  };

  const handleSkip = () => {
    setStreak(0);
    handleNext();
  };

  const getExplanation = (q: Question) => {
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
      <div className="space-y-3 text-xs text-zinc-300 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 mt-4">
        <h4 className="font-bold text-amber-400 mb-1 text-sm flex items-center gap-1.5">
          <HelpCircle className="size-4" />
          <span>วิธีคำนวณคำตอบ ({q.bands} แถบสี):</span>
        </h4>
        <ul className="space-y-2 list-none pl-0">
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบที่ 1 (หลักที่ 1):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info1?.hex }} />
            <span className="font-semibold text-zinc-200">{info1?.nameTh} ({info1?.nameEn})</span>
            <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[10px]">{d1}</Badge>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบที่ 2 (หลักที่ 2):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info2?.hex }} />
            <span className="font-semibold text-zinc-200">{info2?.nameTh} ({info2?.nameEn})</span>
            <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[10px]">{d2}</Badge>
          </li>
          {is5 && info3 && (
            <li className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 w-28">แถบที่ 3 (หลักที่ 3):</span>
              <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info3?.hex }} />
              <span className="font-semibold text-zinc-200">{info3?.nameTh} ({info3?.nameEn})</span>
              <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[10px]">{d3}</Badge>
            </li>
          )}
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบที่ {is5 ? 4 : 3} (ตัวคูณ):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: infoMult?.hex }} />
            <span className="font-semibold text-zinc-200">{infoMult?.nameTh} ({infoMult?.nameEn})</span>
            <Badge variant="outline" className="font-mono border-zinc-800 px-1.5 h-4.5 rounded text-[10px]">x {formatMultiplierValue(multiplierVal)}</Badge>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 w-28">แถบความคลาดเคลื่อน:</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: infoTol?.hex }} />
            <span className="font-semibold text-zinc-200">{infoTol?.nameTh} ({infoTol?.nameEn})</span>
            <Badge variant="outline" className="font-mono border-amber-500/20 bg-amber-500/5 text-amber-400 px-1.5 h-4.5 rounded text-[10px]">±{toleranceVal}%</Badge>
          </li>
        </ul>
        <div className="pt-2.5 border-t border-zinc-800/80 font-mono text-zinc-400 flex flex-wrap gap-1.5 items-center">
          <span className="font-semibold text-zinc-300">สมการ:</span>
          {is5 ? (
            <span>({d1}{d2}{d3}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance)})</span>
          ) : (
            <span>({d1}{d2}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance)})</span>
          )}
        </div>
      </div>
    );
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="size-12 text-amber-400 animate-bounce mx-auto" />
          <p className="text-lg font-bold text-zinc-300">กำลังเตรียมข้อคำถาม...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-[calc(100-4rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-zinc-900/40 border-zinc-850 p-4 flex flex-col items-center justify-center text-center rounded-xl shadow-lg">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">คะแนนปัจจุบัน</span>
              <span className="text-2xl md:text-3xl font-black text-amber-400 mt-1 font-heading">{score}</span>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-850 p-4 flex flex-col items-center justify-center text-center rounded-xl shadow-lg">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">คะแนนสูงสุด</span>
              <span className="text-2xl md:text-3xl font-black text-yellow-500 mt-1 font-heading flex items-center gap-1">
                <Trophy className="size-4 md:size-5 text-yellow-500" />
                <span>{highScore}</span>
              </span>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-850 p-4 flex flex-col items-center justify-center text-center rounded-xl shadow-lg">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">สถิติต่อเนื่อง (Streak)</span>
              <span className="text-2xl md:text-3xl font-black text-orange-400 mt-1 font-heading">
                {streak > 0 ? `🔥 ${streak}` : "0"}
              </span>
            </Card>
          </div>

          {/* Main Content Card */}
          <Card className="bg-zinc-900/60 backdrop-blur-md border-zinc-850 shadow-2xl rounded-2xl">
            <CardHeader className="border-b border-zinc-800/80 pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <CardTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <Award className="size-5 text-amber-400" />
                    <span>ตอบคำถามค่าโอห์ม</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    คำนวณและตอบค่าความต้านทานจากรูปภาพด้านล่าง
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-400 py-1 px-3">
                  แถบสี: {question.bands} แถบสี ({question.bands}-Band)
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">

              {/* Visual Preview */}
              <div className="py-4">
                <ResistorPreview colors={question.colors} />
              </div>

              {/* Form Input Section */}
              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="answer-input" className="text-sm font-semibold text-zinc-300">
                    ค่าความต้านทาน (หน่วยโอห์ม):
                  </Label>
                  <div className="relative">
                    <Input
                      id="answer-input"
                      type="text"
                      placeholder="ตัวอย่าง: 150, 1.5k, 2.2M, 10"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={hasChecked || isAnswerRevealed}
                      className="h-11 bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-zinc-700/50 pr-4 text-base rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCheck();
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    * ไม่จำเป็นต้องพิมพ์ตัวหน่วย Ω หรือโอห์ม สามารถพิมพ์ k หรือ M แทนการคูณหนึ่งพัน/หนึ่งล้านได้
                  </p>
                </div>

                {/* Feedback Panel */}
                {feedback.type && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
                      feedback.type === "success"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : feedback.type === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                    ) : feedback.type === "error" ? (
                      <XCircle className="size-5 shrink-0 mt-0.5" />
                    ) : (
                      <HelpCircle className="size-5 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm font-medium">{feedback.message}</span>
                  </div>
                )}

                {/* Buttons Control Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {!hasChecked && !isAnswerRevealed ? (
                    <>
                      <Button
                        onClick={handleCheck}
                        className="h-11 cursor-pointer bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl"
                      >
                        ตรวจคำตอบ
                      </Button>
                      <Button
                        onClick={handleReveal}
                        variant="outline"
                        className="h-11 cursor-pointer border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:text-zinc-100 text-zinc-300 rounded-xl"
                      >
                        <Eye className="size-4 mr-1.5" />
                        เฉลยข้อนี้
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="col-span-2 h-11 cursor-pointer bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <span>ทำโจทย์ข้อต่อไป</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>

                {!hasChecked && !isAnswerRevealed && (
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className="w-full h-10 cursor-pointer text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 text-xs rounded-xl"
                  >
                    ข้ามข้อนี้ (Streak จะเป็น 0)
                  </Button>
                )}
              </div>

              {/* Show calculation details on check/reveal */}
              {(hasChecked || isAnswerRevealed) && getExplanation(question)}

            </CardContent>
          </Card>

        </div>
      </div>
    </TooltipProvider>
  );
}
