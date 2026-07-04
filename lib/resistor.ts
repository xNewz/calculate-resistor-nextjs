export const DIGIT_MAP: Record<string, number> = {
  black: 0,
  brown: 1,
  red: 2,
  orange: 3,
  yellow: 4,
  green: 5,
  blue: 6,
  purple: 7,
  gray: 8,
  white: 9,
};

export const MULTIPLIER_MAP: Record<string, number> = {
  black: 1,
  brown: 10,
  red: 100,
  orange: 1_000,
  yellow: 10_000,
  green: 100_000,
  blue: 1_000_000,
  purple: 10_000_000,
  gold: 0.1,
  silver: 0.01,
};

export const TOLERANCE_MAP: Record<string, number> = {
  // brown: 1,
  // red: 2,
  // green: 0.5,
  // blue: 0.25,
  // purple: 0.1,
  gold: 5,
  silver: 10,
};

export const COLOR_MAP: Record<
  string,
  { hex: string; nameEn: string; nameTh: string }
> = {
  black: { hex: "#000000", nameEn: "Black", nameTh: "ดำ" },
  brown: { hex: "#7B3F00", nameEn: "Brown", nameTh: "น้ำตาล" },
  red: { hex: "#D32F2F", nameEn: "Red", nameTh: "แดง" },
  orange: { hex: "#EF6C00", nameEn: "Orange", nameTh: "ส้ม" },
  yellow: { hex: "#F9A825", nameEn: "Yellow", nameTh: "เหลือง" },
  green: { hex: "#2E7D32", nameEn: "Green", nameTh: "เขียว" },
  blue: { hex: "#1565C0", nameEn: "Blue", nameTh: "น้ำเงิน" },
  purple: { hex: "#6A1B9A", nameEn: "Purple", nameTh: "ม่วง" },
  gray: { hex: "#9E9E9E", nameEn: "Gray", nameTh: "เทา" },
  white: { hex: "#FFFFFF", nameEn: "White", nameTh: "ขาว" },
  gold: { hex: "#D4AF37", nameEn: "Gold", nameTh: "ทอง" },
  silver: { hex: "#BDBDBD", nameEn: "Silver", nameTh: "เงิน" },
};

export const digits = [
  "black",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "gray",
  "white",
] as const;

export const multipliers = [
  "black",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "gold",
  "silver",
] as const;

export const tolerances = [
  // "brown",
  // "red",
  // "green",
  // "blue",
  // "purple",
  "gold",
  "silver",
] as const;

export type Digit = (typeof digits)[number];
export type Multiplier = (typeof multipliers)[number];
export type Tolerance = (typeof tolerances)[number];

export interface CalculationResult {
  resistance: number;
  formatted: string;
  minResistance: number;
  maxResistance: number;
  formattedRange: string;
  tolerance: number;
}

export function formatValue(value: number): string {
  let displayValue = value;
  let unit = "Ω";

  if (value >= 1_000_000_000) {
    displayValue = value / 1_000_000_000;
    unit = "GΩ";
  } else if (value >= 1_000_000) {
    displayValue = value / 1_000_000;
    unit = "MΩ";
  } else if (value >= 1_000) {
    displayValue = value / 1_000;
    unit = "kΩ";
  }

  // Round to 2 decimal places if needed
  displayValue = Math.round(displayValue * 100) / 100;
  return `${displayValue} ${unit}`;
}

export function calculate4Band(
  first: Digit,
  second: Digit,
  multiplier: Multiplier,
  tolerance: Tolerance
): CalculationResult {
  const d1 = DIGIT_MAP[first] ?? 0;
  const d2 = DIGIT_MAP[second] ?? 0;
  const mult = MULTIPLIER_MAP[multiplier] ?? 1;
  const tolPercent = TOLERANCE_MAP[tolerance] ?? 5;

  const resistance = (d1 * 10 + d2) * mult;
  const minResistance = resistance * (1 - tolPercent / 100);
  const maxResistance = resistance * (1 + tolPercent / 100);

  return {
    resistance,
    formatted: formatValue(resistance),
    minResistance,
    maxResistance,
    formattedRange: `${formatValue(minResistance)} - ${formatValue(maxResistance)}`,
    tolerance: tolPercent,
  };
}

export function calculate5Band(
  first: Digit,
  second: Digit,
  third: Digit,
  multiplier: Multiplier,
  tolerance: Tolerance
): CalculationResult {
  const d1 = DIGIT_MAP[first] ?? 0;
  const d2 = DIGIT_MAP[second] ?? 0;
  const d3 = DIGIT_MAP[third] ?? 0;
  const mult = MULTIPLIER_MAP[multiplier] ?? 1;
  const tolPercent = TOLERANCE_MAP[tolerance] ?? 5;

  const resistance = (d1 * 100 + d2 * 10 + d3) * mult;
  const minResistance = resistance * (1 - tolPercent / 100);
  const maxResistance = resistance * (1 + tolPercent / 100);

  return {
    resistance,
    formatted: formatValue(resistance),
    minResistance,
    maxResistance,
    formattedRange: `${formatValue(minResistance)} - ${formatValue(maxResistance)}`,
    tolerance: tolPercent,
  };
}

// Backward compatibility helper
export function formatResistance(
  first: Digit,
  second: Digit,
  third: Multiplier,
  fourth: Tolerance
): string {
  const result = calculate4Band(first, second, third, fourth);
  return `${result.formatted} ±${result.tolerance}%`;
}

export function parseTextAnswer(input: string): number | null {
  const clean = input.trim().toLowerCase().replace(/[\sΩohmωโอห์ม]/g, "");
  const match = clean.match(/^([0-9.]+)(k|m|g)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const unit = match[2];
  if (unit === "k") return num * 1_000;
  if (unit === "m") return num * 1_000_000;
  if (unit === "g") return num * 1_000_000_000;
  return num;
}

export function formatMultiplierValue(value: number): string {
  if (value === 0.1) return "0.1";
  if (value === 0.01) return "0.01";
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}k`;
  return `${value}`;
}

export function generateResistorChoices(correctFormatted: string, bands: 4 | 5): string[] {
  const set = new Set<string>([correctFormatted]);
  let attempts = 0;
  while (set.size < 4 && attempts < 100) {
    attempts++;
    const first = digits[Math.floor(Math.random() * (digits.length - 1)) + 1];
    const second = digits[Math.floor(Math.random() * digits.length)];
    const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
    const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
    let wrongFormatted = "";
    if (bands === 4) {
      wrongFormatted = calculate4Band(first, second, mult, tol).formatted;
    } else {
      const third = digits[Math.floor(Math.random() * digits.length)];
      wrongFormatted = calculate5Band(first, second, third, mult, tol).formatted;
    }
    if (wrongFormatted) {
      set.add(wrongFormatted);
    }
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}
