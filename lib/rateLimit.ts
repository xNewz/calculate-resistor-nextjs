type Attempt = {
  count: number;
  lastAttempt: number;
  blockedUntil: number | null;
};

// In-memory store for tracking failed attempts
const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 mins
const RESET_DURATION_MS = 5 * 60 * 1000; // 5 mins

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let attempt = attempts.get(identifier);

  if (!attempt) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return { allowed: false, remaining: 0 };
  }

  if (attempt.blockedUntil && now >= attempt.blockedUntil) {
    attempt.count = 0;
    attempt.blockedUntil = null;
    attempts.set(identifier, attempt);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (now - attempt.lastAttempt > RESET_DURATION_MS) {
    attempt.count = 0;
    attempts.set(identifier, attempt);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  return { allowed: true, remaining: Math.max(0, MAX_ATTEMPTS - attempt.count) };
}

export function recordFailedAttempt(identifier: string): boolean {
  const now = Date.now();
  let attempt = attempts.get(identifier) || { count: 0, lastAttempt: now, blockedUntil: null };

  attempt.count += 1;
  attempt.lastAttempt = now;

  let justBlocked = false;
  if (attempt.count >= MAX_ATTEMPTS && !attempt.blockedUntil) {
    attempt.blockedUntil = now + BLOCK_DURATION_MS;
    justBlocked = true; // True only exactly when it becomes blocked
  } else if (attempt.count >= MAX_ATTEMPTS) {
      attempt.blockedUntil = now + BLOCK_DURATION_MS; // keep extending block
  }

  attempts.set(identifier, attempt);
  return justBlocked;
}

export function clearAttempts(identifier: string) {
  attempts.delete(identifier);
}
