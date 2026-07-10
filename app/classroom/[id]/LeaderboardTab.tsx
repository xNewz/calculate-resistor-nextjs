import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardTabProps {
  enrollments: any[];
  currentUserId?: string;
}

export function LeaderboardTab({ enrollments, currentUserId }: LeaderboardTabProps) {
  // Sort enrollments by EXP descending
  const sortedEnrollments = [...enrollments].sort((a, b) => (b.exp || 0) - (a.exp || 0));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="size-8 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            กระดานผู้นำ (Leaderboard)
          </CardTitle>
          <CardDescription className="text-zinc-500 text-base mt-2">
            อันดับนักเรียนที่มีคะแนนประสบการณ์ (EXP) สูงสุดในห้องเรียน
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                <TableRow>
                  <TableHead className="w-[100px] text-center font-bold">อันดับ</TableHead>
                  <TableHead className="font-bold">ผู้เรียน</TableHead>
                  <TableHead className="text-right font-bold pr-6">EXP สะสม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-zinc-500">
                      ยังไม่มีข้อมูลผู้เรียน
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEnrollments.map((enrollment, index) => {
                    const rank = index + 1;
                    const exp = enrollment.exp || 0;
                    const isCurrentUser = currentUserId === enrollment.userId;
                    const isTop3 = rank <= 3;

                    return (
                      <TableRow 
                        key={enrollment.id}
                        className={cn(
                          "transition-colors",
                          rank === 1 && "bg-amber-50/30 hover:bg-amber-100/30 dark:bg-amber-500/5 dark:hover:bg-amber-500/10",
                          rank === 2 && "bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50",
                          rank === 3 && "bg-orange-50/30 hover:bg-orange-100/40 dark:bg-orange-500/5 dark:hover:bg-orange-500/10"
                        )}
                      >
                        <TableCell className="font-medium text-center py-4">
                          <div className={cn(
                            "flex items-center justify-center size-8 rounded-full mx-auto font-bold text-sm",
                            rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                            rank === 2 ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" :
                            rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                            "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                          )}>
                            {rank === 1 ? <Trophy className="size-4" /> : 
                             rank === 2 ? <Medal className="size-4" /> : 
                             rank === 3 ? <Award className="size-4" /> : 
                             rank}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800">
                              <AvatarImage src={enrollment.user.image || ""} alt={enrollment.user.name} className="object-cover" />
                              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase">
                                {enrollment.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-semibold text-sm",
                                rank === 1 ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-100"
                              )}>
                                {enrollment.user.name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold border border-indigo-200 dark:border-indigo-800">
                                    คุณ
                                  </span>
                                )}
                              </span>
                              {isTop3 && exp > 0 && (
                                <span className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1 font-medium mt-0.5">
                                  <Flame className="size-3" /> มาแรง
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6">
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                              "text-xl font-black tabular-nums tracking-tight",
                              rank === 1 ? "text-amber-600 dark:text-amber-500" : "text-indigo-600 dark:text-indigo-400"
                            )}>
                              {exp.toLocaleString()}
                            </span>
                            <Badge variant="outline" className={cn(
                               "uppercase text-[9px] px-1.5 py-0 h-4 font-bold rounded-sm border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
                               rank === 1 && "border-amber-200 text-amber-600 dark:border-amber-900 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/50"
                            )}>
                              EXP
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
