"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Award, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "เครื่องคำนวณ",
      icon: Calculator,
    },
    {
      href: "/quiz",
      label: "เกมตอบคำถาม (Quiz)",
      icon: Award,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 group-hover:border-amber-400/40 transition-colors">
                <Zap className="size-5 text-amber-400" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-zinc-100 to-zinc-400 text-transparent bg-clip-text">
                Resistor Master
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-amber-400/10 border border-amber-400/20 text-amber-400 shadow-lg"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 border border-transparent"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
