export class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Ensure the seed is a positive integer and doesn't start with 0
    this.seed = Math.abs(hash) || 12345;
  }

  // Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive)
  next(): number {
    // Linear Congruential Generator (LCG)
    // Using standard Numerical Recipes parameters: m = 2^31 - 1, a = 16807, c = 0
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  // Helper to choose a random item from an array
  choose<T>(arr: T[] | readonly T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  // Helper to get random integer in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Helper to shuffle an array deterministically
  shuffle<T>(arr: T[] | readonly T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
