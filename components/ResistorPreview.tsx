"use client";
import React from "react";
import { type Digit, type Multiplier, type Tolerance } from "@/lib/resistor";

const COLOR_TO_CSS: Record<string, string> = {
  black: "#000000",
  brown: "#7B3F00",
  red: "#D32F2F",
  orange: "#EF6C00",
  yellow: "#F9A825",
  green: "#2E7D32",
  blue: "#1565C0",
  purple: "#6A1B9A",
  gray: "#9E9E9E",
  white: "#F5F5F5",
  gold: "#D4AF37",
  silver: "#BDBDBD",
};

function getBandStyle(color: keyof typeof COLOR_TO_CSS): React.CSSProperties {
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

  const style: React.CSSProperties = {
    ...base,
    backgroundColor: COLOR_TO_CSS[color],
  };
  if (color === "white" || color === "yellow") {
    style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.15)";
  }
  return style;
}

export default function ResistorPreview({
  first, second, third, fourth,
}: {
  first: Digit; second: Digit; third: Multiplier; fourth: Tolerance;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[900px] select-none">
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: "800/180" }}
      >
        <div
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/4band.png)", backgroundSize: "contain" }}
        />
        <div className="absolute left-[34%] top-[9%]" style={getBandStyle(first)} />
        <div className="absolute left-[42%] top-[9%]" style={getBandStyle(second)} />
        <div className="absolute left-[50%] top-[9%]" style={getBandStyle(third)} />
        <div className="absolute left-[62%] top-[9%]" style={getBandStyle(fourth)} />
      </div>
    </div>
  );
}