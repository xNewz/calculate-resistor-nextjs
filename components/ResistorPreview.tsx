"use client";
import React, { useEffect, useRef } from "react";
import { COLOR_MAP } from "@/lib/resistor";

function getBandStyle(color: string): React.CSSProperties {
  return {
    width: "4.2%",
    height: "82%",
    borderRadius: 6,
    backgroundImage: `url('/tab_color/${color}.png')`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };
}

export default function ResistorPreview({ colors, onLoad }: { colors: string[], onLoad?: () => void }) {
  const is5Band = colors.length === 5;
  const positions = is5Band
    ? ["34%", "40.5%", "47%", "53.5%", "62%"]
    : ["34%", "42%", "50%", "62%"];

  const bgImage = is5Band ? "/5band.png" : "/4band.png";
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    if (!onLoadRef.current) return;
    
    let loadedCount = 0;
    const imagesToLoad = [bgImage, ...colors.map(c => `/tab_color/${c}.png`)];
    
    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === imagesToLoad.length) {
        onLoadRef.current?.();
      }
    };
    
    imagesToLoad.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = handleLoad;
      img.onerror = handleLoad;
    });
  }, [colors, bgImage]);

  return (
    <div className="relative mx-auto w-full max-w-[800px] select-none">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-zinc-900/50 backdrop-blur-sm p-4 border border-zinc-800 shadow-2xl transition-all duration-300"
        style={{ aspectRatio: "800/180" }}
      >
        <div
          className="absolute inset-0 bg-center bg-no-repeat transition-all duration-500"
          style={{ 
            backgroundImage: `url(${bgImage})`, 
            backgroundSize: "contain",
            filter: is5Band ? "hue-rotate(190deg) saturate(1.2) brightness(0.85)" : "none"
          }}
        />
        {colors.map((color, index) => {
          const leftPos = positions[index];
          if (!leftPos) return null;
          return (
            <div
              key={index}
              className="absolute top-[9%] transition-all duration-500 shadow-md"
              style={{
                ...getBandStyle(color),
                left: leftPos,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}