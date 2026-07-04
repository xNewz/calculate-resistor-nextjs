export type MultimeterRange = {
  type: "DCV" | "ACV" | "OHM";
  name: string;
  maxScale: number; // multiplier for OHM, max voltage for DCV/ACV
};

export const multimeterRanges: MultimeterRange[] = [
  { type: "DCV", name: "DCV 10", maxScale: 10 },
  { type: "DCV", name: "DCV 50", maxScale: 50 },
  { type: "DCV", name: "DCV 250", maxScale: 250 },
  { type: "ACV", name: "ACV 10", maxScale: 10 },
  { type: "ACV", name: "ACV 50", maxScale: 50 },
  { type: "ACV", name: "ACV 250", maxScale: 250 },
  { type: "OHM", name: "Ω x1", maxScale: 1 },
  { type: "OHM", name: "Ω x10", maxScale: 10 },
  { type: "OHM", name: "Ω x1k", maxScale: 1000 },
];

export interface MultimeterQuestion {
  range: MultimeterRange;
  pointerValue: number;
  value: number;
  formatted: string;
}

export function formatMultimeterValue(value: number, type: string): string {
  if (type === "OHM") {
    if (value >= 1000000) return `${value / 1000000}MΩ`;
    if (value >= 1000) return `${value / 1000}kΩ`;
    return `${value}Ω`;
  }
  return `${value}V`;
}

export function generateMultimeterQuestion(): MultimeterQuestion {
  const range = multimeterRanges[Math.floor(Math.random() * multimeterRanges.length)];
  let value = 0;
  let pointerValue = 0;

  if (range.type === "OHM") {
    // Analog multimeter ohm scales usually go right to left (0 to infinity).
    // Common markings: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1k, 2k
    const ohmTicks = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 2000];
    pointerValue = ohmTicks[Math.floor(Math.random() * ohmTicks.length)];
    value = pointerValue * range.maxScale;
  } else {
    // DCV / ACV
    if (range.maxScale === 10) {
      // 0 to 10 step 0.2
      pointerValue = Math.floor(Math.random() * 51) * 0.2;
      pointerValue = Math.round(pointerValue * 10) / 10;
    } else if (range.maxScale === 50) {
      // 0 to 50 step 1
      pointerValue = Math.floor(Math.random() * 51);
    } else if (range.maxScale === 250) {
      // 0 to 250 step 5
      pointerValue = Math.floor(Math.random() * 51) * 5;
    }
    value = pointerValue;
  }

  return {
    range,
    pointerValue,
    value,
    formatted: formatMultimeterValue(value, range.type),
  };
}

export function parseMultimeterAnswer(input: string, type: "DCV" | "ACV" | "OHM"): number | null {
  const clean = input.trim().toLowerCase().replace(/[\sΩohmωโอห์มvvoltsโวลต์]/g, "");
  const match = clean.match(/^([0-9.]+)(k|m|g)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const unit = match[2];
  if (type === "OHM") {
    if (unit === "k") return num * 1_000;
    if (unit === "m") return num * 1_000_000;
    if (unit === "g") return num * 1_000_000_000;
  } else {
    // For Volts, typically we don't have k or m in these simple tests, but handle it just in case
    if (unit === "k") return num * 1_000;
    if (unit === "m") return num * 1_000_000;
  }
  return num;
}

export function generateMultimeterChoices(correctFormatted: string, correctRangeType: "DCV" | "ACV" | "OHM"): string[] {
  const set = new Set<string>([correctFormatted]);
  let attempts = 0;
  while (set.size < 4 && attempts < 100) {
    attempts++;
    const q = generateMultimeterQuestion();
    if (q.range.type === correctRangeType) {
      set.add(q.formatted);
    }
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}
