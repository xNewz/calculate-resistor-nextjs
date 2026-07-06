"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export type CustomQuestionType = "CHOICE" | "TEXT";

export interface CustomQuestion {
  id: string;
  text: string;
  type: CustomQuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
}

interface Props {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

export function CustomQuestionBuilder({ questions, onChange }: Props) {
  const addQuestion = () => {
    const newQ: CustomQuestion = {
      id: Math.random().toString(36).substring(7),
      text: "",
      type: "CHOICE",
      options: ["ตัวเลือก 1", "ตัวเลือก 2"],
      correctAnswer: "ตัวเลือก 1",
      points: 1,
    };
    onChange([...questions, newQ]);
  };

  const updateQuestion = (index: number, updates: Partial<CustomQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    onChange(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length >= 6) return;
    updateQuestion(qIndex, { options: [...q.options, `ตัวเลือก ${q.options.length + 1}`] });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return;
    const newOptions = [...q.options];
    newOptions.splice(optIndex, 1);
    
    // Update correct answer if the removed option was the correct one
    let newCorrect = q.correctAnswer;
    if (q.correctAnswer === q.options[optIndex]) {
      newCorrect = newOptions[0];
    }
    updateQuestion(qIndex, { options: newOptions, correctAnswer: newCorrect });
  };

  const updateOption = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    const oldVal = q.options[optIndex];
    const newOptions = [...q.options];
    newOptions[optIndex] = val;

    let newCorrect = q.correctAnswer;
    if (newCorrect === oldVal) {
      newCorrect = val;
    }
    updateQuestion(qIndex, { options: newOptions, correctAnswer: newCorrect });
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <Accordion className="space-y-4">
          {questions.map((q, qIndex) => (
            <AccordionItem key={q.id} value={q.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 overflow-hidden border-b-0">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left w-full pr-4">
                  <span className="shrink-0 text-sm font-bold text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
                    ข้อ {qIndex + 1}
                  </span>
                  <span className="text-sm text-zinc-200 line-clamp-1 flex-1">
                    {q.text || "คำถามใหม่"}
                  </span>
                  <Badge variant="outline" className="text-[10px] ml-auto shrink-0 bg-zinc-950 text-zinc-400">
                    {q.type === "CHOICE" ? "ปรนัย" : "อัตนัย"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 space-y-5 border-t border-zinc-800/50 mt-2">
                <div className="flex items-start justify-between gap-4 mt-4">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-400">คำถาม</Label>
                    <Input
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                      placeholder="ระบุคำถาม..."
                      className="w-full bg-zinc-950 border-zinc-800 text-sm"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 mt-6"
                    title="ลบคำถาม"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs text-zinc-400">ประเภทคำถาม</Label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(qIndex, { type: e.target.value as CustomQuestionType })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                    >
                      <option value="CHOICE">ปรนัย (มีตัวเลือก)</option>
                      <option value="TEXT">อัตนัย (เติมคำ)</option>
                    </select>
                  </div>
                </div>

                {q.type === "CHOICE" ? (
                  <div className="space-y-3">
                    <Label className="text-xs text-zinc-400">ตัวเลือก (คลิกที่ปุ่มวงกลมเพื่อเลือกข้อที่ถูก)</Label>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === opt}
                          onChange={() => updateQuestion(qIndex, { correctAnswer: opt })}
                          className="size-4 accent-indigo-500 cursor-pointer shrink-0"
                        />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`ตัวเลือก ${optIndex + 1}`}
                          className="flex-1 bg-zinc-950/50 border-zinc-800 h-9"
                          required
                        />
                        {q.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIndex, optIndex)}
                            className="text-zinc-500 hover:text-red-400 size-8 shrink-0"
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(qIndex)}
                        className="text-xs border-dashed border-zinc-700 text-zinc-400 mt-2"
                      >
                        <Plus className="size-3 mr-1" /> เพิ่มตัวเลือก
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">คำตอบที่ถูกต้อง (ผู้เรียนต้องพิมพ์ให้ตรงตามนี้)</Label>
                    <Input
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                      placeholder="ระบุคำตอบ..."
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        className="w-full border-dashed border-indigo-500/50 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors py-6"
      >
        <Plus className="size-5 mr-2" /> เพิ่มคำถามใหม่
      </Button>
    </div>
  );
}

function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
