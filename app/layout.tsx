import type { Metadata } from "next";
import { Inter, Kanit, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Practice-Lab",
  description: "The Practice Lab",
};

import AppLayout from "@/components/AppLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AlertTriangle, ShieldAlert, Info, CheckCircle2, XCircle } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
  
  const isMaintenanceMode = settings?.maintenanceMode;
  const isAnnouncement = settings?.announcementEnabled;

  if (isMaintenanceMode && session?.role !== "ADMIN") {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${kanit.variable} ${geistMono.variable} font-sans antialiased bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="text-center space-y-4 max-w-md p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-2xl">
              <ShieldAlert className="size-16 text-orange-500 mx-auto animate-pulse" />
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">ระบบกำลังปิดปรับปรุง</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                ขออภัยในความไม่สะดวก ขณะนี้เว็บไซต์กำลังอยู่ในช่วงปิดปรับปรุงและบำรุงรักษาระบบ (Maintenance Mode) 
                กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง
              </p>
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }
  const type = settings?.announcementType || "INFO";
  let bannerColors = "bg-blue-600/20 border-blue-500/30 text-blue-300";
  let Icon = Info;
  
  if (type === "WARNING") {
    bannerColors = "bg-amber-600/20 border-amber-500/30 text-amber-300";
    Icon = AlertTriangle;
  } else if (type === "ERROR") {
    bannerColors = "bg-red-600/20 border-red-500/30 text-red-300";
    Icon = XCircle;
  } else if (type === "SUCCESS") {
    bannerColors = "bg-emerald-600/20 border-emerald-500/30 text-emerald-300";
    Icon = CheckCircle2;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${kanit.variable} ${geistMono.variable} font-sans antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isAnnouncement && settings?.announcementText && (
            <div className={`w-full border-b px-4 py-2.5 text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-2 z-50 ${bannerColors}`}>
              <Icon className="size-4 shrink-0" />
              <span>{settings.announcementText}</span>
            </div>
          )}
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
