"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10 animate-fade-in-up">
        {/* Error Code & Icon */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 drop-shadow-sm select-none">
              404
            </h1>
            <div className="absolute -top-6 -right-6 p-4 bg-indigo-500/10 text-indigo-500 rounded-full animate-bounce shadow-lg shadow-indigo-500/20 backdrop-blur-md">
              <Search className="size-8" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              ไม่พบหน้าที่คุณค้นหา
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
              ขออภัย หน้าเว็บที่คุณพยายามเข้าถึงอาจถูกลบไปแล้ว เปลี่ยนชื่อ หรือคุณอาจพิมพ์ URL ผิด
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] rounded-xl transition-all duration-300"
            >
              <Home className="mr-2 size-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-300"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 size-4" />
            ย้อนกลับ
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="flex justify-center pt-12 gap-2 opacity-50">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75"></div>
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
