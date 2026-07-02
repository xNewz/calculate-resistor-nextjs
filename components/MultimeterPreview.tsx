"use client";

import React, { useEffect, useState } from "react";
import { MultimeterRange } from "@/lib/multimeter";
import { cn } from "@/lib/utils";

interface MultimeterPreviewProps {
  range: MultimeterRange;
  pointerValue: number;
  onLoad?: () => void;
}

export default function MultimeterPreview({ range, pointerValue, onLoad }: MultimeterPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (onLoad) {
      // Simulate loading for animation/ux if image doesn't fire load event quickly
      const t = setTimeout(() => onLoad(), 800);
      return () => clearTimeout(t);
    }
  }, [onLoad]);

  const minA = -53;
  const maxA = 53;
  const cOhm = 20;

  let percentage = 0;
  if (range.type === "OHM") {
    percentage = 1 - pointerValue / (pointerValue + cOhm);
  } else {
    percentage = pointerValue / range.maxScale;
  }

  // Bound between 0 and 1
  percentage = Math.max(0, Math.min(1, percentage));

  const angle = minA + percentage * (maxA - minA);

  if (!mounted) return null;

  return (
    <div className="relative w-full max-w-sm mx-auto bg-zinc-100 rounded-lg shadow-inner overflow-hidden border-4 border-zinc-300">
      <div className="p-4 flex flex-col items-center">
        {/* Multimeter face/glass */}
        <div className="relative w-full aspect-[1.8] bg-white rounded-t-3xl rounded-b-xl border border-zinc-200 shadow-sm overflow-hidden flex justify-center mt-2">

          {/* Background Image */}
          <img
            src="/multimeter_bg.jpg"
            alt="Multimeter Scale"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            onLoad={onLoad}
          />

          {/* Needle pivot */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-zinc-900 rounded-full shadow-lg z-10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-zinc-400 rounded-full" />
          </div>

          {/* Needle */}
          <div
            className="absolute bottom-1 left-1/2 w-[2px] h-[105%] bg-red-500 origin-bottom z-0 transition-transform duration-1000 ease-out shadow-[0_0_2px_rgba(0,0,0,0.5)]"
            style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
          >
            {/* Needle tip */}
            <div className="absolute -top-1 -left-[1px] w-[4px] h-4 bg-red-600" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          </div>
        </div>

        {/* Selected Range Display */}
        <div className="mt-4 w-full bg-zinc-800 px-4 py-2 rounded-xl text-center border-2 border-zinc-700 shadow-md">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">ย่านวัด</div>
          <div className={cn(
            "text-xl font-black font-mono",
            range.type === "OHM" ? "text-blue-400" : "text-emerald-400"
          )}>
            {range.name}
          </div>
        </div>

      </div>
    </div>
  );
}
