import { SeededRandom } from "./seededRandom";
import { 
  digits, 
  multipliers, 
  tolerances, 
  calculate4Band, 
  calculate5Band 
} from "./resistor";
import { 
  multimeterRanges, 
  formatMultimeterValue, 
  MultimeterQuestion 
} from "./multimeter";

// Deterministic choices generator for resistors
export function generateSeededResistorChoices(
  correctFormatted: string, 
  bands: 4 | 5, 
  rng: SeededRandom
): string[] {
  const set = new Set<string>([correctFormatted]);
  let attempts = 0;
  while (set.size < 4 && attempts < 100) {
    attempts++;
    const first = rng.choose(digits.slice(1)); // Skip black (index 0) for the first band
    const second = rng.choose(digits);
    const mult = rng.choose(multipliers);
    const tol = rng.choose(tolerances);
    let wrongFormatted = "";
    if (bands === 4) {
      wrongFormatted = calculate4Band(first, second, mult, tol).formatted;
    } else {
      const third = rng.choose(digits);
      wrongFormatted = calculate5Band(first, second, third, mult, tol).formatted;
    }
    if (wrongFormatted) {
      set.add(wrongFormatted);
    }
  }
  return rng.shuffle(Array.from(set));
}

// Deterministic question generator for multimeter
export function generateSeededMultimeterQuestion(rng: SeededRandom): MultimeterQuestion {
  const range = rng.choose(multimeterRanges);
  let value = 0;
  let pointerValue = 0;

  if (range.type === "OHM") {
    // Analog multimeter ohm scales usually go right to left (0 to infinity).
    const ohmTicks = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 2000];
    pointerValue = rng.choose(ohmTicks);
    value = pointerValue * range.maxScale;
  } else {
    // DCV / ACV
    if (range.maxScale === 10) {
      pointerValue = rng.nextInt(0, 50) * 0.2;
      pointerValue = Math.round(pointerValue * 10) / 10;
    } else if (range.maxScale === 50) {
      pointerValue = rng.nextInt(0, 50);
    } else if (range.maxScale === 250) {
      pointerValue = rng.nextInt(0, 50) * 5;
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

// Deterministic choices generator for multimeter
export function generateSeededMultimeterChoices(
  correctFormatted: string, 
  correctRangeType: "DCV" | "ACV" | "OHM", 
  rng: SeededRandom
): string[] {
  const set = new Set<string>([correctFormatted]);
  let attempts = 0;
  while (set.size < 4 && attempts < 100) {
    attempts++;
    const q = generateSeededMultimeterQuestion(rng);
    if (q.range.type === correctRangeType) {
      set.add(q.formatted);
    }
  }
  return rng.shuffle(Array.from(set));
}

// Main function to generate deterministic assignment/exam questions list
export function generateSeededQuestions(
  studentId: string,
  assignmentId: string,
  assignmentType: string,
  questionCount: number,
  questionMode: string,
  bandType: string
) {
  const seed = `${studentId}-${assignmentId}`;
  const rng = new SeededRandom(seed);
  const list: any[] = [];

  if (assignmentType === "MULTIMETER") {
    for (let i = 0; i < questionCount; i++) {
      const q = generateSeededMultimeterQuestion(rng);
      const choices = questionMode === "CHOICE" 
        ? generateSeededMultimeterChoices(q.formatted, q.range.type, rng) 
        : undefined;
      list.push({
        formatted: q.formatted,
        multimeterData: q,
        choices,
      });
    }
    return list;
  }

  const bands = parseInt(bandType, 10) as 4 | 5;

  for (let i = 0; i < questionCount; i++) {
    if (bands === 4) {
      const first = rng.choose(digits.slice(1));
      const second = rng.choose(digits);
      const mult = rng.choose(multipliers);
      const tol = rng.choose(tolerances);
      const res = calculate4Band(first, second, mult, tol);
      const choices = questionMode === "CHOICE" 
        ? generateSeededResistorChoices(res.formatted, 4, rng) 
        : undefined;
      list.push({
        bands: 4,
        colors: [first, second, mult, tol],
        resistance: res.resistance,
        formatted: res.formatted,
        tolerance: res.tolerance,
        choices,
      });
    } else {
      const first = rng.choose(digits.slice(1));
      const second = rng.choose(digits);
      const third = rng.choose(digits);
      const mult = rng.choose(multipliers);
      const tol = rng.choose(tolerances);
      const res = calculate5Band(first, second, third, mult, tol);
      const choices = questionMode === "CHOICE" 
        ? generateSeededResistorChoices(res.formatted, 5, rng) 
        : undefined;
      list.push({
        bands: 5,
        colors: [first, second, third, mult, tol],
        resistance: res.resistance,
        formatted: res.formatted,
        tolerance: res.tolerance,
        choices,
      });
    }
  }
  return list;
}
