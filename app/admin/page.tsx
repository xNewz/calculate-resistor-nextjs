"use client";

import React, { useEffect, useState } from "react";
import { getAdminDashboardStatsAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  FolderClosed,
  PenTool,
  User as UserIcon,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Clock,
  Settings,
  ScrollText
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import Link from "next/link";

interface DashboardStats {
  users: {
    total: number;
    admin: number;
    teacher: number;
    learner: number;
  };
  classrooms: number;
  enrollments: number;
  assignments: number;
  submissions: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string | Date;
  }>;
  recentClassrooms: Array<{
    id: string;
    name: string;
    createdAt: string | Date;
    teacher: { name: string };
  }>;
}

const COLORS = {
  ADMIN: "#ef4444",    // red-500
  TEACHER: "#6366f1",  // indigo-500
  LEARNER: "#10b981",  // emerald-500
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const res = await getAdminDashboardStatsAction();
    if (res.success && res.stats) {
      setStats(res.stats as unknown as DashboardStats);
      setError(null);
    } else {
      setError(res.error || "ไม่สามารถโหลดข้อมูลสถิติได้");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold tracking-wider">กำลังโหลดภาพรวมระบบ...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <ShieldAlert className="size-12 text-red-500/50" />
        <p className="text-sm text-red-400">{error}</p>
        <Button onClick={fetchStats} variant="outline" size="sm" className="border-zinc-800 hover:bg-zinc-800">ลองใหม่</Button>
      </div>
    );
  }

  const roleData = [
    { name: "ผู้ดูแลระบบ", value: stats.users.admin, color: COLORS.ADMIN },
    { name: "ผู้สอน", value: stats.users.teacher, color: COLORS.TEACHER },
    { name: "นักเรียน", value: stats.users.learner, color: COLORS.LEARNER },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Activity className="size-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">ภาพรวมระบบ (Admin Dashboard)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">สรุปข้อมูลสถิติทั้งหมดภายในแพลตฟอร์ม</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchStats}
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="size-4" />
            </Button>
            <Link href="/admin/logs">
              <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <ScrollText className="size-4 text-blue-400" />
                บันทึกระบบ
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <Settings className="size-4 text-orange-400" />
                ตั้งค่าส่วนกลาง
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <Users className="size-4 text-emerald-400" />
                จัดการผู้ใช้
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/40 border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="size-3.5 text-indigo-400" /> บัญชีทั้งหมด
            </div>
            <div className="text-3xl font-black text-zinc-100">
              {stats.users.total.toLocaleString()}
            </div>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderClosed className="size-3.5 text-emerald-400" /> ห้องเรียนทั้งหมด
            </div>
            <div className="text-3xl font-black text-zinc-100">
              {stats.classrooms.toLocaleString()}
            </div>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-yellow-400" /> งานที่ถูกมอบหมาย
            </div>
            <div className="text-3xl font-black text-zinc-100">
              {stats.assignments.toLocaleString()}
            </div>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-blue-400" /> การส่งงาน
            </div>
            <div className="text-3xl font-black text-zinc-100">
              {stats.submissions.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Charts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Roles Pie Chart */}
          <Card className="bg-zinc-900/40 border-zinc-800/60 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <CardHeader className="border-b border-zinc-800/60 pb-4">
              <CardTitle className="text-sm font-bold text-zinc-200">สัดส่วนผู้ใช้งาน</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                แบ่งตามประเภทบัญชีของระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex-1 min-h-[300px] flex flex-col items-center justify-center">
              {stats.users.total === 0 ? (
                <div className="text-zinc-500 text-xs">ยังไม่มีข้อมูลผู้ใช้</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}
                      itemStyle={{ color: "#f4f4f5" }}
                      formatter={(value: any) => [`${value} บัญชี`, "จำนวน"]}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity: Users & Classrooms */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Newest Users */}
            <Card className="bg-zinc-900/40 border-zinc-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <CardHeader className="border-b border-zinc-800/60 pb-4">
                <CardTitle className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <UserIcon className="size-4 text-emerald-400" /> สมาชิกล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {stats.recentUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">ไม่มีข้อมูล</div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {stats.recentUsers.map((u) => (
                      <div key={u.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === "ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            u.role === "TEACHER" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-zinc-200 text-xs truncate">{u.name}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{u.email}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="flex items-center justify-end gap-1 text-[9px] text-zinc-500 mb-1">
                            <Clock className="size-2.5" />
                            {new Date(u.createdAt).toLocaleDateString("th-TH")}
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            u.role === "ADMIN" ? "bg-red-500/5 text-red-400 border-red-500/20" :
                            u.role === "TEACHER" ? "bg-indigo-500/5 text-indigo-400 border-indigo-500/20" :
                            "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {u.role === "TEACHER" ? "ผู้สอน" : u.role === "ADMIN" ? "แอดมิน" : "ผู้เรียน"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Newest Classrooms */}
            <Card className="bg-zinc-900/40 border-zinc-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <CardHeader className="border-b border-zinc-800/60 pb-4">
                <CardTitle className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <FolderClosed className="size-4 text-indigo-400" /> ห้องเรียนล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {stats.recentClassrooms.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">ไม่มีข้อมูล</div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {stats.recentClassrooms.map((c) => (
                      <div key={c.id} className="p-4 flex flex-col gap-1.5 hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-zinc-200 text-sm truncate">{c.name}</div>
                          <div className="flex items-center gap-1 text-[9px] text-zinc-500 shrink-0">
                            <Clock className="size-2.5" />
                            {new Date(c.createdAt).toLocaleDateString("th-TH")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <GraduationCap className="size-3.5 text-zinc-500" />
                          <span className="truncate">สอนโดย {c.teacher.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
