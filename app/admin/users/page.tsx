"use client";

import React, { useEffect, useState, useTransition } from "react";
import { 
  getUsersAction, 
  adminUpdateUserRoleAction, 
  adminDeleteUserAction, 
  adminCreateUserAction 
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, Plus, Loader2, Trash2, Search, Users, GraduationCap, User as UserIcon, RefreshCw, X
} from "lucide-react";

type UserRole = "LEARNER" | "TEACHER" | "ADMIN";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  createdAt: string | Date;
  lastActive?: string | Date;
  _count: { classroomsCreated: number; enrollments: number };
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; badgeClass: string; icon: React.ReactNode }> = {
  ADMIN: {
    label: "ผู้ดูแลระบบ",
    color: "red",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/25",
    icon: <ShieldAlert className="size-3" />,
  },
  TEACHER: {
    label: "ผู้สอน",
    color: "indigo",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    icon: <GraduationCap className="size-3" />,
  },
  LEARNER: {
    label: "นักเรียน",
    color: "emerald",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    icon: <UserIcon className="size-3" />,
  },
};

function getOnlineStatus(lastActive: string | Date | undefined) {
  if (!lastActive) return { isOnline: false, text: "ออฟไลน์" };
  const last = new Date(lastActive).getTime();
  const now = new Date().getTime();
  const diffMins = Math.floor((now - last) / (1000 * 60));
  
  if (diffMins < 5) return { isOnline: true, text: "ออนไลน์" };
  if (diffMins < 60) return { isOnline: false, text: `ใช้งาน ${diffMins} นาทีที่แล้ว` };
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { isOnline: false, text: `ใช้งาน ${diffHours} ชม.ที่แล้ว` };
  
  const diffDays = Math.floor(diffHours / 24);
  return { isOnline: false, text: `ใช้งาน ${diffDays} วันที่แล้ว` };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: "", email: "", password: "", role: "LEARNER" });
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsersAction();
    if (res.success && res.users) {
      setUsers(res.users as unknown as UserRecord[]);
      setError(null);
    } else {
      setError(res.error || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    }
    setLoading(false);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      const res = await adminUpdateUserRoleAction(userId, newRole);
      if (res.success) {
        fetchUsers();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    startTransition(async () => {
      const res = await adminDeleteUserAction(userId);
      if (res.success) {
        setDeleteConfirmId(null);
        fetchUsers();
      } else {
        alert(res.error);
      }
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", createData.name);
      formData.append("email", createData.email);
      formData.append("password", createData.password);
      formData.append("role", createData.role);
      const res = await adminCreateUserAction(formData);
      if (res.success) {
        setShowCreateModal(false);
        setCreateData({ name: "", email: "", password: "", role: "LEARNER" });
        fetchUsers();
      } else {
        setCreateError(res.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    all: users.length,
    admin: users.filter((u) => u.role === "ADMIN").length,
    teacher: users.filter((u) => u.role === "TEACHER").length,
    learner: users.filter((u) => u.role === "LEARNER").length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <ShieldAlert className="size-12 text-red-500/50" />
        <p className="text-sm text-red-400">{error}</p>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="border-zinc-800">ลองใหม่</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="size-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">ผู้ดูแลระบบ</h1>
                <p className="text-xs text-zinc-500 mt-0.5">จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchUsers}
              disabled={isPending}
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              title="รีเฟรช"
            >
              <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={() => { setCreateError(null); setShowCreateModal(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 h-9 rounded-lg cursor-pointer shadow-lg shadow-indigo-900/30 gap-2"
            >
              <Plus className="size-4" />
              เพิ่มผู้ใช้ใหม่
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "ผู้ใช้ทั้งหมด", count: counts.all, icon: <Users className="size-4" />, color: "text-zinc-400", bg: "bg-zinc-900/60 border-zinc-800" },
            { label: "ผู้ดูแลระบบ", count: counts.admin, icon: <ShieldAlert className="size-4" />, color: "text-red-400", bg: "bg-red-500/5 border-red-500/20" },
            { label: "ผู้สอน", count: counts.teacher, icon: <GraduationCap className="size-4" />, color: "text-indigo-400", bg: "bg-indigo-500/5 border-indigo-500/20" },
            { label: "นักเรียน", count: counts.learner, icon: <UserIcon className="size-4" />, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20" },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} border rounded-xl p-4 flex items-center gap-3`}>
              <div className={`${card.color}`}>{card.icon}</div>
              <div>
                <div className="text-xl font-black text-zinc-100">{card.count}</div>
                <div className="text-[10px] text-zinc-500 font-semibold">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <Input
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm focus:border-indigo-500/50"
            />
          </div>
          <div className="flex gap-1.5">
            {["ALL", "ADMIN", "TEACHER", "LEARNER"].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  filterRole === role
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 bg-zinc-900/40"
                }`}
              >
                {role === "ALL" ? "ทั้งหมด" : role === "ADMIN" ? "แอดมิน" : role === "TEACHER" ? "ผู้สอน" : "นักเรียน"}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-zinc-500">
              <Users className="size-10 text-zinc-700" />
              <p className="text-sm">ไม่พบผู้ใช้งาน</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">ผู้ใช้งาน</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">สถิติ</th>
                  <th className="px-5 py-3.5">สิทธิ์</th>
                  <th className="px-5 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map((user) => {
                  const cfg = ROLE_CONFIG[user.role];
                  return (
                    <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 overflow-hidden ${cfg.badgeClass} border`}>
                            {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-200 text-sm">{user.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-zinc-500">{user.email}</span>
                              <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-zinc-900/50 border border-zinc-800">
                                <span className={`size-1.5 rounded-full ${getOnlineStatus(user.lastActive).isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}></span>
                                <span className="text-[9px] text-zinc-400">{getOnlineStatus(user.lastActive).text}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="flex gap-3 text-xs text-zinc-500">
                          <span>ห้องเรียน: <span className="font-bold text-zinc-300">{user._count.classroomsCreated}</span></span>
                          <span>คลาส: <span className="font-bold text-zinc-300">{user._count.enrollments}</span></span>
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          {new Date(user.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Select
                          disabled={isPending}
                          value={user.role}
                          onValueChange={(val) => handleRoleChange(user.id, val as UserRole)}
                        >
                          <SelectTrigger className="w-[145px] h-8 text-xs bg-zinc-900/80 border-zinc-700 cursor-pointer focus:ring-indigo-500/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                            <SelectItem value="LEARNER">
                              <div className="flex items-center gap-2">
                                <UserIcon className="size-3 text-emerald-400" />
                                <span>นักเรียน</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="TEACHER">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="size-3 text-indigo-400" />
                                <span>ผู้สอน</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="ADMIN">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="size-3 text-red-400" />
                                <span>ผู้ดูแลระบบ</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {deleteConfirmId === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] text-red-400 font-semibold">ยืนยันลบ?</span>
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleDeleteUser(user.id)}
                              className="h-7 px-3 text-[11px] bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                            >
                              {isPending ? <Loader2 className="size-3 animate-spin" /> : "ลบ"}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => setDeleteConfirmId(user.id)}
                            className="size-8 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="ลบผู้ใช้"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-600">แสดง {filteredUsers.length} / {users.length} ผู้ใช้งาน</p>

      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <Plus className="size-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">เพิ่มผู้ใช้ใหม่</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">กรอกข้อมูลสำหรับสร้างบัญชีใหม่</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="size-8 text-zinc-500 hover:text-zinc-200 cursor-pointer">
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ชื่อ-นามสกุล</Label>
                <Input
                  required
                  className="bg-zinc-900/60 border-zinc-800 h-10 text-sm"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">อีเมล</Label>
                <Input
                  type="email"
                  required
                  className="bg-zinc-900/60 border-zinc-800 h-10 text-sm"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">รหัสผ่าน</Label>
                <Input
                  type="text"
                  required
                  minLength={6}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="bg-zinc-900/60 border-zinc-800 h-10 text-sm placeholder:text-zinc-600"
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ประเภทบัญชี</Label>
                <Select value={createData.role} onValueChange={(val) => setCreateData({ ...createData, role: val as string })}>
                  <SelectTrigger className="bg-zinc-900/60 border-zinc-800 h-10 text-sm cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="LEARNER">
                      <div className="flex items-center gap-2 py-0.5">
                        <UserIcon className="size-3.5 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-xs">นักเรียน</div>
                          <div className="text-[10px] text-zinc-500">เข้าร่วมห้องเรียนและทำแบบฝึกหัด</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="TEACHER">
                      <div className="flex items-center gap-2 py-0.5">
                        <GraduationCap className="size-3.5 text-indigo-400" />
                        <div>
                          <div className="font-semibold text-xs">ผู้สอน</div>
                          <div className="text-[10px] text-zinc-500">สร้างห้องเรียนและมอบหมายงาน</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2 py-0.5">
                        <ShieldAlert className="size-3.5 text-red-400" />
                        <div>
                          <div className="font-semibold text-xs">ผู้ดูแลระบบ</div>
                          <div className="text-[10px] text-zinc-500">จัดการผู้ใช้และภาพรวมระบบ</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-zinc-200 cursor-pointer text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer text-xs px-5 gap-2"
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  สร้างบัญชี
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
