"use client";
import React from "react";
import { COLOR_MAP } from "@/lib/resistor";

function getBandStyle(color: string): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "4.2%",
    height: "82%",
    borderRadius: 6,
    mixBlendMode: "multiply",
  };

  if (color === "gold") {
    return {
      ...base,
      backgroundImage:
        "linear-gradient(90deg, #B38E2E, #E4C24A 35%, #B38E2E 65%, #E4C24A)",
    };
  }
  if (color === "silver") {
    return {
      ...base,
      backgroundImage:
        "linear-gradient(90deg, #9EA3A8, #CFD3D6 35%, #9EA3A8 65%, #E3E6E8)",
    };
  }

  const hex = COLOR_MAP[color]?.hex || "#000000";

  const style: React.CSSProperties = {
    ...base,
    backgroundColor: hex,
  };
  if (color === "white" || color === "yellow") {
    style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.15)";
  }
  return style;
}

export default function ResistorPreview({ colors }: { colors: string[] }) {
  const is5Band = colors.length === 5;
  const positions = is5Band
    ? ["34%", "40.5%", "47%", "53.5%", "62%"]
    : ["34%", "42%", "50%", "62%"];

  const bgImage = is5Band ? "/5band.png" : "/4band.png";

  return (
    <div className="relative mx-auto w-full max-w-[800px] select-none">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-zinc-900/50 backdrop-blur-sm p-4 border border-zinc-800 shadow-2xl transition-all duration-300"
        style={{ aspectRatio: "800/180" }}
      >
        <div
          className="absolute inset-0 bg-center bg-no-repeat transition-all duration-500"
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "contain" }}
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