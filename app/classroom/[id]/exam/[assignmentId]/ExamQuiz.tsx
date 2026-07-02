"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import ResistorPreview from "@/components/ResistorPreview";
import {
  digits, multipliers, tolerances,
  calculate4Band, calculate5Band,
} from "@/lib/resistor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { submitQuizAction } from "@/app/actions/classroom";
import {
  ShieldAlert, Maximize, AlertTriangle, Clock, ArrowRight, Loader2, CheckCircle2
} from "lucide-react";

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

interface ExamQuizProps {
  assignment: {
    id: string;
    classroomId: string;
    title: string;
    description: string | null;
    bandType: string;
    questionCount: number;
    timeLimit: number | null;
  };
}

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

export default function ExamQuiz({ assignment }: ExamQuizProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [gameState, setGameState] = useState<"intro" | "playing" | "submitting" | "violationAlert">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  
  const [overallTimeLeft, setOverallTimeLeft] = useState<number | null>(
    assignment.timeLimit ? assignment.timeLimit * 60 : null
  );
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-cheat state
  const [violations, setViolations] = useState(0);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const maxViolations = 3;

  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate questions
  const generateQuestions = useCallback(() => {
    const bands = parseInt(assignment.bandType, 10) as 4 | 5;
    const list: Question[] = [];
    for (let i = 0; i < assignment.questionCount; i++) {
      if (bands === 4) {
        const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1];
        const second = digits[Math.floor(Math.random() * digits.length)];
        const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
        const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
        const res = calculate4Band(first, second, mult, tol);
        list.push({ bands: 4, colors: [first, second, mult, tol], ...res });
      } else {
        const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1];
        const second = digits[Math.floor(Math.random() * digits.length)];
        const third = digits[Math.floor(Math.random() * digits.length)];
        const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
        const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
        const res = calculate5Band(first, second, third, mult, tol);
        list.push({ bands: 5, colors: [first, second, third, mult, tol], ...res });
      }
    }
    return list;
  }, [assignment]);

  const reportViolationToServer = async (type: string, details?: string) => {
    try {
      await fetch("/api/exam/violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: assignment.id, type, details }),
      });
    } catch (e) {
      console.error("Failed to report violation", e);
    }
  };

  const submitExam = useCallback((finalAttempts: UserAttempt[], autoSub: boolean, currentVio: number) => {
    setGameState("submitting");
    const finalScore = finalAttempts.filter((a) => a.isCorrect).length;

    startTransition(async () => {
      const res = await submitQuizAction(
        assignment.id,
        finalScore,
        finalAttempts,
        currentVio,
        autoSub
      );
      if (res.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        router.push(`/classroom/${assignment.classroomId}/assignment/${assignment.id}/submission/${res.data.id}`);
        router.refresh();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการส่งคำตอบ");
        setGameState("playing");
      }
    });
  }, [assignment, router]);

  const handleViolation = useCallback((type: string) => {
    if (gameState !== "playing") return;

    reportViolationToServer(type);
    
    setViolations(prev => {
      const current = prev + 1;
      if (current >= maxViolations) {
        setIsAutoSubmitted(true);
        submitExam(attempts, true, current);
      }
      return current;
    });

    setGameState("violationAlert");
  }, [gameState, attempts, submitExam]);

  // Anti-Cheat Listeners
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "violationAlert") return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        handleViolation("TAB_SWITCH");
      }
    };
    
    const handleBlur = () => {
      handleViolation("TAB_SWITCH");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("FULLSCREEN_EXIT");
      }
    };

    const blockDefault = (e: Event) => {
      e.preventDefault();
      handleViolation("CONTEXT_MENU");
    };

    const blockCopy = (e: Event) => {
      e.preventDefault();
      handleViolation("COPY_PASTE");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", blockDefault);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("paste", blockCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", blockDefault);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("paste", blockCopy);
    };
  }, [gameState, handleViolation]);


  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing" || overallTimeLeft === null) return;

    const timer = setInterval(() => {
      setOverallTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(attempts, true, violations);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, overallTimeLeft, submitExam, attempts, violations]);


  const enterFullscreenAndStart = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen().then(() => {
        setQuestions(generateQuestions());
        setCurrentIndex(0);
        setUserAnswer("");
        setAttempts([]);
        setGameState("playing");
        setIsImageLoaded(false);
      }).catch((err) => {
        setError("เบราว์เซอร์ไม่รองรับโหมดเต็มจอ หรือถูกบล็อก");
      });
    }
  };

  const saveAttemptAndProceed = useCallback((answer: string) => {
    if (gameState !== "playing") return;
    if (processingRef.current) return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    processingRef.current = true;
    const cleanAnswer = answer.trim();

    let isCorrect = false;
    if (cleanAnswer) {
      const parsed = parseTextAnswer(cleanAnswer);
      if (parsed !== null) {
        const diff = Math.abs(parsed - currentQuestion.resistance);
        const limit = 0.01 * currentQuestion.resistance;
        isCorrect = diff <= limit;
      }
    }

    const newAttempt: UserAttempt = {
      question: currentQuestion,
      userAnswer: cleanAnswer || "ข้าม",
      isCorrect,
      isTimeout: false,
    };

    const nextAttempts = [...attempts, newAttempt];
    setAttempts(nextAttempts);

    if (nextAttempts.length === assignment.questionCount) {
      submitExam(nextAttempts, false, violations);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setIsImageLoaded(false);
    }
    
    // Give react time to render before resetting ref
    setTimeout(() => {
      processingRef.current = false;
      inputRef.current?.focus();
    }, 50);
  }, [questions, currentIndex, gameState, attempts, assignment, submitExam, violations]);

  const handleNext = () => {
    saveAttemptAndProceed(userAnswer);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  const currentQuestion = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* INTRO STATE */}
        {gameState === "intro" && (
          <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-hidden border-red-500/20">
            <CardHeader className="text-center pb-6 border-b border-zinc-850 bg-red-500/5">
              <div className="mx-auto p-4 rounded-full bg-red-500/10 border border-red-500/20 w-fit mb-3 text-red-400">
                <ShieldAlert className="size-8" />
              </div>
              <CardTitle className="text-2xl font-black text-zinc-100 mb-2 font-heading tracking-tight">
                โหมดสอบ: {assignment.title}
              </CardTitle>
              <CardDescription className="text-sm text-zinc-400 font-medium">
                การทดสอบนี้มีการจับตาดูพฤติกรรมการทุจริตอย่างเข้มงวด
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <Maximize className="size-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">บังคับแสดงผลเต็มจอ</h4>
                    <p className="text-xs text-zinc-400">คุณต้องอยู่ในโหมดเต็มจอตลอดการสอบ หากออกจากโหมดเต็มจอจะถือว่าทุจริต</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <AlertTriangle className="size-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">ห้ามสลับแท็บหรือเปิดหน้าต่างอื่น</h4>
                    <p className="text-xs text-zinc-400">ระบบจะบันทึกการละเมิดกฎ หากทำผิดครบ {maxViolations} ครั้ง ระบบจะบังคับส่งข้อสอบทันที</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <Clock className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">เวลาในการทำข้อสอบ</h4>
                    <p className="text-xs text-zinc-400">{assignment.timeLimit ? `จำกัดเวลา ${assignment.timeLimit} นาที` : "ไม่จำกัดเวลา"} (มีทั้งหมด {assignment.questionCount} ข้อ)</p>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-400 text-sm text-center font-bold bg-red-500/10 p-3 rounded-xl">{error}</div>}

              <Button 
                onClick={enterFullscreenAndStart}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all cursor-pointer"
              >
                ยอมรับเงื่อนไขและเริ่มทำข้อสอบ
              </Button>
            </CardContent>
          </Card>
        )}

        {/* VIOLATION ALERT */}
        {gameState === "violationAlert" && (
          <Card className="bg-zinc-900 border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)] rounded-2xl overflow-hidden animate-pulse">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
              <AlertTriangle className="size-20 text-red-500" />
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">ตรวจพบพฤติกรรมน่าสงสัย!</h2>
                <p className="text-zinc-400">คุณได้ออกจากโหมดเต็มจอ หรือเปิดหน้าต่างอื่น</p>
                <p className="text-red-400 font-bold text-lg">
                  คำเตือนครั้งที่ {violations} / {maxViolations}
                </p>
              </div>
              <Button 
                onClick={() => {
                  if (containerRef.current && !document.fullscreenElement) {
                    containerRef.current.requestFullscreen().then(() => setGameState("playing")).catch(() => setGameState("playing"));
                  } else {
                    setGameState("playing");
                  }
                }}
                className="bg-white text-black hover:bg-zinc-200 font-bold px-8 h-12 rounded-xl"
              >
                กลับเข้าสู่การสอบ
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && currentQuestion && (
          <div className="space-y-4">
            
            {/* Exam Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 font-bold px-3 py-1">
                  โหมดสอบ
                </Badge>
                <span className="text-sm font-semibold text-zinc-300">
                  ข้อที่ {currentIndex + 1} / {assignment.questionCount}
                </span>
              </div>
              
              {overallTimeLeft !== null && (
                <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-lg border ${
                  overallTimeLeft < 60 ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" : "bg-zinc-950 border-zinc-800 text-zinc-200"
                }`}>
                  <Clock className="size-5" />
                  {formatTime(overallTimeLeft)}
                </div>
              )}
            </div>

            <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-hidden relative">
              <CardContent className="p-6 sm:p-10 flex flex-col items-center">
                
                <div className="w-full flex justify-center mb-10 mt-6 relative h-32 items-center">
                  <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 -z-10" />
                  <ResistorPreview 
                    colors={currentQuestion.colors}
                    onLoad={() => setIsImageLoaded(true)}
                  />
                </div>

                <div className="w-full max-w-sm space-y-4 transition-all duration-500">
                  <div className="space-y-1.5">
                    <Label htmlFor="answer" className="text-sm font-bold text-zinc-300 flex items-center justify-between">
                      คำตอบของคุณ
                      <span className="text-xs font-normal text-zinc-500">ใส่ตัวเลข เช่น 4.7k, 100</span>
                    </Label>
                    <div className="relative group">
                      <Input
                        ref={inputRef}
                        id="answer"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!isImageLoaded}
                        placeholder="พิมพ์ค่าความต้านทาน..."
                        className="h-14 bg-zinc-950 border-2 border-zinc-800 text-lg sm:text-xl font-bold px-4 transition-all group-hover:border-zinc-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-zinc-100 placeholder:font-normal placeholder:text-zinc-700 rounded-xl disabled:opacity-50 select-none"
                        autoComplete="off"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 font-bold text-zinc-500 text-lg">
                        <span className="font-serif italic">Ω</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleNext}
                    disabled={!isImageLoaded || processingRef.current}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98] cursor-pointer"
                  >
                    {currentIndex === assignment.questionCount - 1 ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="size-4" /> ส่งข้อสอบ
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        ข้อต่อไป <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBMITTING STATE */}
        {gameState === "submitting" && (
          <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-hidden p-12 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 size-24 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="size-12 text-indigo-500 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">กำลังส่งคำตอบและประมวลผลคะแนน</h2>
              <p className="text-zinc-500 text-sm">กรุณารอสักครู่...</p>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
