import { Trophy, Flame, Star, ChevronRight } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const AchievementBadge = () => {
  const { achievements, stats, isLoading, getProgress, isUnlocked } = useAchievements();

  const unlockedCount = achievements.filter(a => isUnlocked(a.id)).length;
  const totalCount = achievements.length;
  const overallProgress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // Get next achievement to unlock
  const nextAchievement = achievements.find(a => !isUnlocked(a.id));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors group">
          <div className="relative">
            <Trophy className="w-4 h-4 text-amber-500" />
            {unlockedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {unlockedCount}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 font-serif">
            <Trophy className="w-5 h-5 text-amber-500" />
            Logros
          </SheetTitle>
        </SheetHeader>

        {/* Overall progress */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso total</span>
            <span className="text-sm text-muted-foreground">{unlockedCount}/{totalCount}</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <div className="text-xl font-bold text-foreground">{stats.total_entries}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Notas</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xl font-bold text-foreground">{stats.current_streak}</span>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Racha</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xl font-bold text-foreground">{stats.longest_streak}</span>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Mejor</div>
            </div>
          </div>
        )}

        {/* Next achievement hint */}
        {nextAchievement && (
          <div className="mb-4 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{nextAchievement.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground">Próximo logro</p>
                <p className="text-xs text-muted-foreground">{nextAchievement.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <Progress value={getProgress(nextAchievement) * 100} className="h-1 mt-2" />
          </div>
        )}

        {/* Achievement list */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Todos los logros
          </h4>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Cargando...
            </div>
          ) : (
            achievements.map((achievement) => {
              const unlocked = isUnlocked(achievement.id);
              const progress = getProgress(achievement);
              const progressValue = Math.round(progress * 100);

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    unlocked
                      ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                      : "bg-muted/30 opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "text-xl p-2 rounded-lg shrink-0",
                      unlocked ? "bg-amber-500/20" : "bg-muted grayscale"
                    )}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        unlocked ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {achievement.name}
                      </span>
                      {unlocked && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {achievement.description}
                    </p>
                    {!unlocked && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progressValue} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {progressValue}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
