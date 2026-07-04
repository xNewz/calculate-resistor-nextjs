"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import ResistorPreview from "@/components/ResistorPreview";
import MultimeterPreview from "@/components/MultimeterPreview";
import { generateMultimeterQuestion, parseMultimeterAnswer, MultimeterQuestion } from "@/lib/multimeter";
import {
  digits, multipliers, tolerances,
  calculate4Band, calculate5Band,
  parseTextAnswer,
  generateResistorChoices,
} from "@/lib/resistor";
import { generateMultimeterChoices } from "@/lib/multimeter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { submitQuizAction } from "@/app/actions/classroom";
import {
  ShieldAlert, Maximize, AlertTriangle, Clock, ArrowRight, Loader2, CheckCircle2, Bell
} from "lucide-react";

interface Question {
  bands?: 4 | 5;
  colors?: string[];
  resistance?: number;
  formatted: string;
  tolerance?: number;
  multimeterData?: MultimeterQuestion;
  choices?: string[];
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
    assignmentType?: string;
    questionCount: number;
    allowMobile?: boolean;
    dueDate?: Date | string | null;
    questionMode?: string;
  };
}


export default function ExamQuiz({ assignment }: ExamQuizProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|operamini/i;
      const isScreenSmall = window.innerWidth < 768;
      return mobileRegex.test(userAgent) || isScreenSmall;
    };
    setIsMobileDevice(checkMobile());
  }, []);

  const [gameState, setGameState] = useState<"intro" | "playing" | "submitting" | "violationAlert">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  
  const [overallTimeLeft, setOverallTimeLeft] = useState<number | null>(null);
  const [examStartTime, setExamStartTime] = useState<number | null>(null);

  // Initialize timer based on dueDate
  useEffect(() => {
    if (assignment.dueDate) {
      const updateTimer = () => {
        const dueTime = new Date(assignment.dueDate!).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((dueTime - now) / 1000));
        setOverallTimeLeft(diffSeconds);
      };
      updateTimer();
    }
  }, [assignment.dueDate]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-cheat state
  const [violations, setViolations] = useState(0);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const maxViolations = 3;
  const [warningCountdown, setWarningCountdown] = useState(15);
  const shownWarningIdsRef = useRef<Set<string>>(new Set());
  const [activeTeacherWarning, setActiveTeacherWarning] = useState<{ id: string; message: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate questions
  const generateQuestions = useCallback(() => {
    const list: Question[] = [];
    const type = assignment.assignmentType || "RESISTOR";
    const mode = assignment.questionMode || "INPUT";

    if (type === "MULTIMETER") {
      for (let i = 0; i < assignment.questionCount; i++) {
        const q = generateMultimeterQuestion();
        const choices = mode === "CHOICE" ? generateMultimeterChoices(q.formatted, q.range.type) : undefined;
        list.push({ formatted: q.formatted, multimeterData: q, choices });
      }
      return list;
    }

    const bands = parseInt(assignment.bandType, 10) as 4 | 5;
    for (let i = 0; i < assignment.questionCount; i++) {
      if (bands === 4) {
        const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1];
        const second = digits[Math.floor(Math.random() * digits.length)];
        const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
        const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
        const res = calculate4Band(first, second, mult, tol);
        const choices = mode === "CHOICE" ? generateResistorChoices(res.formatted, 4) : undefined;
        list.push({ bands: 4, colors: [first, second, mult, tol], ...res, choices });
      } else {
        const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1];
        const second = digits[Math.floor(Math.random() * digits.length)];
        const third = digits[Math.floor(Math.random() * digits.length)];
        const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
        const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
        const res = calculate5Band(first, second, third, mult, tol);
        const choices = mode === "CHOICE" ? generateResistorChoices(res.formatted, 5) : undefined;
        list.push({ bands: 5, colors: [first, second, third, mult, tol], ...res, choices });
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
    if (gameState !== "playing" || isTransitioning) return;

    // Calculate elapsed seconds since exam started
    const elapsedSeconds = examStartTime ? Math.max(0, Math.floor((Date.now() - examStartTime) / 1000)) : 0;
    const formatElapsed = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };
    const timeText = `ผ่านไป ${formatElapsed(elapsedSeconds)} นาที`;

    let desc = "";
    if (type === "TAB_SWITCH") desc = "สลับหน้าจอ (พับหน้าจอ / เปิดแท็บอื่น)";
    else if (type === "FULLSCREEN_EXIT") desc = "ออกจากโหมดเต็มจอ";
    else if (type === "COPY_PASTE") desc = "พยายามคัดลอก หรือ วางข้อความ";
    else if (type === "CONTEXT_MENU") desc = "พยายามคลิกขวาเปิดคอนเท็กซ์เมนู";
    else if (type === "BACK_BUTTON_EXIT") desc = "พยายามกดย้อนกลับ หรือปัดหน้าจอเพื่อออกจากห้องสอบ";

    const details = `${timeText} - ${desc}`;
    reportViolationToServer(type, details);
    
    setViolations(prev => {
       const current = prev + 1;
       if (current >= maxViolations) {
         setIsAutoSubmitted(true);
         submitExam(attempts, true, current);
       }
       return current;
    });

    setGameState("violationAlert");
  }, [gameState, attempts, submitExam, examStartTime, isTransitioning]);

  // Anti-Cheat Listeners
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "violationAlert") return;

    // Push dummy state to capture browser back clicks
    window.history.pushState(null, "", window.location.href);

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

    const handlePopState = (e: PopStateEvent) => {
      // Re-push history state to prevent navigation
      window.history.pushState(null, "", window.location.href);
      handleViolation("BACK_BUTTON_EXIT");
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้าสอบ? การปิดหน้าต่างนี้จะถูกบันทึกเป็นการละเมิดกฎ";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", blockDefault);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("paste", blockCopy);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", blockDefault);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("paste", blockCopy);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
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

  // Countdown during violation alert (Auto-Submit if ignored/inactive)
  useEffect(() => {
    if (gameState !== "violationAlert") {
      setWarningCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setWarningCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsAutoSubmitted(true);
          submitExam(attempts, true, violations);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, attempts, submitExam, violations]);

  // Poll for teacher warnings
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "violationAlert") return;

    const checkWarnings = async () => {
      try {
        const res = await fetch(`/api/exam/violation?assignmentId=${assignment.id}`);
        const data = await res.json();
        if (data.success && data.warnings) {
          const newWarning = data.warnings.find((w: any) => !shownWarningIdsRef.current.has(w.id));
          if (newWarning) {
            setActiveTeacherWarning({ id: newWarning.id, message: newWarning.details || "กรุณาตั้งใจทำข้อสอบ" });
            setGameState("violationAlert");
          }
        }
      } catch (e) {
        console.error("Failed to fetch teacher warnings:", e);
      }
    };

    checkWarnings();
    const interval = setInterval(checkWarnings, 3000);
    return () => clearInterval(interval);
  }, [gameState, assignment.id]);

  const resumeExam = () => {
    setIsTransitioning(true);
    
    if (containerRef.current && containerRef.current.requestFullscreen && !document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => {
          setGameState("playing");
          setTimeout(() => setIsTransitioning(false), 2000);
        })
        .catch((err) => {
          console.error("Fullscreen failed:", err);
          setGameState("playing");
          setTimeout(() => setIsTransitioning(false), 2000);
        });
    } else {
      setGameState("playing");
      setTimeout(() => setIsTransitioning(false), 2000);
    }
  };

  const acknowledgeTeacherWarning = () => {
    if (activeTeacherWarning) {
      shownWarningIdsRef.current.add(activeTeacherWarning.id);
      setActiveTeacherWarning(null);
    }
    
    // Resume game & re-enter fullscreen
    resumeExam();
  };


  const startExamState = () => {
    setQuestions(generateQuestions());
    setCurrentIndex(0);
    setUserAnswer("");
    setAttempts([]);
    setGameState("playing");
    setIsImageLoaded(false);
    setExamStartTime(Date.now()); // Record starting timestamp
  };

  const enterFullscreenAndStart = () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen().then(() => {
        startExamState();
      }).catch((err) => {
        // Fallback for browsers that block it or fail (e.g. mobile permissions)
        console.warn("Fullscreen failed or not supported, starting anyway.", err);
        startExamState();
      });
    } else {
      // Fallback for iOS Safari which doesn't support requestFullscreen on elements
      console.warn("Fullscreen API not supported on this browser/device, starting anyway.");
      startExamState();
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
      if (assignment.assignmentType === "MULTIMETER" && currentQuestion.multimeterData) {
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* INTRO STATE */}
        {gameState === "intro" && (
          assignment.allowMobile === false && isMobileDevice ? (
            <Card className="bg-zinc-900 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] rounded-2xl overflow-hidden border border-red-900/40 py-0 gap-0">
              <CardHeader className="text-center pb-6 pt-6 px-6 sm:px-8 border-b border-zinc-850 bg-red-500/5">
                <div className="mx-auto p-4 rounded-full bg-red-500/10 border border-red-500/20 w-fit mb-3 text-red-500">
                  <ShieldAlert className="size-8 animate-bounce" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-zinc-100 mb-2 font-heading tracking-tight">
                  ปฏิเสธการเข้าสอบผ่านอุปกรณ์มือถือ
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-red-400 font-medium">
                  ข้อสอบนี้กำหนดให้ทำผ่านเครื่องคอมพิวเตอร์เท่านั้น
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-5 text-center">
                <p className="text-xs sm:text-sm text-zinc-355 leading-relaxed">
                  เนื่องจากข้อสอบนี้มีการตั้งค่าความปลอดภัยขั้นสูงและ <strong className="text-red-400">ไม่อนุญาตให้เข้าทำข้อสอบผ่านโทรศัพท์มือถือหรือแท็บเล็ต</strong> เพื่อความเสถียรและความโปร่งใสในการตรวจสอบพฤติกรรม
                </p>
                <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/80">
                  กรุณาเปิดเบราว์เซอร์บนเครื่องคอมพิวเตอร์ตั้งโต๊ะ (Desktop PC) หรือโน้ตบุ๊ก (Laptop) เพื่อทำข้อสอบนี้
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => router.push(`/classroom/${assignment.classroomId}`)}
                    className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl border border-zinc-700 cursor-pointer text-xs sm:text-sm"
                  >
                    กลับสู่หน้าห้องเรียน
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-hidden border border-red-500/20 py-0 gap-0">
              <CardHeader className="text-center pb-6 pt-6 px-6 sm:px-8 border-b border-zinc-850 bg-red-500/5">
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
              <CardContent className="p-6 sm:p-8 space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <Maximize className="size-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">บังคับแสดงผลเต็มจอ</h4>
                      <p className="text-xs text-zinc-400">คุณต้องอยู่ในโหมดเต็มจอตลอดการสอบ หากออกจากโหมดเต็มจอจะถือว่าทุจริต {isMobileDevice ? "(อุปกรณ์พกพาของท่านได้รับความยินยอมโดยระบบ)" : "(หากอุปกรณ์ไม่รองรับ เช่น มือถือระบบ iOS ระบบจะอนุโลมให้ทำข้อสอบได้ตามปกติ)"}</p>
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
                      <p className="text-xs text-zinc-400">
                        {assignment.dueDate 
                          ? `ต้องส่งก่อนเวลา ${new Date(assignment.dueDate).toLocaleString("th-TH")} น. (เวลาที่เหลือ: ${overallTimeLeft !== null ? formatTime(overallTimeLeft) : "คำนวณ..."})` 
                          : "ไม่จำกัดเวลา"} (มีทั้งหมด {assignment.questionCount} ข้อ)
                      </p>
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
          )
        )}

        {/* VIOLATION ALERT */}
        {gameState === "violationAlert" && (
          <Card className="bg-zinc-900 border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)] rounded-2xl overflow-hidden py-0 gap-0">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
              {activeTeacherWarning ? (
                <>
                  <div className="relative">
                    <Bell className="size-20 text-amber-550 animate-bounce" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black text-amber-400">คำเตือนจากอาจารย์ผู้สอน!</h2>
                    <div className="bg-zinc-950/80 border border-zinc-800 p-5 rounded-xl max-w-md mx-auto my-2 text-zinc-200 font-bold text-sm italic">
                      "{activeTeacherWarning.message}"
                    </div>
                    <p className="text-xs text-zinc-400">
                      กรุณากดปุ่มรับทราบด้านล่างเพื่อยืนยันการรับทราบคำเตือน
                    </p>
                    <p className="text-red-400 font-bold text-xs animate-pulse">
                      กรุณาตอบกลับภายใน {warningCountdown} วินาที (มิฉะนั้นระบบจะส่งข้อสอบทันที)
                    </p>
                  </div>
                  <Button 
                    onClick={acknowledgeTeacherWarning}
                    className="bg-amber-500 text-black hover:bg-amber-600 font-bold px-8 h-12 rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer animate-pulse"
                  >
                    รับทราบและทำข้อสอบต่อ
                  </Button>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-20 text-red-500 animate-pulse" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">ตรวจพบพฤติกรรมน่าสงสัย!</h2>
                    <p className="text-zinc-400">คุณได้ออกจากโหมดเต็มจอ หรือเปิดหน้าต่างอื่น</p>
                    <p className="text-red-400 font-bold text-lg">
                      คำเตือนครั้งที่ {violations} / {maxViolations}
                    </p>
                    <p className="text-red-400 font-bold text-xs animate-pulse">
                      กรุณากลับเข้าสู่การสอบภายใน {warningCountdown} วินาที (มิฉะนั้นระบบจะส่งข้อสอบทันที)
                    </p>
                  </div>
                  <Button 
                    onClick={resumeExam}
                    className="bg-white text-black hover:bg-zinc-200 font-bold px-8 h-12 rounded-xl cursor-pointer"
                  >
                    กลับเข้าสู่การสอบ
                  </Button>
                </>
              )}
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
                  {assignment.assignmentType === "MULTIMETER" && currentQuestion.multimeterData ? (
                    <MultimeterPreview 
                      range={currentQuestion.multimeterData.range} 
                      pointerValue={currentQuestion.multimeterData.pointerValue} 
                      onLoad={() => setIsImageLoaded(true)} 
                    />
                  ) : (
                    <ResistorPreview 
                      colors={currentQuestion.colors || []}
                      onLoad={() => setIsImageLoaded(true)}
                    />
                  )}
                </div>

                <div className="w-full max-w-sm space-y-4 transition-all duration-500">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold text-zinc-300 flex items-center justify-between">
                      คำตอบของคุณ
                      <span className="text-xs font-normal text-zinc-500">
                        {assignment.assignmentType === "MULTIMETER" 
                          ? (currentQuestion.multimeterData?.range.type === "OHM" ? "เลือกคำตอบหน่วย: โอห์ม (Ω)" : "เลือกคำตอบหน่วย: โวลต์ (V)") 
                          : "เลือกคำตอบที่ถูกต้อง"}
                      </span>
                    </Label>
                    
                    {assignment.questionMode === "CHOICE" && currentQuestion.choices ? (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {currentQuestion.choices.map((choice) => {
                          const isSelected = userAnswer === choice;
                          return (
                            <Button
                              key={choice}
                              type="button"
                              variant="outline"
                              onClick={() => setUserAnswer(choice)}
                              className={`h-14 text-sm font-mono font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
                                isSelected 
                                  ? "bg-red-500/25 border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.2)]" 
                                  : "bg-zinc-950/60 border-zinc-800 text-zinc-350 hover:bg-zinc-900 hover:text-zinc-200"
                              }`}
                              disabled={!isImageLoaded}
                            >
                              {choice}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
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
                          <span className="font-serif italic">
                            {assignment.assignmentType === "MULTIMETER" 
                              ? (currentQuestion.multimeterData?.range.type === "OHM" ? "Ω" : "V") 
                              : "Ω"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleNext}
                    disabled={!isImageLoaded || processingRef.current || (assignment.questionMode === "CHOICE" && !userAnswer)}
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
