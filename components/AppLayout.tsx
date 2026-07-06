"use client";

import React, { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calculator,
  Award,
  Zap,
  LogOut,
  GraduationCap,
  Presentation,
  BookOpen,
  Users,
  Menu,
  X,
  LayoutDashboard,
  FolderClosed,
  Loader2,
  ChevronRight,
  ChevronDown,
  UserCog,
  ShieldAlert,
  Activity,
  BarChart,
  ScrollText,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionAction, logoutAction, updateProfileAction, pingAction } from "@/app/actions/auth";
import { getUserClassroomsAction } from "@/app/actions/classroom";
import { Button } from "./ui/button";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";

interface UserSession {
  userId: string;
  email: string;
  name: string;
  image?: string;
  role: "LEARNER" | "TEACHER" | "ADMIN";
}

interface ClassroomShort {
  id: string;
  name: string;
  code: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClassesDropdown, setShowClassesDropdown] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user && showProfileModal) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setCurrentPassword("");
      setNewPassword("");
      setProfileError(null);
      setProfileSuccess(false);
    }
  }, [showProfileModal]);

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setUpdatingProfile(true);

    const formData = new FormData(e.currentTarget);

    // Run async actions outside of startTransition
    (async () => {
      try {
        const res = await updateProfileAction(null, formData);
        setUpdatingProfile(false);
        if (res.success) {
          setProfileSuccess(true);
          const updatedSession = await getSessionAction();
          setUser(updatedSession);

          // Clear password fields on successful save
          setCurrentPassword("");
          setNewPassword("");

          startTransition(() => {
            router.refresh();
          });
        } else {
          setProfileError(res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } catch (err) {
        setUpdatingProfile(false);
        setProfileError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    })();
  };

  useEffect(() => {
    async function loadLayoutData() {
      try {
        const session = await getSessionAction();
        setUser(session);
        if (session) {
          const classes = await getUserClassroomsAction();
          setClassrooms(classes);
        } else {
          setClassrooms([]);
        }
      } catch (err) {
        console.error("Failed to load layout data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLayoutData();
  }, [pathname]); // Reload when pathname changes to ensure correct state

  // Keep-alive ping to update online status
  useEffect(() => {
    if (!user) return;

    const ping = () => {
      pingAction().catch(console.error);
    };

    // Ping right away, then every 60 seconds
    ping();
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    startTransition(async () => {
      await logoutAction();
      setUser(null);
      setClassrooms([]);
      setMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    });
  };

  const mainNavItems: { href: string; label: string; icon: any; description: string }[] = [
    // {
    //   href: "/",
    //   label: "เครื่องคำนวณ",
    //   icon: Calculator,
    //   description: "ตัวคำนวณแถบสีตัวต้านทาน"
    // },
  ];

  const dashboardNavGroups = [
    {
      label: "การเรียนรู้ (Learning)",
      items: [
        ...(user ? [{
          href: "/learn",
          label: "บทเรียน",
          icon: BookOpen,
        }] : []),
        ...(user ? [{
          href: "/quiz",
          label: "เกมตอบคำถาม (Quiz)",
          icon: Award,
        }] : []),
        ...(user ? [{
          href: "/classroom",
          label: "ห้องเรียนทั้งหมด",
          icon: LayoutDashboard,
        }] : []),
      ]
    },
    ...(user?.role === "ADMIN" ? [{
      label: "ระบบแอดมิน (Admin Panel)",
      items: [
        {
          href: "/admin",
          label: "แผงควบคุม (Dashboard)",
          icon: Activity,
          exact: true
        },
        {
          href: "/admin/users",
          label: "จัดการผู้ใช้งาน",
          icon: Users,
        },
        {
          href: "/admin/security",
          label: "ความปลอดภัย (IP)",
          icon: ShieldAlert,
        },
        {
          href: "/admin/logs",
          label: "บันทึกระบบ (Logs)",
          icon: ScrollText,
        },
        {
          href: "/admin/settings",
          label: "ตั้งค่าระบบ",
          icon: Settings,
        }
      ]
    }] : [])
  ].filter(group => group.items.length > 0);

  // Mobile drawer toggle
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Loading spinner during initial load to prevent layout flashes
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
        <Loader2 className="size-8 text-indigo-400 animate-spin mb-3" />
        <span className="text-xs uppercase tracking-wider font-semibold">กำลังโหลด...</span>
      </div>
    );
  }

  // 1. LANDING PAGE LAYOUT (Logged out users)
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Transparent top navbar */}
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                  <Zap className="size-5 text-indigo-400" />
                </div>
                <span className="font-extrabold text-lg bg-gradient-to-r from-zinc-100 to-zinc-400 text-transparent bg-clip-text">
                  Practice-Lab
                </span>
              </Link>

              {/* Navigation links */}
              <div className="hidden sm:flex items-center gap-2">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-transparent transition-all",
                        isActive
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-md"
                          : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-900/40"
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Right Login/Register CTA */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href="/login">
                  <Button variant="ghost" className="h-9 px-3.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-900/50 cursor-pointer">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer rounded-lg shadow-md">
                    สมัครสมาชิก
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        </header>

        {/* Content container */}
        <main className="flex-1 flex flex-col justify-start">
          {children}
        </main>
      </div>
    );
  }

  // 2. DASHBOARD LAYOUT (Logged in users - Sidebar Workspace Layout)
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-[260px] border-r border-zinc-200 dark:border-zinc-900 bg-zinc-50/60 dark:bg-zinc-950/60 backdrop-blur-md flex-col justify-between shrink-0 h-screen sticky top-0 z-30">

        {/* Top brand & navigation */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Logo */}
          <Link href="/classroom" className="flex items-center gap-2 group px-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
              <Zap className="size-5 text-indigo-400 animate-pulse" />
            </div>
            <span className="font-black text-base bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 text-transparent bg-clip-text font-heading uppercase tracking-wider">
              Practice-Lab
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="space-y-4">
            {dashboardNavGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <span className="px-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">{group.label}</span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = (item as any).exact
                    ? pathname === item.href
                    : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border border-transparent group",
                        isActive
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.08)]"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/30 dark:hover:bg-zinc-900/30"
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0 transition-transform", isActive ? "text-indigo-400 scale-110" : "text-zinc-500 group-hover:text-zinc-350")} />
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Quick Classroom access in sidebar */}
          {classrooms.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-900/60">
              <button
                onClick={() => setShowClassesDropdown(!showClassesDropdown)}
                className="w-full flex items-center justify-between px-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <span>ห้องเรียนทั้งหมด ({classrooms.length})</span>
                <ChevronDown className={cn("size-3 transition-transform", showClassesDropdown ? "" : "transform -rotate-90")} />
              </button>

              {showClassesDropdown && (
                <div className="space-y-0.5 pl-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {classrooms.map((cls) => {
                    const isActive = pathname.startsWith(`/classroom/${cls.id}`);
                    return (
                      <Link
                        key={cls.id}
                        href={`/classroom/${cls.id}`}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border border-transparent",
                          isActive
                            ? "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                            : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-250 hover:bg-white/20 dark:hover:bg-zinc-900/20"
                        )}
                        title={cls.name}
                      >
                        <FolderClosed className={cn("size-3.5 shrink-0", isActive ? "text-indigo-400" : "text-zinc-650")} />
                        <span className="truncate">{cls.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Profile at Bottom */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2.5 p-1 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 px-3 py-2.5">
            <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 overflow-hidden ${user.role === "TEACHER" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
              {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate" title={user.name}>{user.name}</div>
              <span className={cn(
                "inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border mt-0.5",
                user.role === "TEACHER" ? "bg-indigo-500/5 text-indigo-400 border-indigo-500/20" : "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
              )}>
                {user.role === "TEACHER" ? "ผู้สอน" : user.role === "ADMIN" ? "แอดมิน" : "ผู้เรียน"}
              </span>
            </div>

            <ThemeToggle />

            <Button
              onClick={() => setShowProfileModal(true)}
              variant="ghost"
              size="icon"
              className="size-8 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/10 rounded-lg shrink-0 cursor-pointer"
              title="แก้ไขโปรไฟล์"
            >
              <UserCog className="size-3.5" />
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="size-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 rounded-lg shrink-0 cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>

      </aside>

      {/* MOBILE HEADER */}
      <header className="lg:hidden h-14 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMobileMenu}
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-900/50 cursor-pointer"
          >
            <Menu className="size-5" />
          </Button>

          <Link href="/classroom" className="flex items-center gap-1.5">
            <Zap className="size-4 text-indigo-400" />
            <span className="font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Practice-Lab
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* User Badge initials */}
          <div className={`size-7.5 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden ${user.role === "TEACHER" ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-400/10 text-emerald-400"
            }`}>
            {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            onClick={toggleMobileMenu}
            className="fixed inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer container */}
          <div className="relative w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 h-full flex flex-col justify-between z-10 shadow-2xl p-4">

            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-900">
                <div className="flex items-center gap-1.5">
                  <Zap className="size-4 text-indigo-400" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Menu</span>
                </div>
                <Button
                  onClick={toggleMobileMenu}
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-4">
                {dashboardNavGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="px-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">{group.label}</span>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = (item as any).exact
                        ? pathname === item.href
                        : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border border-transparent",
                            isActive
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                              : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/30 dark:hover:bg-zinc-900/30"
                          )}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Classrooms quick links on mobile */}
              {classrooms.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-900">
                  <span className="px-2.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">ห้องเรียนของคุณ</span>
                  <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
                    {classrooms.map((cls) => {
                      const isActive = pathname.startsWith(`/classroom/${cls.id}`);
                      return (
                        <Link
                          key={cls.id}
                          href={`/classroom/${cls.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border border-transparent",
                            isActive
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold"
                              : "text-zinc-500 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/20 dark:hover:bg-zinc-900/20"
                          )}
                        >
                          <FolderClosed className="size-3.5 text-zinc-650" />
                          <span className="truncate">{cls.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Profile & Logout in Mobile drawer */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-900/60">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 overflow-hidden">
                    {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200 truncate w-[100px]">{user.name}</div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase">
                      {user.role === "TEACHER" ? "ผู้สอน" : user.role === "ADMIN" ? "แอดมิน" : "ผู้เรียน"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button
                    onClick={() => { setMobileMenuOpen(false); setShowProfileModal(true); }}
                    variant="ghost"
                    size="icon"
                    className="size-8 text-zinc-500 hover:text-indigo-400 rounded-lg cursor-pointer"
                    title="แก้ไขโปรไฟล์"
                  >
                    <UserCog className="size-3.5" />
                  </Button>

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-red-500/10 hover:text-red-400 rounded-lg cursor-pointer"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog className="size-5 text-indigo-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">แก้ไขข้อมูลส่วนตัว</h3>
              </div>
              <Button
                type="button"
                onClick={() => setShowProfileModal(false)}
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-zinc-500 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {profileSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <UserCog className="size-4 shrink-0 text-emerald-400" />
                    <span>บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="profileName" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">ชื่อ-นามสกุล</label>
                  <input
                    id="profileName"
                    name="name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profileEmail" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">อีเมล</label>
                  <input
                    id="profileEmail"
                    name="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-all duration-200"
                    required
                  />
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="newPassword" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">รหัสผ่านใหม่ (หากต้องการเปลี่ยน)</label>
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full p-2.5 text-xs rounded-lg bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-all duration-200"
                  />
                </div>

                {newPassword.trim().length > 0 && (
                  <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <label htmlFor="currentPassword" className="text-xs font-bold text-yellow-500 uppercase">รหัสผ่านปัจจุบัน (เว้นว่างได้หากสมัครด้วย Google)</label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านปัจจุบันของคุณ (ถ้ามี)"
                      className="w-full p-2.5 text-xs rounded-lg bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-zinc-750/50 hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-all duration-200"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowProfileModal(false)}
                    className="h-9 px-4 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    ปิด
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingProfile}
                    className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs cursor-pointer rounded-lg shadow-sm"
                  >
                    {updatingProfile ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" />
                        กำลังบันทึก...
                      </span>
                    ) : (
                      "บันทึกข้อมูล"
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-3">การเชื่อมต่อบัญชี</h4>
                <GoogleLoginButton
                  mode="link"
                  onSuccess={async () => {
                    const session = await getSessionAction();
                    setUser(session);
                    router.refresh();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
