import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Sparkles, TrendingUp } from "lucide-react";
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
      {/* Premium Header Card */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-black text-white">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-20"></div>

        <CardHeader className="relative z-10 pb-8 text-center pt-10">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative size-20 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-600 border border-amber-300/50 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                <Trophy className="size-10 text-amber-950 drop-shadow-md" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Hall of Fame
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm max-w-md mx-auto mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="size-3 text-indigo-400" />
            กระดานผู้นำและนักเรียนที่มีคะแนนประสบการณ์สูงสุด
            <Sparkles className="size-3 text-indigo-400" />
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 p-0 sm:p-6 sm:pt-0">
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-inner">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[100px] text-center font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Rank</TableHead>
                  <TableHead className="font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Student</TableHead>
                  <TableHead className="text-right font-semibold text-zinc-400 uppercase tracking-widest text-[10px] pr-8">Experience</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-16 text-zinc-500">
                      ยังไม่มีข้อมูลผู้เรียนในขณะนี้
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEnrollments.map((enrollment, index) => {
                    const rank = index + 1;
                    const exp = enrollment.exp || 0;
                    const isCurrentUser = currentUserId === enrollment.userId;

                    let rankStyle = "bg-zinc-800/50 text-zinc-400";
                    let rowStyle = "hover:bg-white/5 border-white/5";
                    let icon = <span className="font-bold">{rank}</span>;

                    if (rank === 1) {
                      rankStyle = "bg-gradient-to-br from-yellow-300 to-amber-600 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
                      rowStyle = "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20";
                      icon = <Trophy className="size-4" />;
                    } else if (rank === 2) {
                      rankStyle = "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-800 shadow-[0_0_15px_rgba(161,161,170,0.3)]";
                      rowStyle = "bg-zinc-400/5 hover:bg-zinc-400/10 border-zinc-400/20";
                      icon = <Medal className="size-4" />;
                    } else if (rank === 3) {
                      rankStyle = "bg-gradient-to-br from-orange-300 to-orange-700 text-orange-950 shadow-[0_0_15px_rgba(234,88,12,0.3)]";
                      rowStyle = "bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20";
                      icon = <Award className="size-4" />;
                    }

                    if (isCurrentUser) {
                      rowStyle += " bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30";
                    }

                    return (
                      <TableRow 
                        key={enrollment.id}
                        className={cn(
                          "transition-all duration-300",
                          rowStyle,
                          isCurrentUser && "relative z-10"
                        )}
                      >
                        <TableCell className="text-center py-4">
                          <div className={cn(
                            "flex items-center justify-center size-8 rounded-full mx-auto",
                            rankStyle
                          )}>
                            {icon}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11 border-2 border-white/10 shadow-lg bg-zinc-900">
                              <AvatarImage src={enrollment.user.image || ""} alt={enrollment.user.name} className="object-cover" />
                              <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold uppercase">
                                {enrollment.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-bold text-sm",
                                isCurrentUser ? "text-indigo-300" : "text-zinc-100"
                              )}>
                                {enrollment.user.name}
                                {isCurrentUser && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium border border-indigo-500/30">You</span>}
                              </span>
                              
                              {exp > 0 && rank <= 3 && (
                                <span className="text-[10px] text-amber-400/80 font-medium flex items-center gap-1 mt-0.5">
                                  <TrendingUp className="size-3" /> Top Player
                                </span>
                              )}
                              {exp === 0 && (
                                <span className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                  ยังไม่มีคะแนน
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4 pr-8">
                          <div className="flex flex-col items-end justify-center">
                            <span className={cn(
                              "text-2xl font-black tabular-nums tracking-tight",
                              rank === 1 ? "bg-clip-text text-transparent bg-gradient-to-br from-yellow-300 to-amber-600" :
                              rank === 2 ? "bg-clip-text text-transparent bg-gradient-to-br from-zinc-200 to-zinc-500" :
                              rank === 3 ? "bg-clip-text text-transparent bg-gradient-to-br from-orange-300 to-orange-600" :
                              "text-zinc-100"
                            )}>
                              {exp.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                              EXP Points
                            </span>
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
