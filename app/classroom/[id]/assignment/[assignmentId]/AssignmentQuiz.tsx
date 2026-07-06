"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import ResistorPreview from "@/components/ResistorPreview";
import MultimeterPreview from "@/components/MultimeterPreview";
import { generateMultimeterQuestion, parseMultimeterAnswer, MultimeterQuestion } from "@/lib/multimeter";
import {
  digits,
  multipliers,
  tolerances,
  calculate4Band,
  calculate5Band,
  formatValue,
  parseTextAnswer,
  generateResistorChoices,
} from "@/lib/resistor";
import { generateMultimeterChoices } from "@/lib/multimeter";
import { generateSeededQuestions } from "@/lib/seededQuestions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { submitQuizAction } from "@/app/actions/classroom";
import {
  Timer,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  GraduationCap,
  Play
} from "lucide-react";

interface Question {
  id?: string;
  text?: string;
  type?: "CHOICE" | "TEXT";
  options?: string[];
  correctAnswer?: string;
  bands?: 4 | 5;
  colors?: string[];
  resistance?: number;
  formatted?: string;
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

interface AssignmentQuizProps {
  classroomId: string;
  userId: string;
  assignment: {
    id: string;
    title: string;
    description: string | null;
    bandType: string; // "4" or "5"
    assignmentType?: string;
    questionCount: number;
    questionMode?: string;
    customQuestions?: any[];
  };
}


export default function AssignmentQuiz({ classroomId, userId, assignment }: AssignmentQuizProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [gameState, setGameState] = useState<"idle" | "playing" | "submitting">("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);
  
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  // Generate questions list
  const generateQuestions = useCallback(() => {
    if (assignment.assignmentType === "CUSTOM" && assignment.customQuestions) {
      return assignment.customQuestions;
    }
    return generateSeededQuestions(
      userId,
      assignment.id,
      assignment.assignmentType || "RESISTOR",
      assignment.questionCount,
      assignment.questionMode || "INPUT",
      assignment.bandType
    );
  }, [userId, assignment]);

  // Autofocus input
  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentIndex]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setIsImageLoaded(false);
  }, [currentIndex]);

  // Reset processing ref on index/state transitions
  useEffect(() => {
    processingRef.current = false;
  }, [currentIndex, gameState]);

  // Save student's answer and proceed
  const saveAttemptAndProceed = useCallback(
    (answer: string, isTimeoutState = false) => {
      if (gameState !== "playing") return;
      if (processingRef.current) return;

      const currentQuestion = questions[currentIndex];
      if (!currentQuestion) return;

      processingRef.current = true;
      const cleanAnswer = answer.trim();

      let isCorrect = false;
      if (cleanAnswer && !isTimeoutState) {
        if (assignment.assignmentType === "CUSTOM") {
          const correctAns = currentQuestion.correctAnswer || "";
          if (currentQuestion.type === "CHOICE") {
            isCorrect = cleanAnswer === correctAns;
          } else {
            isCorrect = cleanAnswer.trim().toLowerCase() === correctAns.trim().toLowerCase();
          }
        } else if (assignment.assignmentType === "MULTIMETER" && currentQuestion.multimeterData) {
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
        userAnswer: isTimeoutState ? "หมดเวลา" : cleanAnswer || "ข้าม",
        isCorrect,
        isTimeout: isTimeoutState,
      };

      const nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);

      if (nextAttempts.length === assignment.questionCount) {
        // Complete the quiz, submit scores
        setGameState("submitting");
        const finalScore = nextAttempts.filter((a) => a.isCorrect).length;

        startTransition(async () => {
          const res = await submitQuizAction(assignment.id, finalScore, nextAttempts);
          if (res.success) {
            // Redirect to review page
            router.push(`/classroom/${classroomId}/assignment/${assignment.id}/submission/${res.data.id}`);
            router.refresh();
          } else {
            setError(res.error || "เกิดข้อผิดพลาดในการส่งคำตอบ");
            setGameState("playing"); // Let them retry submitting
            processingRef.current = false;
          }
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        setUserAnswer("");
        setTimeLeft(30);
      }
    },
    [questions, currentIndex, gameState, attempts, assignment, classroomId, router]
  );

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing" || !isImageLoaded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          saveAttemptAndProceed("", true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentIndex, saveAttemptAndProceed, isImageLoaded]);

  const startQuiz = () => {
    setQuestions(generateQuestions());
    setCurrentIndex(0);
    setUserAnswer("");
    setAttempts([]);
    setTimeLeft(30);
    setError(null);
    setIsImageLoaded(false);
    processingRef.current = false;
    setGameState("playing");
  };

  const handleNext = () => {
    saveAttemptAndProceed(userAnswer, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* IDLE STATE */}
        {gameState === "idle" && (
          <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-6 border-b border-zinc-850">
              <div className="mx-auto p-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit mb-3 text-indigo-400">
                <GraduationCap className="size-10" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-zinc-100">
                {assignment.title}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-1.5">
                {assignment.description || "คำนวณค่าตัวต้านทานจากรหัสสีเพื่อสะสมคะแนน"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">ประเภทตัวต้านทาน</span>
                  <span className="text-sm font-bold text-zinc-200 mt-1">{assignment.bandType} แถบสี</span>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">จำนวนข้อสอบ</span>
                  <span className="text-sm font-bold text-zinc-200 mt-1">{assignment.questionCount} ข้อ</span>
                </div>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-zinc-400">
                <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5 text-xs">
                  <Timer className="size-4 text-indigo-400" />
                  คำชี้แจงกติกาแบบฝึกหัด:
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  {assignment.assignmentType === "CUSTOM" ? (
                    <>
                      <li>ตอบคำถามที่ผู้สอนกำหนดให้ถูกต้อง</li>
                      <li>มีเวลานับถอยหลังในตอบข้อละ 30 วินาที</li>
                    </>
                  ) : assignment.assignmentType === "MULTIMETER" ? (
                    <>
                      <li>อ่านค่าจากหน้าปัดมัลติมิเตอร์แบบเข็ม ตามย่านวัดที่กำหนด</li>
                      <li>มีเวลานับถอยหลังในตอบข้อละ 30 วินาที</li>
                      <li>สามารถกรอกหน่วยย่อได้ เช่น 1k, 1M เป็นต้น (ไม่ต้องใส่ V หรือ Ω)</li>
                    </>
                  ) : (
                    <>
                      <li>คำถามจะสุ่มตามแถบสีที่ผู้สอนมอบหมาย ({assignment.bandType} แถบสี)</li>
                      <li>มีเวลานับถอยหลังในตอบข้อละ 30 วินาที</li>
                      <li>สามารถกรอกหน่วยย่อได้ เช่น 100, 1k (1000 โอห์ม), 1.5M (1.5 เมกะโอห์ม)</li>
                    </>
                  )}
                  <li>หากเวลาหมด ระบบจะข้ามข้อโดยอัตโนมัติและถือเป็นคำตอบที่ผิด</li>
                  <li>เมื่อตอบครบทุกข้อ คะแนนจะถูกบันทึกเข้าระบบห้องเรียนเพื่อให้ผู้สอนตรวจ</li>
                </ul>
              </div>

              <Button
                onClick={startQuiz}
                size="lg"
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer shadow-md rounded-xl flex items-center justify-center gap-1.5"
              >
                <Play className="size-3.5 fill-primary-foreground text-primary-foreground" />
                <span>เริ่มทำแบบฝึกหัด</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && currentQuestion && (
          <div className="space-y-6">
            
            {/* Header progress & timer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-semibold text-zinc-400">
                  คำถามข้อที่ {currentIndex + 1}/{assignment.questionCount}
                </span>
                <div className="h-2 w-32 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-550 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / assignment.questionCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 py-1.5 px-3 rounded-xl ml-auto">
                <Clock className={`size-4 ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-indigo-400"}`} />
                <span className={`font-mono text-xs font-bold ${timeLeft <= 10 ? "text-red-400" : "text-zinc-200"}`}>
                  {timeLeft} วินาที
                </span>
              </div>
            </div>

            {/* Quiz Box */}
            <Card className="bg-zinc-900/60 border-zinc-850 shadow-2xl rounded-2xl overflow-visible">
              <CardContent className="pt-6 space-y-8">
                
                {/* Visual Resistor */}
                {assignment.assignmentType !== "CUSTOM" && (
                  <div className="py-4 min-h-[180px] flex flex-col justify-center relative">
                    <div className={isImageLoaded ? "block" : "hidden"}>
                      {assignment.assignmentType === "MULTIMETER" && currentQuestion.multimeterData ? (
                        <MultimeterPreview range={currentQuestion.multimeterData.range} pointerValue={currentQuestion.multimeterData.pointerValue} onLoad={handleImageLoad} />
                      ) : (
                        <ResistorPreview colors={currentQuestion.colors || []} onLoad={handleImageLoad} />
                      )}
                    </div>
                    {!isImageLoaded && (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="size-8 text-indigo-400 animate-spin" />
                        <div className="text-center text-xs text-zinc-500 animate-pulse">กำลังโหลดรูปภาพ...</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Input form or Choices Grid */}
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="answer-input" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block text-center">
                      {assignment.assignmentType === "CUSTOM"
                        ? currentQuestion.text
                        : assignment.assignmentType === "MULTIMETER" 
                        ? (currentQuestion.multimeterData?.range.type === "OHM" ? "เลือกคำตอบจากเข็ม (หน่วย: โอห์ม Ω)" : "เลือกคำตอบจากเข็ม (หน่วย: โวลต์ V)")
                        : "เลือกค่าความต้านทานที่ถูกต้อง (หน่วย: โอห์ม Ω)"}
                    </Label>

                    {((assignment.questionMode === "CHOICE" && currentQuestion.choices) || (assignment.assignmentType === "CUSTOM" && currentQuestion.type === "CHOICE" && currentQuestion.options)) ? (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {(currentQuestion.choices || currentQuestion.options || []).map((choice: string) => {
                          const isSelected = userAnswer === choice;
                          return (
                            <Button
                              key={choice}
                              type="button"
                              variant="outline"
                              onClick={() => setUserAnswer(choice)}
                              className={`min-h-14 text-sm font-mono font-bold rounded-xl border transition-all duration-200 cursor-pointer text-wrap h-auto py-2 ${
                                isSelected 
                                  ? "bg-indigo-500/25 border-indigo-500 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.2)]" 
                                  : "bg-zinc-950/60 border-zinc-800 text-zinc-350 hover:bg-zinc-900 hover:text-zinc-200"
                              }`}
                              disabled={isPending}
                            >
                              {choice}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        id="answer-input"
                        ref={inputRef}
                        type="text"
                        placeholder="กรอกคำตอบที่นี่..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-12 bg-zinc-950/70 border-zinc-800 focus:ring-zinc-750/50 text-center font-mono text-lg font-bold text-zinc-100 rounded-xl"
                        disabled={isPending}
                        autoComplete="off"
                      />
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <Button
                      onClick={() => saveAttemptAndProceed("ข้าม")}
                      variant="ghost"
                      className="flex-1 h-11 text-xs text-zinc-450 hover:bg-zinc-800/80 hover:text-zinc-200 rounded-xl"
                      disabled={isPending}
                    >
                      ข้ามข้อนี้
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={isPending || (assignment.questionMode === "CHOICE" && !userAnswer)}
                      className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>ส่งคำตอบ</span>
                      <ArrowRight className="size-4 text-primary-foreground" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBMITTING STATE */}
        {gameState === "submitting" && (
          <Card className="bg-zinc-900/60 border-zinc-850 p-12 text-center rounded-2xl shadow-2xl">
            <Loader2 className="size-10 text-indigo-400 animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-base text-zinc-200">กำลังส่งและบันทึกคะแนน...</h3>
            <p className="text-xs text-zinc-500 mt-1">กรุณารอสักครู่ ระบบกำลังจัดเก็บข้อมูลส่งอาจารย์ผู้สอน</p>
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 max-w-sm mx-auto">
                <ShieldAlert className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  );
}
