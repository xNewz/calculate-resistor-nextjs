"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createAssignmentAction,
  updateClassroomAction,
  deleteClassroomAction,
  updateAssignmentAction,
  deleteAssignmentAction
} from "@/app/actions/classroom";
import { COLOR_MAP } from "@/lib/resistor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Plus,
  QrCode,
  Copy,
  Check,
  Calendar,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ChevronRight,
  UserCheck,
  Clock,
  Settings,
  Trash2,
  MoreVertical,
  BarChart,
  Download,
  PieChart,
  Activity,
  AlertTriangle,
  X
} from "lucide-react";
import { StudentStatsModal } from "@/components/StudentStatsModal";
import ResistorPreview from "@/components/ResistorPreview";
import MultimeterPreview from "@/components/MultimeterPreview";
import { CustomQuestionBuilder, CustomQuestion } from "./CustomQuestionBuilder";
import { downloadGradebookCsv } from "@/lib/exportCsv";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface ClassroomDetailProps {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: "LEARNER" | "TEACHER" | "ADMIN";
  };
  classroom: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    teacher: { name: string; image?: string | null };
  };
  assignments: any[];
  enrollments: any[];
  submissions: any[]; // Submissions related to this classroom
}

export default function ClassroomDetail({
  user,
  classroom,
  assignments,
  enrollments,
  submissions,
}: ClassroomDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState(user.role === "TEACHER" || user.role === "ADMIN" ? "dashboard" : "assignments");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);
  const [assignmentType, setAssignmentType] = useState("RESISTOR");
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  // Assignment Edit & Delete states
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editAssignmentType, setEditAssignmentType] = useState("RESISTOR");
  const [editCustomQuestions, setEditCustomQuestions] = useState<CustomQuestion[]>([]);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<any>(null);

  const [showQrModal, setShowQrModal] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatsStudent, setSelectedStatsStudent] = useState<{ id: string; name: string } | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analyzingAssignment, setAnalyzingAssignment] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [editName, setEditName] = useState(classroom.name);
  const [editDescription, setEditDescription] = useState(classroom.description || "");

  // Handle Edit Classroom
  const handleEditClassroom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateClassroomAction(classroom.id, editName, editDescription);
      if (res.success) {
        setShowEditModal(false);
        router.refresh();
      } else {
        setError(res.error || "ไม่สามารถแก้ไขห้องเรียนได้");
      }
    });
  };

  // Handle Delete Classroom
  const handleDeleteClassroom = () => {
    if (deleteConfirmText !== "DELETE") return;
    setError(null);

    startTransition(async () => {
      const res = await deleteClassroomAction(classroom.id, deleteConfirmText);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/classroom");
        router.refresh();
      } else {
        setError(res.error || "ไม่สามารถลบห้องเรียนได้");
      }
    });
  };

  // Set join URL client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinUrl(`${window.location.origin}/classroom?code=${classroom.code}`);
    }
  }, [classroom.code]);

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Handle Assign Quiz
  const handleAssignQuiz = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("classroomId", classroom.id);
    
    if (assignmentType === "CUSTOM") {
      formData.set("customQuestions", JSON.stringify(customQuestions));
      formData.set("questionCount", customQuestions.length.toString());
    }

    startTransition(async () => {
      const res = await createAssignmentAction(null, formData);
      if (res.success) {
        setShowAssignModal(false);
        router.refresh();
      } else {
        setError(res.error || "ไม่สามารถมอบหมายงานได้");
      }
    });
  };

  // Handle Edit Assignment
  const handleEditAssignment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!editingAssignment) return;

    const formData = new FormData(e.currentTarget);
    if (editAssignmentType === "CUSTOM") {
      formData.set("customQuestions", JSON.stringify(editCustomQuestions));
      formData.set("questionCount", editCustomQuestions.length.toString());
    }
    startTransition(async () => {
      const res = await updateAssignmentAction(editingAssignment.id, formData);
      if (res.success) {
        setShowEditAssignmentModal(false);
        setEditingAssignment(null);
        router.refresh();
      } else {
        setError(res.error || "ไม่สามารถแก้ไขแบบฝึกหัดได้");
      }
    });
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = () => {
    if (!deletingAssignment) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAssignmentAction(deletingAssignment.id);
      if (res.success) {
        setShowDeleteAssignmentModal(false);
        setDeletingAssignment(null);
        router.refresh();
      } else {
        setError(res.error || "ไม่สามารถลบแบบฝึกหัดได้");
      }
    });
  };

  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter((s) => s.assignmentId === assignmentId);
  };

  const getStudentSubmission = (assignmentId: string, studentId: string) => {
    return submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
  };

  // --- Dashboard Data Computations (Teacher Only) ---
  const { dashboardData, commonMistakes, overallAvgPercent, overallSubmissionRate } = React.useMemo(() => {
    if (user.role !== "TEACHER" && user.role !== "ADMIN") return { dashboardData: [], commonMistakes: [], overallAvgPercent: 0, overallSubmissionRate: 0 };

    // 1. Chart Data & Overalls
    let totalScore = 0;
    let totalMaxScore = 0;
    let totalPossibleSubmissions = assignments.length * enrollments.length;
    let totalActualSubmissions = 0;

    const chartData = assignments.map(asg => {
      const subs = submissions.filter(s => s.assignmentId === asg.id);
      let avgPercent = 0;
      totalActualSubmissions += subs.length;

      if (subs.length > 0) {
        const asgTotalRaw = subs.reduce((sum, s) => sum + s.score, 0);
        totalScore += asgTotalRaw;
        totalMaxScore += subs.length * asg.questionCount;
        avgPercent = Math.round((asgTotalRaw / (subs.length * asg.questionCount)) * 100);
      }
      return {
        name: asg.title.length > 15 ? asg.title.substring(0, 15) + "..." : asg.title,
        fullTitle: asg.title,
        avgPercent,
        submissions: subs.length,
        totalEnrolled: enrollments.length
      };
    });

    const oAvg = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    const oRate = totalPossibleSubmissions > 0 ? Math.round((totalActualSubmissions / totalPossibleSubmissions) * 100) : 0;

    // 2. Common Mistakes Analysis
    const mistakeCounts: Record<string, { count: number, formatted: string, colors: string[] }> = {};

    submissions.forEach(sub => {
      if (!sub.answers) return;
      try {
        let parsedAnswers = [];
        if (typeof sub.answers === 'string') {
          parsedAnswers = JSON.parse(sub.answers);
        } else if (Array.isArray(sub.answers)) {
          parsedAnswers = sub.answers;
        }

        parsedAnswers.forEach((ans: any) => {
          if (!ans.isCorrect && ans.question && !ans.isTimeout) {
            const key = ans.question.formatted;
            if (!mistakeCounts[key]) {
              mistakeCounts[key] = {
                count: 0,
                formatted: ans.question.formatted,
                colors: ans.question.colors || []
              };
            }
            mistakeCounts[key].count += 1;
          }
        });
      } catch (e) {
        // parsing error
      }
    });

    const sortedMistakes = Object.values(mistakeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return {
      dashboardData: chartData,
      commonMistakes: sortedMistakes,
      overallAvgPercent: oAvg,
      overallSubmissionRate: oRate
    };
  }, [assignments, submissions, enrollments, user.role]);

  const mistakeAnalysis = React.useMemo(() => {
    if (!analyzingAssignment) return [];

    const assignmentSubmissions = submissions.filter(s => s.assignmentId === analyzingAssignment.id);
    
    const mistakeCounts: Record<string, { 
      question: any;
      totalWrong: number;
      wrongAnswers: Record<string, number>; 
    }> = {};

    assignmentSubmissions.forEach(sub => {
      if (!sub.answers) return;
      try {
        let parsedAnswers = [];
        if (typeof sub.answers === 'string') {
          parsedAnswers = JSON.parse(sub.answers);
        } else if (Array.isArray(sub.answers)) {
          parsedAnswers = sub.answers;
        }

        parsedAnswers.forEach((ans: any) => {
          if (!ans.isCorrect && ans.question && !ans.isTimeout) {
            const q = ans.question;
            const qKey = q.colors 
              ? `resistor-${q.bands}-${q.colors.join(',')}` 
              : `multimeter-${q.multimeterData?.range?.name || 'unknown'}-${q.multimeterData?.pointerValue || '0'}`;

            if (!mistakeCounts[qKey]) {
              mistakeCounts[qKey] = {
                question: q,
                totalWrong: 0,
                wrongAnswers: {}
              };
            }

            mistakeCounts[qKey].totalWrong += 1;

            const userAns = ans.userAnswer ? ans.userAnswer.trim() : "ว่าง/ไม่ตอบ";
            mistakeCounts[qKey].wrongAnswers[userAns] = (mistakeCounts[qKey].wrongAnswers[userAns] || 0) + 1;
          }
        });
      } catch (e) {
        console.error("Error parsing submission answers:", e);
      }
    });

    // Convert to sorted array
    return Object.values(mistakeCounts)
      .sort((a, b) => b.totalWrong - a.totalWrong);
  }, [analyzingAssignment, submissions]);

  return (
    <div className="min-h-screen lg:min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link href="/classroom" className="hover:text-zinc-300">ห้องเรียน</Link>
          <ChevronRight className="size-3" />
          <span className="text-zinc-300 truncate max-w-[200px]">{classroom.name}</span>
        </div>

        {/* Classroom Header Banner */}
        <div className="relative bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-zinc-850 backdrop-blur-md">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 size-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight font-heading">
                {classroom.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                {classroom.description || "ไม่มีคำอธิบายห้องเรียน"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-1">
                <span>ผู้สอน: <span className="font-semibold text-zinc-300">{classroom.teacher.name}</span></span>
                <span>•</span>
                <span>รหัสเข้าชั้นเรียน: <span className="font-mono font-bold text-indigo-400">{classroom.code}</span></span>
              </div>
            </div>

            {/* Invite Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                className="h-9 px-3 border-zinc-850 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold rounded-lg gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>คัดลอกรหัส</span>
              </Button>

              <Button
                onClick={() => setShowQrModal(true)}
                variant="outline"
                size="sm"
                className="h-9 px-3 border-zinc-850 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold rounded-lg gap-1.5 cursor-pointer"
              >
                <QrCode className="size-3.5 text-indigo-400" />
                <span>แสดง QR Code</span>
              </Button>

              {(user.role === "TEACHER" || user.role === "ADMIN") && (
                <div className="relative">
                  <Button
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-zinc-850 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <MoreVertical className="size-4 text-zinc-400" />
                  </Button>

                  {showSettingsDropdown && (
                    <>
                      {/* Overlay to handle click outside */}
                      <div className="fixed inset-0 z-10" onClick={() => setShowSettingsDropdown(false)}></div>

                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl z-20 animate-[slideDown_0.15s_ease-out]">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setShowEditModal(true);
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/85 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Settings className="size-3.5 text-zinc-450" />
                          <span>แก้ไขห้องเรียน</span>
                        </button>
                        <div className="h-px bg-zinc-850 my-1"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeleteConfirmText("");
                            setShowDeleteModal(true);
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                          <span>ลบห้องเรียน</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`bg-zinc-950 border border-zinc-850 p-1 rounded-xl h-11 w-full ${user.role === "TEACHER" || user.role === "ADMIN" ? "sm:w-[450px]" : "sm:w-[320px]"}`}>
            {(user.role === "TEACHER" || user.role === "ADMIN") && (
              <TabsTrigger value="dashboard" className="text-xs h-9 rounded-lg flex-1 cursor-pointer gap-1.5">
                <PieChart className="size-3.5" />
                <span>ภาพรวม (Dashboard)</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="assignments" className="text-xs h-9 rounded-lg flex-1 cursor-pointer gap-1.5">
              <BookOpen className="size-3.5" />
              <span>แบบฝึกหัด</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs h-9 rounded-lg flex-1 cursor-pointer gap-1.5">
              <Users className="size-3.5" />
              <span>{user.role === "TEACHER" || user.role === "ADMIN" ? "สมุดคะแนน" : "รายชื่อเพื่อน"}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: DASHBOARD (Teacher Only) */}
          {(user.role === "TEACHER" || user.role === "ADMIN") && (
            <TabsContent value="dashboard" className="space-y-4 outline-none">

              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/60 border-zinc-850 p-4 flex flex-col justify-center rounded-xl shadow-sm">
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Users className="size-3" /> จำนวนผู้เรียน
                  </div>
                  <div className="text-2xl font-black text-zinc-100">
                    {enrollments.length} <span className="text-sm text-zinc-500 font-medium">คน</span>
                  </div>
                </Card>
                <Card className="bg-zinc-900/60 border-zinc-850 p-4 flex flex-col justify-center rounded-xl shadow-sm">
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <BookOpen className="size-3" /> แบบฝึกหัดทั้งหมด
                  </div>
                  <div className="text-2xl font-black text-zinc-100">
                    {assignments.length} <span className="text-sm text-zinc-500 font-medium">ชุด</span>
                  </div>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20 p-4 flex flex-col justify-center rounded-xl shadow-sm">
                  <div className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Activity className="size-3" /> อัตราการส่งงาน
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    {overallSubmissionRate}%
                  </div>
                </Card>
                <Card className="bg-indigo-500/5 border-indigo-500/20 p-4 flex flex-col justify-center rounded-xl shadow-sm">
                  <div className="text-indigo-500/70 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <BarChart className="size-3" /> คะแนนเฉลี่ยรวม
                  </div>
                  <div className="text-2xl font-black text-indigo-400">
                    {overallAvgPercent}%
                  </div>
                </Card>
              </div>

              {/* Main Charts & Analysis Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Bar Chart */}
                <Card className="lg:col-span-2 bg-zinc-900/40 border-zinc-850 rounded-xl overflow-hidden flex flex-col shadow-sm">
                  <CardHeader className="border-b border-zinc-850 pb-4">
                    <CardTitle className="text-sm font-bold text-zinc-200">กราฟคะแนนเฉลี่ยแยกตามแบบฝึกหัด</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      แสดงเป็นเปอร์เซ็นต์คะแนนเฉลี่ยของทั้งชั้นเรียน
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-6 flex-1 min-h-[250px]">
                    {dashboardData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                        ยังไม่มีข้อมูลการมอบหมายงาน
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={dashboardData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(val) => `${val}%`} />
                          <RechartsTooltip
                            cursor={{ fill: '#27272a', opacity: 0.4 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-zinc-950 border border-zinc-800 shadow-xl rounded-lg p-3 text-xs">
                                    <div className="font-bold text-zinc-200 mb-2">{data.fullTitle}</div>
                                    <div className="flex justify-between gap-4 mb-1">
                                      <span className="text-zinc-400">ส่งแล้ว:</span>
                                      <span className="text-zinc-200">{data.submissions} / {data.totalEnrolled} คน</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-zinc-400">คะแนนเฉลี่ย:</span>
                                      <span className="font-bold text-indigo-400">{data.avgPercent}%</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="avgPercent" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1000} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Right: Common Mistakes */}
                <Card className="bg-zinc-900/40 border-zinc-850 rounded-xl overflow-hidden shadow-sm flex flex-col py-0 gap-0">
                  <CardHeader className="border-b border-zinc-850 pt-4 pb-4 bg-red-500/5">
                    <CardTitle className="text-sm font-bold text-red-400 flex items-center gap-2">
                      <AlertTriangle className="size-4" /> ข้อผิดพลาดที่พบบ่อย
                    </CardTitle>
                    <CardDescription className="text-xs text-red-400/70">
                      ค่าตัวต้านทานที่ผู้เรียนมักตอบผิดมากที่สุด
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    {commonMistakes.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                        <CheckCircle2 className="size-8 text-emerald-500/30 mb-2" />
                        <span className="text-xs">ยังไม่พบข้อมูลข้อผิดพลาด<br />หรือนักเรียนยังไม่ได้ทำแบบสอบถาม</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-850 text-xs">
                        {commonMistakes.map((mistake, idx) => (
                          <div key={mistake.formatted} className="p-4 flex items-center justify-between hover:bg-zinc-900/50">
                            <div className="space-y-1.5">
                              <div className="font-bold text-zinc-200 font-mono text-sm">
                                {mistake.formatted}
                              </div>
                              <div className="flex gap-1">
                                {mistake.colors.map((color, cIdx) => {
                                  const hex = COLOR_MAP[color.toLowerCase()]?.hex || "#3f3f46";
                                  const thName = COLOR_MAP[color.toLowerCase()]?.nameTh || color;
                                  return (
                                    <div
                                      key={cIdx}
                                      className="w-3.5 h-3.5 rounded-full border border-zinc-900 shadow-sm"
                                      style={{ backgroundColor: hex }}
                                      title={thName}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-red-400 font-bold">{mistake.count} ครั้ง</div>
                              <div className="text-[9px] text-zinc-500">ที่ตอบผิด</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* TAB 1: ASSIGNMENTS */}
          <TabsContent value="assignments" className="space-y-4 outline-none">

            {/* Header section with Create button for teacher */}
            <div className="flex justify-between items-center pb-2">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                แบบฝึกหัดทั้งหมด ({assignments.length})
              </h2>

              {user.role === "TEACHER" && (
                <Button
                  onClick={() => { setError(null); setShowAssignModal(true); }}
                  className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-lg gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="size-4 text-primary-foreground stroke-[3px]" />
                  <span>มอบหมายงาน</span>
                </Button>
              )}
            </div>

            {assignments.length === 0 ? (
              <Card className="bg-zinc-900/20 border-dashed border-zinc-800 text-center p-12 rounded-xl">
                <BookOpen className="size-10 text-zinc-700 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-zinc-400">ยังไม่มีการมอบหมายแบบฝึกหัด</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto">
                  {user.role === "TEACHER"
                    ? "มอบหมายโจทย์แบบทดสอบชุดแรกให้นักเรียนเพื่อวัดทักษะความต้านทาน"
                    : "ห้องเรียนนี้ยังไม่มีการสั่งแบบฝึกหัดในขณะนี้"}
                </p>
              </Card>
            ) : (
              <div className="space-y-3.5">
                {assignments.map((assignment) => {
                  const subCount = getSubmissionsForAssignment(assignment.id);
                  const mySub = user.role === "LEARNER" ? subCount.find((s) => s.studentId === user.id) : null;
                  const isPastDue = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;

                  return (
                    <Card key={assignment.id} className="bg-zinc-900/50 border-zinc-850 hover:border-zinc-800/80 transition-all rounded-xl overflow-hidden shadow-sm">
                      <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                              {assignment.isExam && <span title="โหมดสอบ"><ShieldAlert className="size-4 text-red-400" /></span>}
                              {assignment.title}
                            </h3>
                            {assignment.isExam && (
                              <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-400 text-[10px] py-0 px-2.5 h-5 rounded-full font-bold">
                                โหมดสอบ
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] py-0 px-2.5 h-5 rounded-full font-semibold">
                              {assignment.assignmentType === "CUSTOM" ? "อิสระ" : assignment.assignmentType === "MULTIMETER" ? "มัลติมิเตอร์" : `${assignment.bandType} แถบสี`}
                            </Badge>
                            <Badge variant="outline" className="border-zinc-700 bg-zinc-800/30 text-zinc-300 text-[10px] py-0 px-2.5 h-5 rounded-full font-semibold">
                              {assignment.questionMode === "CHOICE" ? "4 ตัวเลือก" : "แบบกรอก"}
                            </Badge>
                            <Badge variant="secondary" className="bg-zinc-950 text-zinc-400 text-[10px] py-0 px-2 h-5 rounded-full">
                              โจทย์ {assignment.questionCount} ข้อ
                            </Badge>
                            {assignment.dueDate && (
                              <Badge
                                variant={isPastDue ? (assignment.allowLate ? "outline" : "destructive") : "secondary"}
                                className={`text-[10px] py-0 px-2.5 h-5 rounded-full font-semibold ${isPastDue
                                    ? (assignment.allowLate ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-500" : "bg-red-500/10 text-red-400 border border-red-500/20")
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  }`}
                              >
                                {isPastDue
                                  ? (assignment.allowLate ? "เลยกำหนดส่ง (ส่งเกินเวลาได้)" : "ปิดรับส่งแล้ว")
                                  : "กำลังเปิดรับงาน"}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-zinc-400 line-clamp-2">
                            {assignment.description || "ไม่มีรายละเอียดคำชี้แจงงาน"}
                          </p>

                          <div className="space-y-1">
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                              <Calendar className="size-3" />
                              <span>สั่งเมื่อ: {new Date(assignment.createdAt).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })} น.</span>
                            </div>

                            {assignment.dueDate && (
                              <div className="text-[10px] flex items-center gap-1.5 font-semibold">
                                <Clock className={`size-3 ${isPastDue ? "text-red-400" : "text-zinc-400"}`} />
                                <span className={isPastDue ? "text-red-400" : "text-zinc-300"}>
                                  กำหนดส่ง: {new Date(assignment.dueDate).toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })} น.
                                </span>
                                <span>•</span>
                                <span className="text-[9px] text-zinc-550">
                                  {assignment.allowLate ? "ส่งเกินเวลาได้" : "ห้ามส่งเกินเวลา"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons based on Role */}
                        <div className="shrink-0 flex flex-wrap items-center gap-3 justify-end sm:justify-start border-t sm:border-t-0 border-zinc-850/80 pt-3 sm:pt-0">
                          {user.role === "TEACHER" || user.role === "ADMIN" ? (
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-xs font-semibold block text-zinc-400">
                                  ส่งแล้ว {subCount.length} จาก {enrollments.length} คน
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  เฉลี่ยคะแนน: {subCount.length > 0
                                    ? (subCount.reduce((acc, s) => acc + s.score, 0) / subCount.length).toFixed(1)
                                    : "0"}/{assignment.questionCount}
                                </span>
                              </div>
                              <div className="flex gap-1.5 border-l border-zinc-800 pl-4 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 gap-1.5 text-[10px] font-bold cursor-pointer"
                                  onClick={() => {
                                    setAnalyzingAssignment(assignment);
                                    setShowAnalysisModal(true);
                                  }}
                                  title="วิเคราะห์ข้อที่เด็กทำผิดบ่อย"
                                >
                                  <BarChart className="size-3" />
                                  วิเคราะห์คำตอบผิด
                                </Button>
                                {assignment.isExam && (
                                  <Link href={`/classroom/${classroom.id}/exam/${assignment.id}/monitor`}>
                                    <Button variant="outline" size="sm" className="h-7 px-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 text-[10px] font-bold cursor-pointer">
                                      <Activity className="size-3" />
                                      Live Monitor
                                    </Button>
                                  </Link>
                                )}
                                {user.role === "TEACHER" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                                      onClick={() => {
                                        setEditingAssignment(assignment);
                                        setEditAssignmentType(assignment.assignmentType || "RESISTOR");
                                        if (assignment.assignmentType === "CUSTOM" && assignment.customQuestions) {
                                          setEditCustomQuestions(assignment.customQuestions as CustomQuestion[]);
                                        } else {
                                          setEditCustomQuestions([]);
                                        }
                                        setShowEditAssignmentModal(true);
                                      }}
                                      title="แก้ไข"
                                    >
                                      <Settings className="size-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                      onClick={() => {
                                        setDeletingAssignment(assignment);
                                        setShowDeleteAssignmentModal(true);
                                      }}
                                      title="ลบ"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              {mySub ? (
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end text-emerald-400 text-xs font-bold">
                                      <CheckCircle2 className="size-3.5" />
                                      <span>เสร็จสิ้น</span>
                                    </div>
                                    <span className="text-[11px] text-zinc-400 flex flex-col items-end">
                                      <span>คะแนน: <strong className="text-zinc-200">{mySub.score}</strong>/{assignment.questionCount}</span>
                                      {assignment.dueDate && new Date(mySub.createdAt) > new Date(assignment.dueDate) && (
                                        <span className="text-[8px] text-red-400 font-bold block mt-0.5">ส่งล่าช้า (ส่งเกินเวลา)</span>
                                      )}
                                    </span>
                                  </div>
                                  <Link href={`/classroom/${classroom.id}/assignment/${assignment.id}/submission/${mySub.id}`}>
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-zinc-800 hover:bg-zinc-800 font-semibold cursor-pointer">
                                      ดูเฉลย
                                    </Button>
                                  </Link>
                                </div>
                              ) : isPastDue && !assignment.allowLate ? (
                                <Button disabled className="h-8 bg-zinc-850 text-zinc-650 font-bold text-xs rounded-lg gap-1 px-3 cursor-not-allowed shadow-none border border-transparent">
                                  <Play className="size-3 fill-zinc-650 text-zinc-650" />
                                  <span>ปิดรับส่งแล้ว</span>
                                </Button>
                              ) : (
                                <Link href={`/classroom/${classroom.id}/${assignment.isExam ? 'exam' : 'assignment'}/${assignment.id}`}>
                                  <Button className={`h-8 text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-lg gap-1 px-3 cursor-pointer shadow-sm ${assignment.isExam ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary'}`}>
                                    <Play className="size-3 fill-current" />
                                    <span>{assignment.isExam ? 'เข้าห้องสอบ' : 'ทำแบบทดสอบ'}{isPastDue ? " (ส่งเกินเวลา)" : ""}</span>
                                  </Button>
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: MEMBERS & GRADEBOOK */}
          <TabsContent value="members" className="space-y-4 outline-none">
            {user.role === "TEACHER" ? (
              // Teacher Gradebook View
              <Card className="bg-zinc-900/40 border-zinc-850 rounded-xl overflow-hidden">
                <CardHeader className="border-b border-zinc-850 pb-4 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-zinc-200">
                      สมุดบันทึกผลคะแนน (Gradebook)
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 mt-1">
                      แสดงคะแนนที่ผู้เรียนทั้งหมดส่งคำตอบในแต่ละแบบฝึกหัด
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => downloadGradebookCsv(classroom.name, enrollments, assignments, submissions)}
                    variant="outline"
                    size="sm"
                    className="h-8 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300 font-semibold rounded-lg gap-1.5 cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span className="hidden sm:inline">ส่งออกคะแนนรวม (Excel/CSV)</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {enrollments.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      ยังไม่มีนักเรียนเข้าร่วมห้องเรียนนี้
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-850 bg-zinc-950/60 text-zinc-400 font-semibold">
                          <th className="p-3.5 pl-5">ผู้เรียน</th>
                          {assignments.map((asg) => (
                            <th key={asg.id} className="p-3.5 text-center font-bold">
                              <span className="block max-w-[120px] truncate mx-auto" title={asg.title}>
                                {asg.title}
                              </span>
                              <span className="block text-[9px] text-zinc-500 font-normal">
                                Max: {asg.questionCount}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 text-zinc-300">
                        {enrollments.map((enr) => (
                          <tr key={enr.id} className="hover:bg-zinc-900/10">
                            <td className="p-3.5 pl-5">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-semibold text-zinc-200">{enr.user.name}</div>
                                  <div className="text-[10px] text-zinc-500">{enr.user.email}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 ml-auto cursor-pointer"
                                  title="ดูสถิติการเรียน"
                                  onClick={() => {
                                    setSelectedStatsStudent({ id: enr.userId, name: enr.user.name });
                                    setShowStatsModal(true);
                                  }}
                                >
                                  <BarChart className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                            {assignments.map((asg) => {
                              const sub = getStudentSubmission(asg.id, enr.userId);
                              const isSubLate = sub && asg.dueDate ? new Date(sub.createdAt) > new Date(asg.dueDate) : false;
                              return (
                                <td key={asg.id} className="p-3.5 text-center font-mono font-bold">
                                  {sub ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">
                                        {sub.score}
                                      </Badge>
                                      {isSubLate && (
                                        <span className="text-[8px] text-red-400 font-bold block">ส่งเกินเวลา</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-zinc-650 font-normal">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Student Classroom Members List View
              <div className="space-y-4">
                {/* Teacher section */}
                <Card className="bg-zinc-900/40 border-zinc-850 p-4 rounded-xl">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">อาจารย์ผู้สอน</h3>
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-xs overflow-hidden">
                      {classroom.teacher.image ? <img src={classroom.teacher.image} alt={classroom.teacher.name} className="w-full h-full object-cover" /> : classroom.teacher.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-200">{classroom.teacher.name}</div>
                      <div className="text-[10px] text-zinc-500">ผู้สอน / ครูแอดมิน</div>
                    </div>
                  </div>
                </Card>

                {/* Classmates */}
                <Card className="bg-zinc-900/40 border-zinc-850 p-5 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    เพื่อนร่วมชั้นเรียนทั้งหมด ({enrollments.length})
                  </h3>
                  {enrollments.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xs py-2">
                      ไม่มีเพื่อนร่วมห้องคนอื่นในขณะนี้
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-850/60 max-h-[300px] overflow-y-auto pr-2">
                      {enrollments.map((enr) => (
                        <div key={enr.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs overflow-hidden">
                              {enr.user.image ? <img src={enr.user.image} alt={enr.user.name} className="w-full h-full object-cover" /> : enr.user.name.charAt(0)}
                            </div>
                            <span className="font-medium text-zinc-300">{enr.user.name}</span>
                          </div>
                          {enr.userId === user.id && (
                            <Badge className="bg-zinc-950 text-zinc-400 border border-zinc-800 text-[9px] py-0 px-2 rounded-full">
                              คุณ
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* MODAL: ASSIGN NEW QUIZ */}
        {showAssignModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-indigo-400 flex items-center gap-2">
                  <BookOpen className="size-5" />
                  <span>มอบหมายงานแบบฝึกหัดใหม่</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  ตั้งค่าความยากและปริมาณข้อทดสอบสำหรับสุ่มแถบสีตัวต้านทาน
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleAssignQuiz} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-semibold text-zinc-400 uppercase">หัวข้อแบบฝึกหัด</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="เช่น แบบทดสอบรหัสสีตัวต้านทาน 4 แถบสี ชุดที่ 1"
                      className="bg-zinc-950/60 border-zinc-800 h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-semibold text-zinc-400 uppercase">คำชี้แจง / รายละเอียดเพิ่มเติม</Label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="เช่น ให้นักเรียนคำนวณค่าตัวต้านทานตามรูปภาพ มีเวลาข้อละ 30 วินาที"
                      rows={2}
                      className="w-full p-2.5 text-xs rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-zinc-900/60 transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="assignmentType" className="text-xs font-semibold text-zinc-400 uppercase">ประเภทแบบฝึกหัด</Label>
                      <select
                        id="assignmentType"
                        name="assignmentType"
                        value={assignmentType}
                        onChange={(e) => setAssignmentType(e.target.value)}
                        className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-750/50 cursor-pointer"
                      >
                        <option value="RESISTOR">ตัวต้านทาน</option>
                        <option value="MULTIMETER">มัลติมิเตอร์</option>
                        <option value="CUSTOM">ข้อสอบแบบอิสระ (Custom Exam)</option>
                      </select>
                    </div>

                    {assignmentType === "RESISTOR" ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="bandType" className="text-xs font-semibold text-zinc-400 uppercase">รูปแบบสีตัวต้านทาน</Label>
                        <select
                          id="bandType"
                          name="bandType"
                          className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-750/50 cursor-pointer"
                        >
                          <option value="4">4 แถบสี (4-Band)</option>
                          <option value="5">5 แถบสี (5-Band)</option>
                        </select>
                      </div>
                    ) : (
                      <input type="hidden" name="bandType" value="4" />
                    )}

                    {assignmentType !== "CUSTOM" && (
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label htmlFor="questionCount" className="text-xs font-semibold text-zinc-400 uppercase">จำนวนโจทย์</Label>
                        <select
                          id="questionCount"
                          name="questionCount"
                          className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-750/50 cursor-pointer"
                        >
                          <option value="5">5 ข้อ</option>
                          <option value="10">10 ข้อ</option>
                          <option value="15">15 ข้อ</option>
                          <option value="20">20 ข้อ</option>
                          <option value="30">30 ข้อ</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {assignmentType === "CUSTOM" && (
                    <div className="border border-zinc-800 rounded-xl p-4 bg-black/20">
                      <Label className="text-xs font-semibold text-indigo-400 uppercase flex items-center gap-2">
                        <BookOpen className="size-4" /> สร้างข้อสอบแบบอิสระ
                      </Label>
                      <CustomQuestionBuilder questions={customQuestions} onChange={setCustomQuestions} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="dueDate" className="text-xs font-semibold text-zinc-400 uppercase">กำหนดส่ง (วันและเวลา)</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="datetime-local"
                      className="bg-zinc-950/60 border-zinc-800 h-10 text-xs w-full text-zinc-100 scheme-dark"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="questionMode" className="text-xs font-semibold text-zinc-400 uppercase">รูปแบบคำตอบ (Question Mode)</Label>
                    <select
                      id="questionMode"
                      name="questionMode"
                      className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-750/50 cursor-pointer"
                    >
                      <option value="INPUT">พิมพ์คำตอบเอง (Text Input)</option>
                      <option value="CHOICE">ตัวเลือก 4 ตัวเลือก (Multiple Choice)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <div className="space-y-0.5 pr-2">
                      <Label htmlFor="allowLate" className="text-xs font-bold text-zinc-300 cursor-pointer">อนุญาตให้ส่งช้ากว่ากำหนด (Late Submission)</Label>
                      <span className="text-[9px] text-zinc-550 block">เปิดการใช้งานเพื่อให้ผู้เรียนเข้าทำแบบทดสอบล่าช้ากว่าที่กำหนดส่งได้</span>
                    </div>
                    <label htmlFor="allowLate" className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        id="allowLate"
                        name="allowLate"
                        value="true"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-primary-foreground peer-checked:after:border-primary-foreground"></div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <Label htmlFor="isExam" className="text-xs font-bold text-red-400 cursor-pointer flex items-center gap-1.5">
                          <ShieldAlert className="size-3.5" /> โหมดสอบ (Exam Mode)
                        </Label>
                        <span className="text-[9px] text-zinc-400 block">เปิดการป้องกันการโกง บังคับเต็มจอ และห้ามเปิดแท็บอื่น</span>
                      </div>
                      <label htmlFor="isExam" className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          id="isExam"
                          name="isExam"
                          value="true"
                          checked={isExamMode}
                          onChange={(e) => setIsExamMode(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {isExamMode && (
                      <div className="space-y-4 pt-2 border-t border-red-500/20">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-850">
                          <div className="space-y-0.5 pr-2">
                            <Label htmlFor="allowMobile" className="text-xs font-bold text-zinc-300 cursor-pointer">อนุญาตให้ทำสอบบนมือถือ</Label>
                            <span className="text-[9px] text-zinc-500 block">เปิดเพื่อยินยอมการทำข้อสอบผ่านเบราว์เซอร์ของโทรศัพท์มือถือ</span>
                          </div>
                          <label htmlFor="allowMobile" className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              id="allowMobile"
                              name="allowMobile"
                              value="true"
                              defaultChecked
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-650 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-850">
                          <div className="space-y-0.5 pr-2">
                            <Label htmlFor="showSolutions" className="text-xs font-bold text-zinc-300 cursor-pointer">แสดงเฉลยและคำอธิบายหลังส่งข้อสอบ</Label>
                            <span className="text-[9px] text-zinc-500 block">เปิดเพื่อให้ผู้เรียนสามารถดูข้อที่ตอบผิดและคำอธิบายการคำนวณหลังส่งข้อสอบได้</span>
                          </div>
                          <label htmlFor="showSolutions" className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              id="showSolutions"
                              name="showSolutions"
                              value="true"
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-650 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAssignModal(false)}
                      className="h-9 px-4 text-xs hover:bg-zinc-800"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer rounded-lg shadow-sm animate-pulse hover:animate-none"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          กำลังมอบหมาย...
                        </span>
                      ) : (
                        "สร้างแบบฝึกหัด"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MODAL: QR CODE INVITE */}
        {showQrModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-zinc-800 pb-4 text-center">
                <CardTitle className="text-base font-bold text-indigo-400 flex items-center justify-center gap-2">
                  <QrCode className="size-5" />
                  <span>เชิญเข้าร่วมชั้นเรียน</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  สแกนรหัสคิวอาร์โค้ดนี้เพื่อลงทะเบียนเข้าเรียนโดยอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center justify-center gap-4">

                {/* QR Image Box */}
                <div className="p-3 bg-white rounded-xl border border-zinc-800 shadow-inner">
                  {joinUrl ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}`}
                      alt="QR Code Invite"
                      width={220}
                      height={220}
                      className="aspect-square"
                    />
                  ) : (
                    <div className="size-[220px] flex items-center justify-center text-zinc-800 text-xs">
                      กำลังสร้าง QR Code...
                    </div>
                  )}
                </div>

                <div className="text-center w-full space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">รหัสเชิญห้องเรียน</span>
                  <div className="text-xl font-mono font-bold text-zinc-100 tracking-wider">
                    {classroom.code}
                  </div>
                </div>

                <div className="flex gap-2 w-full pt-2">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1 h-9 text-xs border-zinc-800 hover:bg-zinc-850 gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>คัดลอกลิงก์</span>
                  </Button>
                  <Button
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 h-9 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

        {/* EDIT CLASSROOM MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-zinc-200 flex items-center gap-2">
                  <Settings className="size-5 text-indigo-400" />
                  <span>แก้ไขข้อมูลห้องเรียน</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleEditClassroom} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="editName" className="text-xs font-semibold text-zinc-400 uppercase">ชื่อห้องเรียน</Label>
                    <Input
                      id="editName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="กรอกชื่อห้องเรียน เช่น วิทยาการคำนวณ ม.3/1"
                      className="bg-zinc-950/60 border-zinc-800 h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editDescription" className="text-xs font-semibold text-zinc-400 uppercase">คำอธิบายห้องเรียน</Label>
                    <textarea
                      id="editDescription"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="กรอกคำอธิบาย เช่น รายวิชาคอมพิวเตอร์และรหัสสีตัวต้านทาน"
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-zinc-900/60 transition-all duration-200"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowEditModal(false)}
                      className="h-9 px-4 text-xs hover:bg-zinc-800"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer rounded-lg shadow-sm"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          กำลังบันทึก...
                        </span>
                      ) : (
                        "บันทึกการแก้ไข"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DELETE CLASSROOM MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <Card className="w-full max-w-md bg-zinc-900 border-red-950/30 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-red-950/20 pb-4">
                <CardTitle className="text-base font-bold text-red-400 flex items-center gap-2">
                  <Trash2 className="size-5" />
                  <span>ลบห้องเรียนอย่างถาวร</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-red-400 block">⚠️ คำเตือนการดำเนินการลบ:</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    การลบห้องเรียน <strong>"{classroom.name}"</strong> จะเป็นการทำลายข้อมูลการมอบหมายแบบฝึกหัด รายการนักเรียน และประวัติการบันทึกคะแนนทั้งหมดออกจากระบบอย่างถาวร โดยไม่สามารถกู้คืนข้อมูลกลับมาได้
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deleteConfirm" className="text-xs font-semibold text-zinc-350 block">
                    กรุณาพิมพ์ยืนยันด้วยคำว่า <strong className="text-red-400 font-mono text-sm px-1 bg-red-500/5 rounded border border-red-500/10">DELETE</strong> ด้านล่างเพื่อยืนยัน:
                  </Label>
                  <Input
                    id="deleteConfirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="พิมพ์ DELETE ที่นี่"
                    className="bg-zinc-950/60 border-zinc-800 h-10 text-xs text-center font-mono font-bold tracking-wider focus:border-red-900"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteModal(false)}
                    className="h-9 px-4 text-xs hover:bg-zinc-800"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleDeleteClassroom}
                    disabled={isPending || deleteConfirmText !== "DELETE"}
                    className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer rounded-lg shadow-sm disabled:bg-zinc-850 disabled:text-zinc-650 disabled:cursor-not-allowed border border-red-900/10"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" />
                        กำลังลบ...
                      </span>
                    ) : (
                      "ยืนยันการลบห้องเรียน"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Stats Modal */}
        {selectedStatsStudent && (
          <StudentStatsModal
            isOpen={showStatsModal}
            onClose={() => {
              setShowStatsModal(false);
              setTimeout(() => setSelectedStatsStudent(null), 200);
            }}
            studentName={selectedStatsStudent.name}
            classroomName={classroom.name}
            assignments={assignments}
            submissions={submissions.filter(s => s.studentId === selectedStatsStudent.id)}
          />
        )}

        {/* EDIT ASSIGNMENT MODAL */}
        {showEditAssignmentModal && editingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-indigo-400 flex items-center gap-2">
                  <Settings className="size-5" />
                  <span>แก้ไขแบบฝึกหัด</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleEditAssignment} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title" className="text-xs font-semibold text-zinc-400 uppercase">หัวข้อแบบฝึกหัด</Label>
                    <Input
                      id="edit-title"
                      name="title"
                      defaultValue={editingAssignment.title}
                      className="bg-zinc-950/60 border-zinc-800 h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description" className="text-xs font-semibold text-zinc-400 uppercase">คำชี้แจง / รายละเอียด</Label>
                    <textarea
                      id="edit-description"
                      name="description"
                      defaultValue={editingAssignment.description || ""}
                      rows={2}
                      className="w-full p-2.5 text-xs rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-750/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-assignmentType" className="text-xs font-semibold text-zinc-400 uppercase">ประเภทแบบฝึกหัด</Label>
                      <select
                        id="edit-assignmentType"
                        name="assignmentType"
                        value={editAssignmentType}
                        onChange={(e) => setEditAssignmentType(e.target.value)}
                        className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg"
                      >
                        <option value="RESISTOR">ตัวต้านทาน</option>
                        <option value="MULTIMETER">มัลติมิเตอร์</option>
                        <option value="CUSTOM">ข้อสอบแบบอิสระ (Custom Exam)</option>
                      </select>
                    </div>

                    {editAssignmentType === "RESISTOR" ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-bandType" className="text-xs font-semibold text-zinc-400 uppercase">รูปแบบสี</Label>
                        <select
                          id="edit-bandType"
                          name="bandType"
                          defaultValue={editingAssignment.bandType}
                          className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg"
                        >
                          <option value="4">4 แถบสี (4-Band)</option>
                          <option value="5">5 แถบสี (5-Band)</option>
                        </select>
                      </div>
                    ) : (
                      <input type="hidden" name="bandType" value={editingAssignment.bandType || "4"} />
                    )}

                    {editAssignmentType !== "CUSTOM" && (
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label htmlFor="edit-questionCount" className="text-xs font-semibold text-zinc-400 uppercase">จำนวนโจทย์</Label>
                        <select
                          id="edit-questionCount"
                          name="questionCount"
                          defaultValue={editingAssignment.questionCount}
                          className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg"
                        >
                          <option value="5">5 ข้อ</option>
                          <option value="10">10 ข้อ</option>
                          <option value="15">15 ข้อ</option>
                          <option value="20">20 ข้อ</option>
                          <option value="30">30 ข้อ</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {editAssignmentType === "CUSTOM" && (
                    <div className="border border-zinc-800 rounded-xl p-4 bg-black/20">
                      <Label className="text-xs font-semibold text-indigo-400 uppercase flex items-center gap-2">
                        <BookOpen className="size-4" /> แก้ไขข้อสอบแบบอิสระ
                      </Label>
                      <CustomQuestionBuilder questions={editCustomQuestions} onChange={setEditCustomQuestions} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-dueDate" className="text-xs font-semibold text-zinc-400 uppercase">กำหนดส่ง</Label>
                    <Input
                      id="edit-dueDate"
                      name="dueDate"
                      type="datetime-local"
                      defaultValue={editingAssignment.dueDate ? new Date(new Date(editingAssignment.dueDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                      className="bg-zinc-950/60 border-zinc-800 h-10 text-xs w-full text-zinc-100 scheme-dark"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-questionMode" className="text-xs font-semibold text-zinc-400 uppercase">รูปแบบคำตอบ (Question Mode)</Label>
                    <select
                      id="edit-questionMode"
                      name="questionMode"
                      defaultValue={editingAssignment.questionMode || "INPUT"}
                      className="w-full h-10 px-2 bg-zinc-950/60 border border-zinc-800 text-zinc-100 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-750/50 cursor-pointer"
                    >
                      <option value="INPUT">พิมพ์คำตอบเอง (Text Input)</option>
                      <option value="CHOICE">ตัวเลือก 4 ตัวเลือก (Multiple Choice)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <div className="space-y-0.5 pr-2">
                      <Label htmlFor="edit-allowLate" className="text-xs font-bold text-zinc-300">อนุญาตให้ส่งช้าได้</Label>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="edit-allowLate"
                        name="allowLate"
                        value="true"
                        defaultChecked={editingAssignment.allowLate}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  {editingAssignment.isExam && (
                    <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-500/20">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-850">
                        <div className="space-y-0.5 pr-2">
                          <Label htmlFor="edit-allowMobile" className="text-xs font-bold text-zinc-300 cursor-pointer">อนุญาตให้ทำสอบบนมือถือ</Label>
                          <span className="text-[9px] text-zinc-550 block">เปิดเพื่อยินยอมการทำข้อสอบผ่านเบราว์เซอร์ของโทรศัพท์มือถือ</span>
                        </div>
                        <label htmlFor="edit-allowMobile" className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            id="edit-allowMobile"
                            name="allowMobile"
                            value="true"
                            defaultChecked={editingAssignment.allowMobile ?? true}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-650 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="ghost" onClick={() => setShowEditAssignmentModal(false)} className="h-9 px-4 text-xs">
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={isPending} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg">
                      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "บันทึกข้อมูล"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DELETE ASSIGNMENT MODAL */}
        {showDeleteAssignmentModal && deletingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <Card className="w-full max-w-sm bg-zinc-900 border border-red-900/50 shadow-2xl rounded-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto size-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
                  <ShieldAlert className="size-6 text-red-500" />
                </div>
                <CardTitle className="text-lg font-bold text-zinc-100">ยืนยันการลบแบบฝึกหัด?</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  คุณกำลังจะลบ <strong>{deletingAssignment.title}</strong><br />
                  คะแนนและการส่งงานทั้งหมดที่เกี่ยวข้องจะถูกลบทิ้งอย่างถาวร
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {error && <div className="text-red-400 text-xs mb-4 text-center">{error}</div>}
                <div className="flex gap-2 justify-center">
                  <Button type="button" variant="ghost" onClick={() => setShowDeleteAssignmentModal(false)} className="h-9 text-xs">ยกเลิก</Button>
                  <Button onClick={handleDeleteAssignment} disabled={isPending} className="h-9 bg-red-600 hover:bg-red-700 text-white text-xs">
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "ลบทิ้งถาวร"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ASSIGNMENT MISTAKE ANALYTICS MODAL */}
        {showAnalysisModal && analyzingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <BarChart className="size-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">
                      วิเคราะห์คำตอบผิดพลาด: <span className="text-indigo-400">{analyzingAssignment.title}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      เจาะลึกข้อผิดพลาดยอดฮิตเพื่ออธิบายเนื้อหาหน้าชั้นเรียน
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAnalysisModal(false);
                    setAnalyzingAssignment(null);
                  }}
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-zinc-450 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {mistakeAnalysis.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800/50 border-dashed">
                    <CheckCircle2 className="size-10 text-emerald-500/40 mb-3" />
                    <p className="text-sm font-semibold text-emerald-400">ยังไม่พบข้อผิดพลาดในบทเรียนนี้</p>
                    <p className="text-xs mt-1 text-zinc-550">นักเรียนทุกคนตอบคำถามได้ถูกต้องทั้งหมด หรือยังไม่มีใครเริ่มทำการส่งงาน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-xs text-zinc-450">
                      พบปัญหาทั้งหมด <span className="text-red-400 font-bold">{mistakeAnalysis.length} ข้อ</span> ที่มีนักเรียนตอบผิด (เรียงตามลำดับความถี่ในการตอบผิด)
                    </div>

                    <div className="space-y-4">
                      {mistakeAnalysis.map((item, idx) => {
                        const q = item.question;
                        const sortedWrong = Object.entries(item.wrongAnswers)
                          .sort((a, b) => b[1] - a[1]);

                        return (
                          <div key={idx} className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-850 space-y-4 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                ข้อวิเคราะห์อันดับที่ {idx + 1}
                              </span>
                              <Badge variant="destructive" className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 h-5 text-[10px] font-bold">
                                ตอบผิด {item.totalWrong} คน
                              </Badge>
                            </div>

                            {/* Visual Preview */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/80">
                              <div className="w-full sm:w-1/2 flex items-center justify-center bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-850">
                                {q.colors ? (
                                  <ResistorPreview colors={q.colors} />
                                ) : q.multimeterData ? (
                                  <div className="w-full scale-90 origin-center py-2">
                                    <MultimeterPreview
                                      range={q.multimeterData.range}
                                      pointerValue={q.multimeterData.pointerValue}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-550">ไม่มีรูปภาพแสดงผล</span>
                                )}
                              </div>

                              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                                <div className="text-zinc-400">
                                  คำเฉลยที่ถูกต้อง:
                                  <span className="ml-2 font-mono font-bold text-sm text-emerald-400">
                                    {q.formatted}
                                  </span>
                                </div>

                                {q.colors && (
                                  <div className="text-[10px] text-zinc-500 leading-relaxed">
                                    <strong>แถบสี:</strong> {q.colors.map((c: string) => COLOR_MAP[c.toLowerCase()]?.nameTh || c).join(" - ")}
                                  </div>
                                )}
                                {q.multimeterData && (
                                  <div className="text-[10px] text-zinc-500 leading-relaxed">
                                    <strong>ย่านวัด:</strong> {q.multimeterData.range.name} | <strong>ค่าที่ตั้งไว้:</strong> {q.multimeterData.pointerValue} V/Ω/mA
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Common Incorrect Answers breakdown */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                                คำตอบยอดนิยมที่นักเรียนสับสน (Incorrect Answers Frequency)
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {sortedWrong.map(([wrongAns, count]) => (
                                  <div key={wrongAns} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-850/50 hover:border-zinc-800 transition-colors">
                                    <span className="font-mono text-red-350 font-bold">{wrongAns}</span>
                                    <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                      ตอบผิด {count} คน
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 flex justify-end shrink-0">
                <Button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    setAnalyzingAssignment(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold"
                >
                  ปิดหน้าต่างนี้
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
