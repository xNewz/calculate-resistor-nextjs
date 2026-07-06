"use client";

import { useEffect, useState, useTransition } from "react";
import { getBannedIPsAction, banIPAction, unbanIPAction } from "@/app/actions/security";
import { ShieldAlert, ShieldX, Unlock, Search, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type BannedIP = {
  ip: string;
  reason: string;
  createdAt: Date;
  expiresAt: Date | null;
  bannedBy: { name: string } | null;
};

export default function SecurityPage() {
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State for Manual Ban
  const [banIp, setBanIp] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("0"); // 0 = permanent

  useEffect(() => {
    fetchBannedIPs();
  }, []);

  async function fetchBannedIPs() {
    setLoading(true);
    const res = await getBannedIPsAction();
    if (res.success && res.bannedIPs) {
      setBannedIPs(res.bannedIPs);
    } else {
      setMessage({ text: "ไม่สามารถดึงข้อมูล IP ที่ถูกแบนได้", type: "error" });
    }
    setLoading(false);
  }

  async function handleBan(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append("ip", banIp);
    formData.append("reason", banReason);
    formData.append("duration", banDuration);

    startTransition(async () => {
      const res = await banIPAction(formData);
      if (res.success) {
        setMessage({ text: "สั่งแบน IP สำเร็จ", type: "success" });
        setBanIp("");
        setBanReason("");
        setBanDuration("0");
        fetchBannedIPs();
      } else {
        setMessage({ text: res.error || "เกิดข้อผิดพลาด", type: "error" });
      }
    });
  }

  async function handleUnban(ip: string) {
    if (!confirm(`คุณต้องการปลดแบน IP: ${ip} ใช่หรือไม่?`)) return;
    
    startTransition(async () => {
      const res = await unbanIPAction(ip);
      if (res.success) {
        setMessage({ text: `ปลดแบน ${ip} สำเร็จ`, type: "success" });
        fetchBannedIPs();
      } else {
        setMessage({ text: res.error || "เกิดข้อผิดพลาด", type: "error" });
      }
    });
  }

  const filteredIPs = bannedIPs.filter(b => b.ip.includes(searchTerm) || b.reason.includes(searchTerm));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link href="/admin">
            <Button variant="ghost" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-0 hover:bg-transparent flex items-center gap-2">
              <span className="text-lg">←</span>
              กลับหน้าแผงควบคุม
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="size-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">ระบบความปลอดภัย (Security)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">จัดการการบล็อก IP และป้องกันการเดารหัสผ่าน</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold border flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {message.type === "success" ? <ShieldAlert className="size-5" /> : <ShieldX className="size-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List */}
          <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 lg:col-span-2">
            <CardHeader className="border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-zinc-900 dark:text-zinc-100">IP ที่ถูกระงับการใช้งาน</CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-1">รายชื่อ IP ที่ถูกบล็อกจากระบบ</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="ค้นหา IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="size-8 text-red-500 animate-spin" />
                </div>
              ) : filteredIPs.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm">
                  ไม่พบ IP ที่ถูกระงับในขณะนี้
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
                  {filteredIPs.map((b) => (
                    <div key={b.ip} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-100/20 dark:hover:bg-zinc-800/20 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-400">{b.ip}</span>
                          {b.expiresAt === null ? (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase border border-red-500/20">ถาวร</span>
                          ) : (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase border border-amber-500/20">ชั่วคราว</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          เหตุผล: <span className="text-zinc-700 dark:text-zinc-300">{b.reason}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span>แบนเมื่อ: {new Date(b.createdAt).toLocaleString("th-TH")}</span>
                          {b.expiresAt && <span>หมดเวลา: {new Date(b.expiresAt).toLocaleString("th-TH")}</span>}
                          {b.bannedBy && <span>โดย: {b.bannedBy.name}</span>}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUnban(b.ip)}
                        disabled={isPending}
                        variant="outline"
                        size="sm"
                        className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                      >
                        <Unlock className="size-3.5 mr-1.5" />
                        ปลดบล็อก
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Ban Form */}
          <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-fit">
            <CardHeader className="border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
              <CardTitle className="text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldX className="size-4 text-red-400" />
                แบน IP ด้วยตนเอง
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleBan} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ip" className="text-xs text-zinc-500 dark:text-zinc-400">หมายเลข IP</Label>
                  <input
                    id="ip"
                    type="text"
                    required
                    value={banIp}
                    onChange={(e) => setBanIp(e.target.value)}
                    placeholder="เช่น 192.168.1.1"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reason" className="text-xs text-zinc-500 dark:text-zinc-400">เหตุผลที่แบน</Label>
                  <input
                    id="reason"
                    type="text"
                    required
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="เช่น พยายามสแปมบอร์ด"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-xs text-zinc-500 dark:text-zinc-400">ระยะเวลา (ชั่วโมง)</Label>
                  <select
                    id="duration"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  >
                    <option value="1">1 ชั่วโมง</option>
                    <option value="24">24 ชั่วโมง (1 วัน)</option>
                    <option value="168">168 ชั่วโมง (7 วัน)</option>
                    <option value="0">แบนถาวร</option>
                  </select>
                </div>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-zinc-900 dark:text-white font-bold transition-all"
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4 mr-1.5" /> เพิ่มการแบน</>}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
