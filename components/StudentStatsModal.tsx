"use client";

import React, { useMemo } from "react";
import { X, TrendingUp, TrendingDown, Minus, BarChart, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { downloadStudentGradebookCsv } from "@/lib/exportCsv";
import { BADGES } from "@/lib/gamification";

interface StudentStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  classroomName: string;
  assignments: {
    id: string;
    title: string;
    questionCount: number;
    createdAt: Date | string;
  }[];
  submissions: {
    assignmentId: string;
    score: number;
    createdAt: Date | string;
  }[];
  badges?: { badgeId: string }[];
}

export function StudentStatsModal({
  isOpen,
  onClose,
  studentName,
  classroomName,
  assignments,
  submissions,
  badges = [],
}: StudentStatsModalProps) {
  // Memoize data calculations
  const { chartData, averagePercent, trend, trendDiff } = useMemo(() => {
    // Sort assignments by creation date
    const sortedAssignments = [...assignments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Map to chart data
    const data = sortedAssignments
      .map((asg) => {
        const sub = submissions.find((s) => s.assignmentId === asg.id);
        if (!sub) return null; // Only include submitted assignments

        const percent = Math.round((sub.score / asg.questionCount) * 100);
        return {
          id: asg.id,
          name: asg.title.length > 15 ? asg.title.substring(0, 15) + "..." : asg.title,
          fullTitle: asg.title,
          percent: percent,
          rawScore: sub.score,
          maxScore: asg.questionCount,
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      fullTitle: string;
      percent: number;
      rawScore: number;
      maxScore: number;
    }[];

    if (data.length === 0) {
      return { chartData: [], averagePercent: 0, trend: "none", trendDiff: 0 };
    }

    const totalPercent = data.reduce((acc, curr) => acc + curr.percent, 0);
    const avg = Math.round(totalPercent / data.length);

    let trendStatus: "up" | "down" | "flat" | "none" = "none";
    let diff = 0;

    if (data.length >= 2) {
      const lastScore = data[data.length - 1].percent;
      // Compare last score with average of previous scores
      const prevScores = data.slice(0, data.length - 1);
      const prevAvg =
        prevScores.reduce((acc, curr) => acc + curr.percent, 0) / prevScores.length;
      
      diff = Math.round(lastScore - prevAvg);
      
      if (diff > 5) {
        trendStatus = "up";
      } else if (diff < -5) {
        trendStatus = "down";
      } else {
        trendStatus = "flat";
      }
    }

    return { chartData: data, averagePercent: avg, trend: trendStatus, trendDiff: diff };
  }, [assignments, submissions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/40 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <BarChart className="size-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                สถิติการเรียน: <span className="text-indigo-400">{studentName}</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                ประเมินพัฒนาการจากแบบฝึกหัดที่ส่งแล้ว
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chartData.length > 0 && (
              <Button
                type="button"
                onClick={() => downloadStudentGradebookCsv(studentName, classroomName, assignments, submissions)}
                variant="outline"
                size="sm"
                className="h-8 border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg gap-1.5 cursor-pointer"
                title="ส่งออกรายงานคะแนนรายบุคคลเป็น CSV/Excel"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">ส่งออกคะแนน (CSV/Excel)</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-zinc-500 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {chartData.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 bg-white/20 dark:bg-zinc-900/20 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 border-dashed">
              <BarChart className="size-10 text-zinc-700 mb-3" />
              <p className="text-sm font-semibold">ยังไม่มีข้อมูลสถิติ</p>
              <p className="text-xs mt-1">นักเรียนยังไม่ได้ส่งแบบฝึกหัดใดๆ ในชั้นเรียนนี้</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    ส่งงานแล้ว
                  </div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {chartData.length} <span className="text-sm font-semibold text-zinc-500">/ {assignments.length}</span>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    คะแนนเฉลี่ยรวม
                  </div>
                  <div className="text-2xl font-black text-indigo-400 flex items-center gap-1">
                    <Award className="size-5" />
                    {averagePercent}%
                  </div>
                </div>

                <div className={cn(
                  "border rounded-xl p-4 flex flex-col justify-center items-center text-center transition-colors",
                  trend === "up" ? "bg-emerald-500/10 border-emerald-500/30" : 
                  trend === "down" ? "bg-red-500/10 border-red-500/30" : 
                  trend === "flat" ? "bg-blue-500/10 border-blue-500/30" :
                  "bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800"
                )}>
                  <div className={cn(
                    "text-[10px] font-bold uppercase tracking-wider mb-1",
                    trend === "up" ? "text-emerald-400" : 
                    trend === "down" ? "text-red-400" : 
                    trend === "flat" ? "text-blue-400" :
                    "text-zinc-500 dark:text-zinc-400"
                  )}>
                    แนวโน้มล่าสุด
                  </div>
                  <div className={cn(
                    "text-lg font-black flex items-center gap-1.5",
                    trend === "up" ? "text-emerald-400" : 
                    trend === "down" ? "text-red-400" : 
                    trend === "flat" ? "text-blue-400" :
                    "text-zinc-700 dark:text-zinc-300"
                  )}>
                    {trend === "up" && <><TrendingUp className="size-5" /> พัฒนาขึ้น ({trendDiff > 0 ? `+${trendDiff}` : trendDiff}%)</>}
                    {trend === "down" && <><TrendingDown className="size-5" /> ผลตก ({trendDiff}%)</>}
                    {trend === "flat" && <><Minus className="size-5" /> คงที่</>}
                    {trend === "none" && <><Minus className="size-5" /> รอดูผล</>}
                  </div>
                </div>
              </div>

              {/* Badges Section */}
              {badges.length > 0 && (
                <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award className="size-4" /> เหรียญเกียรติยศ (Badges)
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badge, idx) => {
                      const badgeConfig = BADGES[badge.badgeId];
                      if (!badgeConfig) return null;
                      
                      return (
                        <div 
                          key={idx} 
                          title={badgeConfig.description}
                          className={cn("px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-sm", badgeConfig.colorClass)}
                        >
                          <span className="text-sm">{badgeConfig.icon}</span>
                          <span>{badgeConfig.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Chart Section */}
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 pt-6">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6 text-center">
                  กราฟแสดงเปอร์เซ็นต์คะแนนแยกตามแบบฝึกหัด
                </h4>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#52525b" 
                        fontSize={10} 
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={10} 
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl rounded-lg p-3 text-xs">
                                <div className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">{data.fullTitle}</div>
                                <div className="flex items-center justify-between gap-4 mt-2">
                                  <span className="text-zinc-500 dark:text-zinc-400">ได้คะแนน:</span>
                                  <span className="font-bold text-indigo-400">{data.rawScore} / {data.maxScore}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 mt-1">
                                  <span className="text-zinc-500 dark:text-zinc-400">คิดเป็น:</span>
                                  <span className="font-bold text-emerald-400">{data.percent}%</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="percent" 
                        stroke="#818cf8" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#818cf8", strokeWidth: 2, stroke: "#18181b" }}
                        activeDot={{ r: 6, fill: "#4f46e5", stroke: "#c7d2fe", strokeWidth: 2 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
