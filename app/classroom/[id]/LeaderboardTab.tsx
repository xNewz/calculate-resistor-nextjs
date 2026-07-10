import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardTabProps {
  enrollments: any[];
}

export function LeaderboardTab({ enrollments }: LeaderboardTabProps) {
  // Sort enrollments by EXP descending
  const sortedEnrollments = [...enrollments].sort((a, b) => (b.exp || 0) - (a.exp || 0));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 backdrop-blur-xl shadow-lg">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="size-8 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            กระดานผู้นำ (Leaderboard)
          </CardTitle>
          <CardDescription className="text-zinc-500 text-base">
            อันดับนักเรียนที่มีคะแนนสะสม (EXP) สูงสุดในห้องเรียน
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {sortedEnrollments.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                ยังไม่มีข้อมูลผู้เรียน
              </div>
            ) : (
              sortedEnrollments.map((enrollment, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const exp = enrollment.exp || 0;

                return (
                  <div
                    key={enrollment.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                      rank === 1
                        ? "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 shadow-md shadow-amber-500/10"
                        : rank === 2
                        ? "bg-zinc-50 dark:bg-zinc-500/5 border-zinc-300 dark:border-zinc-600/30 shadow-sm"
                        : rank === 3
                        ? "bg-orange-50 dark:bg-orange-700/5 border-orange-200 dark:border-orange-700/30 shadow-sm"
                        : "bg-white dark:bg-zinc-950/50 border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Number / Icon */}
                      <div
                        className={cn(
                          "flex items-center justify-center size-10 rounded-full font-bold text-lg",
                          rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                          rank === 2 ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300" :
                          rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                          "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {rank === 1 ? <Trophy className="size-5" /> : 
                         rank === 2 ? <Medal className="size-5" /> : 
                         rank === 3 ? <Award className="size-5" /> : 
                         rank}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                          {enrollment.user.image ? (
                            <img
                              src={enrollment.user.image}
                              alt={enrollment.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-semibold uppercase">
                              {enrollment.user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={cn(
                            "font-bold text-base",
                            rank === 1 ? "text-amber-700 dark:text-amber-400" :
                            "text-zinc-900 dark:text-zinc-100"
                          )}>
                            {enrollment.user.name}
                          </p>
                          {isTop3 && exp > 0 && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                              <Flame className="size-3 text-orange-500" />
                              มาแรง!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* EXP Score */}
                    <div className="flex flex-col items-end">
                      <div className={cn(
                        "text-xl font-black tabular-nums tracking-tight",
                        rank === 1 ? "text-amber-600 dark:text-amber-500" :
                        "text-indigo-600 dark:text-indigo-400"
                      )}>
                        {exp.toLocaleString()}
                      </div>
                      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        EXP
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
