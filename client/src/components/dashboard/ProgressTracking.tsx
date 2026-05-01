import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { calculatePercentage, isIncreaseGoal, cn } from "@/lib/utils";
import { formatGoalValue, getCategoryGradient, getProgressDisplayText, getProgressColor } from "@/lib/goalUtils";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Goal } from "@shared/schema";
import { webSocketService, WebSocketMessageType } from "@/lib/websocketService";

export default function ProgressTracking() {
  const [, navigate] = useLocation();

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    if (webSocketService.getStatus() === "CLOSED") {
      webSocketService.connect();
    }
    const unsubscribe = webSocketService.on(WebSocketMessageType.NOTIFICATION, (payload) => {
      if (["goal_created", "goal_updated", "goal_deleted"].includes(payload.type)) {
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      }
    });
    return () => unsubscribe();
  }, []);

  const totalGoals = goals.length;
  const completedGoals = goals.filter(
    (g) => calculatePercentage(g.currentAmount, g.targetAmount, g.startingAmount ?? 0) >= 100
  ).length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-earth/20 dark:border-earth/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-clay/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-clay" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-forest dark:text-parchment">
            Goals Progress
          </h2>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-clay" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-earth/20 dark:border-earth/10 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-clay/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-clay" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-forest dark:text-parchment">
            Goals Progress
          </h2>
        </div>
        <Button
          onClick={() => navigate("/goals")}
          size="sm"
          variant="outline"
          className="border-earth/30 text-forest dark:text-parchment hover:bg-earth/10 rounded-full text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-10 w-10 text-earth/40 mx-auto mb-3" />
          <p className="text-sm text-forest/50 dark:text-parchment/50 mb-4">No goals set yet</p>
          <Button
            onClick={() => navigate("/goals")}
            className="bg-clay hover:bg-clay/90 text-white rounded-full text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Goal
          </Button>
        </div>
      ) : (
        <>
          {/* Overall summary */}
          <div className="mb-5 p-4 rounded-2xl bg-forest dark:bg-forest/70">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-parchment/70 uppercase tracking-widest">
                Overall Progress
              </p>
              <span className="text-sm font-bold text-parchment">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-1.5 bg-white/10" />
            <p className="text-[10px] text-parchment/50 mt-2">
              {completedGoals} of {totalGoals} goals completed
            </p>
          </div>

          {/* Individual goals */}
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => {
              const startingAmount = goal.startingAmount ?? 0;
              const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount, startingAmount);
              const isIncrease = isIncreaseGoal(goal.targetAmount, startingAmount);
              const isNegative = percentage < 0;
              const progressText = getProgressDisplayText(percentage, goal.targetAmount, startingAmount);
              const progressColorClass = getProgressColor(percentage, goal.targetAmount, startingAmount);

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl p-4 bg-cream dark:bg-dark-bg/50 border border-earth/15 dark:border-earth/10 relative overflow-hidden"
                >
                  <div className={cn("absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r", getCategoryGradient(goal.category))} />
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-forest dark:text-parchment truncate mr-2">
                      {goal.title}
                    </h3>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                      isNegative
                        ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                        : percentage >= 90
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : percentage >= 60
                        ? "bg-clay/10 text-clay"
                        : "bg-earth/10 text-earth dark:text-earth/80"
                    )}>
                      {percentage}%
                    </span>
                  </div>
                  <Progress value={Math.max(0, percentage)} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between text-[10px] text-forest/50 dark:text-parchment/50">
                    <span className={cn("text-[10px]", progressColorClass)}>
                      {isNegative
                        ? `⚠ ${isIncrease ? "Below" : "Above"} start`
                        : `${isIncrease ? "↑" : "↓"} ${progressText}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {goal.deadline ? format(new Date(goal.deadline), "MMM d") : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {goals.length > 3 && (
            <div className="mt-4 text-center">
              <Button
                onClick={() => navigate("/goals")}
                variant="outline"
                className="rounded-full border-earth/30 text-forest dark:text-parchment text-xs hover:bg-earth/10"
              >
                View All {goals.length} Goals
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
