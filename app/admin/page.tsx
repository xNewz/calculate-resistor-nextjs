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
  ScrollText,
  AlertTriangle,
  XCircle,
  Wifi,
  Ban,
  Megaphone
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    image?: string;
    role: string;
    createdAt: string | Date;
  }>;
  recentClassrooms: Array<{
    id: string;
    name: string;
    createdAt: string | Date;
    teacher: { name: string };
  }>;
  activeUsersToday: number;
  bannedIPs: number;
  recentViolations: Array<{
    id: string;
    type: string;
    details: string | null;
    createdAt: string | Date;
    student: { name: string; image: string | null; email: string };
    assignment: { title: string };
  }>;
  recentErrors: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string | Date;
  }>;
  systemSettings: {
    maintenanceMode: boolean;
    announcementEnabled: boolean;
    announcementText: string | null;
    announcementType: string;
  } | null;
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
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // Default 1 min

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (refreshInterval === 0) return;
    
    const interval = setInterval(() => {
      fetchStats(true);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getAdminDashboardStatsAction();
    if (res.success && res.stats) {
      setStats(res.stats as unknown as DashboardStats);
      setError(null);
    } else {
      if (!silent) setError(res.error || "ไม่สามารถโหลดข้อมูลสถิติได้");
    }
    if (!silent) setLoading(false);
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
        <Button onClick={() => fetchStats(false)} variant="outline" size="sm" className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">ลองใหม่</Button>
      </div>
    );
  }

  const roleData = [
    { name: "ผู้ดูแลระบบ", value: stats.users.admin, color: COLORS.ADMIN },
    { name: "ผู้สอน", value: stats.users.teacher, color: COLORS.TEACHER },
    { name: "นักเรียน", value: stats.users.learner, color: COLORS.LEARNER },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Activity className="size-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">ภาพรวมระบบ (Admin Dashboard)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">สรุปข้อมูลสถิติทั้งหมดภายในแพลตฟอร์ม</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 h-9">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Refresh:</span>
              <Select value={refreshInterval.toString()} onValueChange={(val) => setRefreshInterval(Number(val))}>
                <SelectTrigger className="h-6 w-24 border-none bg-transparent shadow-none text-xs text-zinc-800 dark:text-zinc-200 focus:ring-0 p-0 pr-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs">
                  <SelectItem value="0">ปิด (Off)</SelectItem>
                  <SelectItem value="5">ทุก 5 วินาที</SelectItem>
                  <SelectItem value="15">ทุก 15 วินาที</SelectItem>
                  <SelectItem value="30">ทุก 30 วินาที</SelectItem>
                  <SelectItem value="60">ทุก 1 นาที</SelectItem>
                  <SelectItem value="300">ทุก 5 นาที</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => fetchStats(false)}
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer h-9 w-9"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="size-4" />
            </Button>
            <Link href="/admin/logs">
              <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <ScrollText className="size-4 text-blue-400" />
                บันทึกระบบ
              </Button>
            </Link>
            <Link href="/admin/security">
              <Button variant="outline" className="border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <ShieldAlert className="size-4 text-red-400" />
                ความปลอดภัย (IP)
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <Settings className="size-4 text-orange-400" />
                ตั้งค่าระบบ
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer gap-2 transition-colors">
                <Users className="size-4 text-emerald-400" />
                จัดการผู้ใช้
              </Button>
            </Link>
          </div>
        </div>

        {/* System Status Banners */}
        {(stats.systemSettings?.maintenanceMode || (stats.systemSettings?.announcementEnabled && stats.systemSettings.announcementText)) && (
          <div className="flex flex-col gap-3">
            {stats.systemSettings.maintenanceMode && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="size-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-bold text-sm">โหมดซ่อมบำรุงเปิดใช้งานอยู่ (Maintenance Mode)</h3>
                    <p className="text-red-500/80 text-xs">ผู้ใช้งานทั่วไปจะไม่สามารถเข้าสู่ระบบหรือทำข้อสอบได้ในขณะนี้</p>
                  </div>
                </div>
                <Link href="/admin/settings">
                  <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/20">ไปหน้าตั้งค่า</Button>
                </Link>
              </div>
            )}
            
            {stats.systemSettings.announcementEnabled && stats.systemSettings.announcementText && (
              <div className={`bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-blue-500/20 rounded-lg`}>
                    <Megaphone className="size-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-blue-400 font-bold text-sm">ประกาศระบบกำลังทำงาน (Announcement)</h3>
                    <p className="text-blue-500/80 text-xs line-clamp-1">{stats.systemSettings.announcementText}</p>
                  </div>
                </div>
                <Link href="/admin/settings">
                  <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20">จัดการประกาศ</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5"><Users className="size-3.5 text-indigo-400" /> บัญชีทั้งหมด</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1">
                <Wifi className="size-2.5" /> Active วันนี้: {stats.activeUsersToday.toLocaleString()}
              </span>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.users.total.toLocaleString()}
            </div>
          </Card>

          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderClosed className="size-3.5 text-emerald-400" /> ห้องเรียนทั้งหมด
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.classrooms.toLocaleString()}
            </div>
          </Card>

          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-yellow-400" /> งานที่ถูกมอบหมาย
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.assignments.toLocaleString()}
            </div>
          </Card>

          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 p-4 flex flex-col justify-center rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-blue-400" /> การส่งงาน
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {stats.submissions.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Charts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* User Roles Pie Chart */}
          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <CardHeader className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4">
              <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200">สัดส่วนผู้ใช้งาน</CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
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
            <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <CardHeader className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4">
                <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <UserIcon className="size-4 text-emerald-400" /> สมาชิกล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {stats.recentUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">ไม่มีข้อมูล</div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {stats.recentUsers.map((u) => (
                      <div key={u.id} className="p-4 flex items-center justify-between hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${u.role === "ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              u.role === "TEACHER" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                            {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate">{u.name}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{u.email}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="flex items-center justify-end gap-1 text-[9px] text-zinc-500 mb-1">
                            <Clock className="size-2.5" />
                            {new Date(u.createdAt).toLocaleDateString("th-TH")}
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${u.role === "ADMIN" ? "bg-red-500/5 text-red-400 border-red-500/20" :
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
            <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <CardHeader className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4">
                <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <FolderClosed className="size-4 text-indigo-400" /> ห้องเรียนล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {stats.recentClassrooms.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">ไม่มีข้อมูล</div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {stats.recentClassrooms.map((c) => (
                      <div key={c.id} className="p-4 flex flex-col gap-1.5 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm truncate">{c.name}</div>
                          <div className="flex items-center gap-1 text-[9px] text-zinc-500 shrink-0">
                            <Clock className="size-2.5" />
                            {new Date(c.createdAt).toLocaleDateString("th-TH")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
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

        {/* Security & System Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security & Anti-Cheat */}
          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <CardHeader className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-400" /> การทุจริต & ความปลอดภัย
                </CardTitle>
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 font-bold">
                  <Ban className="size-2.5" /> Banned IPs: {stats.bannedIPs.toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {stats.recentViolations.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">ไม่มีประวัติการทุจริตข้อสอบล่าสุด</div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {stats.recentViolations.map((v) => (
                    <div key={v.id} className="p-4 flex flex-col gap-2 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                            {v.student.image ? <img src={v.student.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{v.student.name.charAt(0)}</div>}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{v.student.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">{v.assignment.title}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                          {v.type}
                        </span>
                      </div>
                      {v.details && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">"{v.details}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Errors Snapshot */}
          <Card className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <CardHeader className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4">
              <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <XCircle className="size-4 text-orange-400" /> ข้อผิดพลาดระบบล่าสุด (Errors)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {stats.recentErrors.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">ไม่พบข้อผิดพลาดระบบในขณะนี้ 🎉</div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {stats.recentErrors.map((e) => (
                    <div key={e.id} className="p-4 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 whitespace-nowrap">
                          {e.action}
                        </span>
                        <span className="text-[9px] text-zinc-500 shrink-0">
                          {new Date(e.createdAt).toLocaleString("th-TH")}
                        </span>
                      </div>
                      <p className="text-[10px] text-red-400 mt-1 line-clamp-2">{e.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
