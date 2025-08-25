export const VALUE_MAP: Record<string, number> = {
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
  gold: 0.1,
  silver: 0.01,
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

export const tolerances = ["gold", "silver"] as const;

export type Digit = (typeof digits)[number];
export type Multiplier = (typeof multipliers)[number];
export type Tolerance = (typeof tolerances)[number];

export function formatResistance(
  first: Digit,
  second: Digit,
  third: Multiplier,
  fourth: Tolerance
): string {
  const d1 = VALUE_MAP[first];
  const d2 = VALUE_MAP[second];
  const mult = VALUE_MAP[third];

  let resistance: number;
  if (mult === 0.1 || mult === 0.01) {
    resistance = (d1 * 10 + d2) * mult;
  } else {
    resistance = (d1 * 10 + d2) * Math.pow(10, mult);
  }

  let prefix = "Ω";
  if (resistance >= 1_000 && resistance < 1_000_000) {
    resistance = Math.round((resistance / 1_000) * 100) / 100;
    prefix = "kΩ";
  } else if (resistance >= 1_000_000 && resistance < 1_000_000_000) {
    resistance = Math.round((resistance / 1_000_000) * 100) / 100;
    prefix = "MΩ";
  } else {
    resistance = Math.round(resistance * 100) / 100;
  }

  const tol = fourth === "gold" ? " 5%" : " 10%";
  return `${resistance}${prefix}${tol}`;
}
