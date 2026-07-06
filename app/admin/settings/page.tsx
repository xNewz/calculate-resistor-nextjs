"use client";

import React, { useEffect, useState } from "react";
import { getSystemSettingsAction, updateSystemSettingsAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, ShieldAlert, Loader2, Save, ChevronLeft, Bell } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await getSystemSettingsAction();
    if (res.success && res.settings) {
      setMaintenanceMode(res.settings.maintenanceMode);
      setAnnouncementEnabled(res.settings.announcementEnabled);
      setAnnouncementText(res.settings.announcementText || "");
    } else {
      setMessage({ text: res.error || "ไม่สามารถโหลดการตั้งค่าระบบได้", type: "error" });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    const formData = new FormData();
    if (maintenanceMode) formData.append("maintenanceMode", "true");
    if (announcementEnabled) formData.append("announcementEnabled", "true");
    formData.append("announcementText", announcementText);

    const res = await updateSystemSettingsAction(formData);
    
    if (res.success) {
      setMessage({ text: "การตั้งค่าระบบถูกบันทึกเรียบร้อยแล้ว", type: "success" });
    } else {
      setMessage({ text: res.error || "ไม่สามารถบันทึกการตั้งค่าระบบได้", type: "error" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold tracking-wider">กำลังโหลดการตั้งค่า...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
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
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Settings className="size-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">ตั้งค่าส่วนกลาง (System Settings)</h1>
                <p className="text-xs text-zinc-500 mt-0.5">จัดการสถานะของเว็บไซต์และการแจ้งเตือนแบบโกลบอล</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold border ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <ShieldAlert className="size-5 text-red-500" /> 
                โหมดปิดปรับปรุง (Maintenance Mode)
              </CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                เมื่อเปิดโหมดนี้ ผู้เรียนและผู้สอนทั่วไปจะไม่สามารถเข้าใช้งานระบบได้ จะมีเพียงผู้ดูแลระบบ (ADMIN) เท่านั้นที่เข้าใช้งานได้ตามปกติ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
                <input 
                  type="checkbox"
                  id="maintenance-mode" 
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="size-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                />
                <Label htmlFor="maintenance-mode" className="text-sm font-semibold cursor-pointer">
                  {maintenanceMode ? (
                    <span className="text-red-400">ระบบกำลังปิดปรับปรุง (เปิดใช้งานอยู่)</span>
                  ) : (
                    <span className="text-zinc-300">ปิดการใช้งาน</span>
                  )}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Bell className="size-5 text-blue-400" /> 
                ประกาศส่วนกลาง (Global Announcement)
              </CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                แสดงแถบข้อความแจ้งเตือนที่ด้านบนสุดของทุกหน้าจอ เพื่อประกาศข่าวสารหรือการแจ้งเตือนฉุกเฉินให้ทุกคนทราบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="announcement-enabled" 
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="size-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                />
                <Label htmlFor="announcement-enabled" className="text-sm font-semibold cursor-pointer text-zinc-300">
                  เปิดแสดงแถบประกาศ
                </Label>
              </div>

              {announcementEnabled && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="announcement-text" className="text-xs text-zinc-400">
                    ข้อความประกาศ (รองรับข้อความสั้นๆ)
                  </Label>
                  <textarea
                    id="announcement-text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="เช่น ระบบจะปิดปรับปรุงในคืนนี้เวลา 24:00 น. ขออภัยในความไม่สะดวก"
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl min-h-[80px] focus-visible:ring-1 focus-visible:ring-blue-500/50 focus:outline-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-8 rounded-xl shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" /> บันทึกการตั้งค่า
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
