export const BADGES: Record<string, { name: string; icon: string; colorClass: string; description: string }> = {
  FIRST_PERFECT: {
    name: "Perfect Score",
    icon: "⭐",
    colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    description: "ได้คะแนนเต็มเป็นครั้งแรก"
  },
  EXAM_PASSER: {
    name: "Exam Passer",
    icon: "🎯",
    colorClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    description: "สอบผ่านโหมดสอบ (80% ขึ้นไป)"
  },
  HARD_WORKER: {
    name: "Hard Worker",
    icon: "🔥",
    colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
    description: "ส่งแบบฝึกหัดครบ 3 ครั้งขึ้นไป"
  }
};
