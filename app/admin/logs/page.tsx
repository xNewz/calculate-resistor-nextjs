"use client";

import React, { useEffect, useState } from "react";
import { getSystemLogsAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ScrollText, 
  Loader2, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  AlertTriangle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LogRecord {
  id: string;
  action: string;
  status: string;
  details: string;
  createdAt: string | Date;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await getSystemLogsAction();
    if (res.success && res.logs) {
      setLogs(res.logs as unknown as LogRecord[]);
      setError(null);
    } else {
      setError(res.error || "ไม่สามารถโหลดข้อมูลบันทึกระบบได้");
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log.details.toLowerCase().includes(search.toLowerCase()) || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.user && log.user.name.toLowerCase().includes(search.toLowerCase()));
    
    const matchStatus = filterStatus === "ALL" || log.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold tracking-wider">กำลังโหลดบันทึกระบบ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <ShieldAlert className="size-12 text-red-500/50" />
        <p className="text-sm text-red-400">{error}</p>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="border-zinc-800 hover:bg-zinc-800">ลองใหม่</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 -ml-2 h-8 gap-1">
              <ChevronLeft className="size-4" />
              กลับหน้าแผงควบคุม
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <ScrollText className="size-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">บันทึกระบบ (System Logs)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">ตรวจสอบกิจกรรมต่างๆ และข้อผิดพลาดที่เกิดขึ้นในระบบ</p>
              </div>
            </div>
            
            <Button
              onClick={fetchLogs}
              variant="outline"
              size="sm"
              className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2 h-9"
            >
              <RefreshCw className="size-3.5" />
              รีเฟรชข้อมูลล่าสุด
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <Input
              placeholder="ค้นหาจากการกระทำ, รายละเอียด หรือชื่อผู้ใช้..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900/60 border-zinc-800 text-zinc-100 h-10 text-sm focus:border-indigo-500/50"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "ALL")}>
              <SelectTrigger className="bg-zinc-900/60 border-zinc-800 h-10 text-sm">
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                <SelectItem value="SUCCESS">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="size-4" /> สำเร็จ (Success)
                  </div>
                </SelectItem>
                <SelectItem value="WARNING">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="size-4" /> แจ้งเตือน (Warning)
                  </div>
                </SelectItem>
                <SelectItem value="ERROR">
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="size-4" /> ข้อผิดพลาด (Error)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {filteredLogs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
              <ScrollText className="size-10 text-zinc-800" />
              <p className="text-zinc-500 text-sm">ไม่พบข้อมูลบันทึกระบบที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-[140px]">วัน-เวลา</th>
                    <th className="px-5 py-3.5 w-[160px]">ประเภทกิจกรรม</th>
                    <th className="px-5 py-3.5 w-[120px]">สถานะ</th>
                    <th className="px-5 py-3.5">รายละเอียด</th>
                    <th className="px-5 py-3.5 w-[180px]">ผู้ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-5 py-4 text-xs text-zinc-400 font-mono">
                        {new Date(log.createdAt).toLocaleString("th-TH", {
                          year: "2-digit", month: "2-digit", day: "2-digit", 
                          hour: "2-digit", minute: "2-digit", second: "2-digit"
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="size-3" /> SUCCESS
                          </span>
                        ) : log.status === "WARNING" ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            <AlertTriangle className="size-3" /> WARNING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            <XCircle className="size-3" /> ERROR
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-zinc-300 text-xs">
                        {log.details}
                      </td>
                      <td className="px-5 py-4">
                        {log.user ? (
                          <div>
                            <div className="font-semibold text-zinc-200 text-xs truncate max-w-[150px]">{log.user.name}</div>
                            <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs italic">ระบบ (System)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="text-center text-xs text-zinc-600">
          แสดงข้อมูล {filteredLogs.length} รายการ (ล่าสุด 200 รายการ)
        </div>

      </div>
    </div>
  );
}
