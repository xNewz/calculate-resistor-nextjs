"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ResistorPreview from "@/components/ResistorPreview";
import MultimeterPreview from "@/components/MultimeterPreview";
import { generateMultimeterQuestion, parseMultimeterAnswer, MultimeterQuestion } from "@/lib/multimeter";
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
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Award,
  Trophy,
  HelpCircle,
  XCircle,
  Timer,
  Clock,
  RotateCcw,
  Home,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Question {
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

function formatMultiplierValue(value: number): string {
  if (value === 0.1) return "0.1";
  if (value === 0.01) return "0.01";
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}k`;
  return `${value}`;
}

type QuizMode = "mixed" | "4-band" | "5-band" | "multimeter";

const generateQuestion = (mode: QuizMode): Question => {
  if (mode === "multimeter") {
    const q = generateMultimeterQuestion();
    return {
      formatted: q.formatted,
      multimeterData: q
    };
  }

  let bands: 4 | 5 = 4;
  if (mode === "4-band") bands = 4;
  else if (mode === "5-band") bands = 5;
  else bands = Math.random() > 0.5 ? 5 : 4;

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
  const clean = input.trim().toLowerCase().replace(/[\sΩohmωโอห์ม]/g, "");
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
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [quizMode, setQuizMode] = useState<QuizMode>("mixed");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  // Load highscore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("resistor_quiz_highscore_v2");
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Autofocus input when index changes
  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentIndex]);

  // Reset processing ref on index/state transitions
  useEffect(() => {
    processingRef.current = false;
  }, [currentIndex, gameState]);

  // Guard against undefined questions during state transitions
  const currentQuestion = questions[currentIndex];

  // Reset image load state on question change
  useEffect(() => {
    setIsImageLoaded(false);
  }, [currentIndex]);

  // Handle saving the user's attempt and moving to next question or ending game
  const saveAttemptAndProceed = useCallback((answer: string, isTimeoutState = false) => {
    if (gameState !== "playing") return;
    if (processingRef.current) return;
    
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    processingRef.current = true;
    const cleanAnswer = answer.trim();

    let isCorrect = false;
    if (cleanAnswer && !isTimeoutState) {
      if (quizMode === "multimeter" && currentQuestion.multimeterData) {
        const parsed = parseMultimeterAnswer(cleanAnswer, currentQuestion.multimeterData.range.type);
        if (parsed !== null) {
          const diff = Math.abs(parsed - currentQuestion.multimeterData.value);
          isCorrect = diff <= 0.001;
        }
      } else {
        const parsed = parseTextAnswer(cleanAnswer);
        if (parsed !== null && currentQuestion.resistance !== undefined) {
          const diff = Math.abs(parsed - currentQuestion.resistance);
          const limit = 0.01 * currentQuestion.resistance;
          isCorrect = diff <= limit;
        }
      }
    }

    const newAttempt: UserAttempt = {
      question: currentQuestion,
      userAnswer: isTimeoutState ? "หมดเวลา" : (cleanAnswer || "ข้าม"),
      isCorrect,
      isTimeout: isTimeoutState,
    };

    const nextAttempts = [...attempts, newAttempt];
    setAttempts(nextAttempts);

    const currentScore = nextAttempts.filter(a => a.isCorrect).length;
    setScore(currentScore);

    if (nextAttempts.length === 10) {
      setGameState("ended");
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem("resistor_quiz_highscore_v2", currentScore.toString());
      }
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setUserAnswer("");
      setTimeLeft(30);
    }
  }, [questions, currentIndex, highScore, gameState, attempts]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    saveAttemptAndProceed("", true);
  }, [saveAttemptAndProceed]);

  // Countdown timer effect
  useEffect(() => {
    if (gameState !== "playing" || !isImageLoaded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 30; // resets for next question
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentIndex, handleTimeout, isImageLoaded]);

  const startQuiz = () => {
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion(quizMode));
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setUserAnswer("");
    setAttempts([]);
    setScore(0);
    setTimeLeft(30);
    setIsImageLoaded(false);
    processingRef.current = false;
    setGameState("playing");
  };

  const handleNext = () => {
    saveAttemptAndProceed(userAnswer, false);
  };

  const getExplanation = (q: Question) => {
    if (q.multimeterData) {
      return (
        <div className="space-y-3 text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg border mt-2">
          <h4 className="font-semibold text-foreground mb-1 text-sm flex items-center gap-1.5">
            <HelpCircle className="size-4" />
            <span>วิธีอ่านค่ามัลติมิเตอร์ ({q.multimeterData.range.name}):</span>
          </h4>
          <ul className="space-y-2 list-none pl-0">
            <li className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground w-28">ย่านวัดที่ตั้ง (Range):</span>
              <Badge variant="secondary">{q.multimeterData.range.name}</Badge>
            </li>
            <li className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground w-28">เข็มชี้ที่เลข (สเกล):</span>
              <span className="font-semibold text-foreground">{q.multimeterData.pointerValue}</span>
            </li>
          </ul>
          <div className="pt-2 border-t font-mono text-muted-foreground flex flex-wrap gap-1.5 items-center">
            <span className="font-semibold text-foreground">ผลลัพธ์:</span>
            <span>
              {q.multimeterData.range.type === "OHM" 
                ? `${q.multimeterData.pointerValue} x ${q.multimeterData.range.maxScale} = ${q.multimeterData.value} Ω`
                : `${q.multimeterData.pointerValue} V`}
              {" "}({q.formatted})
            </span>
          </div>
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
      <div className="space-y-3 text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg border mt-2">
        <h4 className="font-semibold text-foreground mb-1 text-sm flex items-center gap-1.5">
          <HelpCircle className="size-4" />
          <span>วิธีคำนวณคำตอบ ({q.bands} แถบสี):</span>
        </h4>
        <ul className="space-y-2 list-none pl-0">
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground w-28">แถบที่ 1 (หลักที่ 1):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info1?.hex }} />
            <span className="font-semibold text-foreground">{info1?.nameTh} ({info1?.nameEn})</span>
            <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[10px]">{d1}</Badge>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground w-28">แถบที่ 2 (หลักที่ 2):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info2?.hex }} />
            <span className="font-semibold text-foreground">{info2?.nameTh} ({info2?.nameEn})</span>
            <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[10px]">{d2}</Badge>
          </li>
          {is5 && info3 && (
            <li className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground w-28">แถบที่ 3 (หลักที่ 3):</span>
              <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: info3?.hex }} />
              <span className="font-semibold text-foreground">{info3?.nameTh} ({info3?.nameEn})</span>
              <Badge variant="secondary" className="px-1.5 h-4.5 rounded font-mono text-[10px]">{d3}</Badge>
            </li>
          )}
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground w-28">แถบที่ {is5 ? 4 : 3} (ตัวคูณ):</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: infoMult?.hex }} />
            <span className="font-semibold text-foreground">{infoMult?.nameTh} ({infoMult?.nameEn})</span>
            <Badge variant="outline" className="font-mono px-1.5 h-4.5 rounded text-[10px]">x {formatMultiplierValue(multiplierVal)}</Badge>
          </li>
          <li className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground w-28">แถบความคลาดเคลื่อน:</span>
            <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: infoTol?.hex }} />
            <span className="font-semibold text-foreground">{infoTol?.nameTh} ({infoTol?.nameEn})</span>
            <Badge variant="outline" className="font-mono text-foreground px-1.5 h-4.5 rounded text-[10px]">±{toleranceVal}%</Badge>
          </li>
        </ul>
        <div className="pt-2 border-t font-mono text-muted-foreground flex flex-wrap gap-1.5 items-center">
          <span className="font-semibold text-foreground">สมการ:</span>
          {is5 ? (
            <span>({d1}{d2}{d3}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance || 0)})</span>
          ) : (
            <span>({d1}{d2}) x {formatMultiplierValue(multiplierVal)} = {q.resistance} Ω ({formatValue(q.resistance || 0)})</span>
          )}
        </div>
      </div>
    );
  };

  const getVerdict = (finalScore: number) => {
    if (finalScore === 10) return { text: "ระดับเทพ! อ่านรหัสสีได้แม่นยำและรวดเร็วไม่มีที่ติ 🎉", color: "text-green-500 dark:text-green-400" };
    if (finalScore >= 8) return { text: "ยอดเยี่ยมมาก! คุณมีความเข้าใจในรหัสสีอย่างดีเยี่ยม 🌟", color: "text-green-500 dark:text-green-400" };
    if (finalScore >= 5) return { text: "ผ่านเกณฑ์! ฝึกฝนอีกนิดจะทำให้คล่องแคล่วขึ้น 💪", color: "text-amber-500 dark:text-amber-400" };
    return { text: "ลองใหม่อีกครั้ง! ทบทวนตารางสีเพื่อทำคะแนนให้ดียิ่งขึ้น 📚", color: "text-destructive" };
  };

  return (
    <TooltipProvider>
      <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* IDLE STATE (START SCREEN) */}
          {gameState === "idle" && (
            <Card className="max-w-2xl mx-auto border-border">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto p-4 rounded-full bg-muted w-fit mb-4">
                  <Award className="size-12 text-foreground" />
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  แบบทดสอบรหัสสีตัวต้านทาน
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2 text-sm">
                  ทดสอบทักษะการคำนวณและอ่านค่าแถบสีตัวต้านทานจำนวน 10 ข้อ
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 border p-4 rounded-lg text-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">จำนวนข้อสอบ</span>
                    <span className="text-lg font-semibold mt-1">10 ข้อ</span>
                  </div>
                  <div className="bg-muted/40 border p-4 rounded-lg text-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">คะแนนสูงสุด</span>
                    <span className="text-lg font-semibold mt-1 flex items-center justify-center gap-1">
                      <Trophy className="size-4 text-muted-foreground" />
                      <span>{highScore}/10</span>
                    </span>
                  </div>
                </div>

                {/* Rules */}
                <div className="bg-muted/20 border p-5 rounded-lg space-y-3 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Timer className="size-4 text-foreground" />
                    กติกาการทำแบบทดสอบ:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>คุณสามารถเลือกทำแบบทดสอบ 4 แถบสี, 5 แถบสี หรือแบบสุ่มได้ รวม 10 ข้อ</li>
                    <li>มีเวลานับถอยหลังในการตอบข้อละ 30 วินาที</li>
                    <li>เมื่อส่งคำตอบแต่ละข้อ ระบบจะบันทึกและข้ามไปยังข้อถัดไปทันที</li>
                    <li>หากหมดเวลาก่อนตอบ จะถือว่าข้อนั้นผิด (Timeout) และข้ามข้อโดยอัตโนมัติ</li>
                    <li>ระบบจะสรุปคะแนนและเฉลยคำตอบพร้อมวิธีคำนวณให้ดูทั้งหมด 10 ข้อในตอนท้าย</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-foreground">เลือกรูปแบบการทดสอบ:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      variant={quizMode === "4-band" ? "default" : "outline"}
                      onClick={() => setQuizMode("4-band")}
                      className="h-11 text-xs"
                    >
                      4 แถบสี
                    </Button>
                    <Button
                      variant={quizMode === "5-band" ? "default" : "outline"}
                      onClick={() => setQuizMode("5-band")}
                      className="h-11 text-xs"
                    >
                      5 แถบสี
                    </Button>
                    <Button
                      variant={quizMode === "mixed" ? "default" : "outline"}
                      onClick={() => setQuizMode("mixed")}
                      className="h-11 text-xs"
                    >
                      สุ่ม (4 และ 5)
                    </Button>
                    <Button
                      variant={quizMode === "multimeter" ? "default" : "outline"}
                      onClick={() => setQuizMode("multimeter")}
                      className={`h-11 text-xs ${quizMode !== "multimeter" ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border-indigo-500/20" : ""}`}
                    >
                      สเกลมัลติมิเตอร์
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={startQuiz}
                  size="lg"
                  className="w-full h-11"
                >
                  เริ่มทำแบบทดสอบ
                </Button>
              </CardContent>
            </Card>
          )}

          {/* PLAYING STATE */}
          {gameState === "playing" && questions.length > 0 && currentQuestion && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Question Progress bar & stats */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm font-medium text-muted-foreground">
                    คำถามข้อที่ {currentIndex + 1}/10
                  </span>
                  <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge variant="outline">
                    {currentQuestion.multimeterData ? "มัลติมิเตอร์" : `${currentQuestion.bands}-Band`}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    คะแนนปัจจุบัน: <span className="font-semibold text-foreground">{score}</span>
                  </div>
                </div>
              </div>

              {/* Timer Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    <span>เวลานับถอยหลัง</span>
                  </span>
                  <span className={`font-mono text-sm ${timeLeft <= 5 ? "text-destructive font-semibold animate-pulse" : "text-foreground"}`}>
                    {timeLeft} วินาที
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      timeLeft <= 5 ? "bg-destructive animate-pulse" : "bg-primary"
                    }`}
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* Main Resistor Quiz Card */}
              <Card className="border-border">
                <CardContent className="space-y-6 pt-6">
                  {/* Visual Preview */}
                  <div className="py-2 min-h-[180px] flex flex-col justify-center relative">
                    <div className={isImageLoaded ? "block" : "hidden"}>
                      {currentQuestion.multimeterData ? (
                        <MultimeterPreview range={currentQuestion.multimeterData.range} pointerValue={currentQuestion.multimeterData.pointerValue} onLoad={() => setIsImageLoaded(true)} />
                      ) : (
                        <ResistorPreview colors={currentQuestion.colors || []} onLoad={() => setIsImageLoaded(true)} />
                      )}
                    </div>
                    {!isImageLoaded && (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="size-8 text-primary animate-spin" />
                        <div className="text-center text-xs text-muted-foreground animate-pulse">กำลังโหลดรูปภาพตัวต้านทาน...</div>
                      </div>
                    )}
                  </div>

                  {/* Form Input Section */}
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="answer-input">
                        {currentQuestion.multimeterData 
                          ? (currentQuestion.multimeterData.range.type === "OHM" ? "ค่าความต้านทาน (หน่วยโอห์ม Ω):" : "ค่าแรงดัน (หน่วยโวลต์ V):")
                          : "ค่าความต้านทาน (หน่วยโอห์ม Ω):"}
                      </Label>
                      <Input
                        id="answer-input"
                        ref={inputRef}
                        type="text"
                        placeholder={currentQuestion.multimeterData ? "พิมพ์ตัวเลข เช่น 1k, 50..." : "ตัวอย่าง: 150, 1.5k, 2.2M, 10"}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="h-10 text-base"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNext();
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        * พิมพ์ตัวย่อได้ เช่น k แทนพัน หรือ M แทนล้าน (เว้นว่างแล้วกดปุ่มเพื่อข้ามข้อได้)
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="pt-2">
                      <Button
                        onClick={handleNext}
                        className="w-full h-10 flex items-center justify-center gap-1.5"
                      >
                        <span>{currentIndex === 9 ? "ส่งคำตอบและตรวจคะแนน" : "บันทึกและข้อถัดไป"}</span>
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          )}

          {/* ENDED STATE (RESULTS SUMMARY SCREEN) */}
          {gameState === "ended" && (
            <Card className="max-w-2xl mx-auto border-border">
              <CardHeader className="text-center border-b pb-6">
                <div className="mx-auto p-4 rounded-full bg-muted w-fit mb-4">
                  <Trophy className="size-12 text-foreground" />
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  แบบทดสอบเสร็จสมบูรณ์!
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm mt-2">
                  สรุปผลคะแนนและรายละเอียดการคำนวณทั้งหมด
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 pt-6">
                
                {/* Score Showcase */}
                <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted/40 border max-w-sm mx-auto text-center space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">คะแนนสอบรวม</span>
                  <div className="flex items-baseline justify-center">
                    <h2 className="text-5xl font-bold tracking-tight text-foreground">
                      {score}
                    </h2>
                    <span className="text-xl font-medium text-muted-foreground">/10 คะแนน</span>
                  </div>
                  
                  <div className={`text-sm font-medium ${getVerdict(score).color}`}>
                    {getVerdict(score).text}
                  </div>
                </div>

                {/* Score breakdown listing */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">เฉลยและวิธีคำนวณแต่ละข้อ</h3>
                  
                  <Accordion className="w-full flex flex-col gap-2">
                    {attempts.map((attempt, index) => {
                      const isCorrect = attempt.isCorrect;
                      const isTimeout = attempt.isTimeout;
                      
                      return (
                        <AccordionItem
                          key={index}
                          value={`item-${index}`}
                          className="bg-card border rounded-lg px-4 py-1"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 py-3">
                              {/* Status Circle */}
                              {isCorrect ? (
                                <div className="p-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                  <Check className="size-4" />
                                </div>
                              ) : (
                                <div className="p-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                  <XCircle className="size-4" />
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm font-medium text-foreground">
                                  ข้อที่ {index + 1}: ตัวต้านทานแบบ {attempt.question.bands} แถบสี
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                                  <span>ตอบ: <span className="font-mono text-foreground font-semibold">{attempt.userAnswer}</span></span>
                                  <span>•</span>
                                  <span>เฉลย: <span className="font-mono text-foreground font-semibold">{formatValue(attempt.question.resistance || 0)}</span></span>
                                  {isTimeout && (
                                    <Badge variant="destructive" className="h-4.5 rounded py-0 px-1 text-[9px] font-medium leading-none">
                                      หมดเวลา
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <AccordionTrigger className="hover:no-underline py-4 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer">
                              ดูวิธีคิด
                            </AccordionTrigger>
                          </div>
                          <AccordionContent className="pb-4 border-t pt-2">
                            {/* Color bands list or Range info */}
                            {attempt.question.colors ? (
                              <div className="flex items-center gap-1.5 mb-3 mt-1">
                                <span className="text-[10px] text-muted-foreground mr-1 uppercase tracking-wider">สีแถบตัวต้านทาน:</span>
                                {attempt.question.colors.map((color, colorIdx) => {
                                  const info = COLOR_MAP[color];
                                  return (
                                    <Tooltip key={colorIdx}>
                                      <TooltipTrigger className="cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center">
                                        <div
                                          className="size-3 rounded-full border border-white/20 shadow-sm"
                                          style={{ backgroundColor: info?.hex || "#000" }}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-popover text-popover-foreground border text-[10px] py-1 px-2">
                                        {colorIdx + 1}. {info?.nameEn} ({info?.nameTh})
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            ) : null}
                            {getExplanation(attempt.question)}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>

                {/* Final Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t">
                  <Button
                    onClick={startQuiz}
                    className="w-full h-11 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="size-4" />
                    <span>เริ่มทำแบบทดสอบใหม่</span>
                  </Button>
                  <Link href="/" className="w-full block">
                    <Button
                      variant="outline"
                      className="w-full h-11 flex items-center justify-center gap-2"
                    >
                      <Home className="size-4" />
                      <span>กลับไปหน้าหลัก (ตัวคำนวณ)</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </TooltipProvider>
  );
}
