"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  getUsersAction, 
  adminUpdateUserRoleAction, 
  adminDeleteUserAction, 
  adminCreateUserAction 
} from "@/app/actions/admin";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, Users, Plus, Loader2, Trash2, Shield, User as UserIcon, GraduationCap 
} from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: "", email: "", password: "", role: "LEARNER" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsersAction();
    if (res.success && res.users) {
      setUsers(res.users);
      setError(null);
    } else {
      setError(res.error || "Failed to load users");
    }
    setLoading(false);
  };

  const handleRoleChange = (userId: string, newRole: "LEARNER" | "TEACHER" | "ADMIN") => {
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
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    
    startTransition(async () => {
      const res = await adminDeleteUserAction(userId);
      if (res.success) {
        fetchUsers();
      } else {
        alert(res.error);
      }
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(res.error);
      }
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><ShieldAlert className="size-3 mr-1" /> ADMIN</Badge>;
      case "TEACHER":
        return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"><GraduationCap className="size-3 mr-1" /> TEACHER</Badge>;
      default:
        return <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700"><UserIcon className="size-3 mr-1" /> LEARNER</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <ShieldAlert className="size-12 mx-auto mb-4 opacity-50" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-3">
            <Shield className="size-8 text-indigo-500" />
            ระบบจัดการผู้ใช้งาน (Admin Panel)
          </h1>
          <p className="text-zinc-400 text-sm mt-1">จัดการผู้ใช้งาน เพิ่มสิทธิ์ หรือลบบัญชีผู้ใช้ในระบบ</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-lg shadow-indigo-900/20">
          <Plus className="size-4 mr-2" />
          เพิ่มผู้ใช้ใหม่
        </Button>
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-4 font-semibold">ผู้ใช้งาน</th>
                <th className="p-4 font-semibold">อีเมล</th>
                <th className="p-4 font-semibold text-center">สถิติ</th>
                <th className="p-4 font-semibold">สิทธิ์ (Role)</th>
                <th className="p-4 font-semibold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-zinc-200">{user.name}</div>
                    <div className="text-[10px] text-zinc-500">Joined: {new Date(user.createdAt).toLocaleDateString("th-TH")}</div>
                  </td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4 text-center">
                    <div className="text-xs text-zinc-400">
                      ห้องเรียน: <span className="font-bold text-zinc-200">{user._count.classroomsCreated}</span> | 
                      คลาส: <span className="font-bold text-zinc-200">{user._count.enrollments}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Select
                      disabled={isPending}
                      value={user.role}
                      onValueChange={(val: any) => handleRoleChange(user.id, val)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs bg-zinc-900 border-zinc-800 cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        <SelectItem value="LEARNER">LEARNER</SelectItem>
                        <SelectItem value="TEACHER">TEACHER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                      title="ลบผู้ใช้"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <Card className="w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-2xl">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/40">
              <CardTitle className="text-lg">สร้างผู้ใช้ใหม่ (Admin)</CardTitle>
              <CardDescription>เพิ่มผู้ใช้งานเข้าระบบได้โดยตรง</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>ชื่อ-นามสกุล</Label>
                  <Input required className="bg-zinc-900 border-zinc-800" value={createData.name} onChange={(e) => setCreateData({...createData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>อีเมล</Label>
                  <Input type="email" required className="bg-zinc-900 border-zinc-800" value={createData.email} onChange={(e) => setCreateData({...createData, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>รหัสผ่าน</Label>
                  <Input type="text" required minLength={6} className="bg-zinc-900 border-zinc-800" value={createData.password} onChange={(e) => setCreateData({...createData, password: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>สิทธิ์การใช้งาน (Role)</Label>
                  <Select value={createData.role} onValueChange={(val) => setCreateData({...createData, role: val as string})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="LEARNER">นักเรียน (LEARNER)</SelectItem>
                      <SelectItem value="TEACHER">ผู้สอน (TEACHER)</SelectItem>
                      <SelectItem value="ADMIN">แอดมิน (ADMIN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">ยกเลิก</Button>
                  <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                    {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    สร้างผู้ใช้
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
