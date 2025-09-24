import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { calculatePercentage, isIncreaseGoal, cn } from "@/lib/utils";
import { formatGoalValue, getCategoryGradient, getBadgeColor, getProgressDisplayText, getProgressColor } from "@/lib/goalUtils";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { Goal } from "@shared/schema";
import { webSocketService, WebSocketMessageType } from "@/lib/websocketService";

// Moved to shared utilities

export default function ProgressTracking() {
  const [, navigate] = useLocation();
  
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    staleTime: 1000 * 60 * 15, // 15 minutes - longer since WebSocket provides real-time updates
  });
  
  // Listen for WebSocket goal update notifications
  useEffect(() => {
    // Connect to WebSocket service if not already connected
    if (webSocketService.getStatus() === 'CLOSED') {
      webSocketService.connect();
    }
    
    // Subscribe to NOTIFICATION type WebSocket messages for goal updates
    const unsubscribe = webSocketService.on(WebSocketMessageType.NOTIFICATION, (payload) => {
      if (['goal_created', 'goal_updated', 'goal_deleted'].includes(payload.type)) {
        console.log(`ProgressTracking: Received WebSocket goal notification: ${payload.type}`);
        
        // Refresh goals data to show the changes in real-time
        queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      }
    });
    
    console.log('ProgressTracking: Subscribed to WebSocket goal notifications');
    
    return () => {
      unsubscribe();
      console.log('ProgressTracking: Unsubscribed from WebSocket goal notifications');
    };
  }, []);

  // Moved to shared utilities

  // Calculate overall progress (works for both increase and decrease goals)
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => 
    calculatePercentage(goal.currentAmount, goal.targetAmount, goal.startingAmount ?? 0) >= 100
  ).length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10">
        <CardHeader className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-sm border-b border-white/10">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-white">
            <Target className="h-6 w-6" />
            Performance Tracking Centre
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/20">
      <CardHeader className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-sm border-b border-white/10 pb-6">
        <CardTitle className="text-xl font-bold flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            Performance Tracking Centre
          </div>
          <Button
            onClick={() => navigate('/goals')}
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No goals set yet</p>
            <Button
              onClick={() => navigate('/goals')}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <>
            {/* Overall Progress Summary */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300">Overall Progress</h3>
                <Badge className={cn(
                  "font-bold text-xs px-3 py-1 rounded-full",
                  overallProgress >= 90 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : 
                  overallProgress >= 70 ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : 
                  "bg-gray-600/20 text-gray-300 border-gray-500/30"
                )}>
                  {overallProgress}%
                </Badge>
              </div>
              <Progress value={overallProgress} className="h-2 mb-2" />
              <p className="text-xs text-gray-400">
                {completedGoals} of {totalGoals} goals completed
              </p>
            </div>

            {/* Individual Goals */}
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                // Handle legacy goals without startingAmount field
                const startingAmount = goal.startingAmount ?? 0;
                const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount, startingAmount);
                const isIncrease = isIncreaseGoal(goal.targetAmount, startingAmount);
                const isNegative = percentage < 0;
                const progressText = getProgressDisplayText(percentage, goal.targetAmount, startingAmount);
                const progressColorClass = getProgressColor(percentage, goal.targetAmount, startingAmount);
                
                return (
                  <div key={goal.id} className="rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/20 relative overflow-hidden">
                    <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", getCategoryGradient(goal.category))}></div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300 truncate">{goal.title}</h3>
                      <Badge className={cn(
                        "font-bold text-xs px-2 py-1 rounded-full",
                        isNegative ? "bg-red-500/20 text-red-300 border-red-500/30" :
                        percentage >= 90 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : 
                        percentage >= 70 ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : 
                        "bg-gray-600/20 text-gray-300 border-gray-500/30"
                      )}>
                        {percentage}% {isIncrease ? '📈' : '📉'}
                      </Badge>
                    </div>
                    <Progress value={Math.max(0, percentage)} className="h-2 mb-2" />
                    <div className={cn("text-xs mb-1", progressColorClass)}>
                      {isNegative ? (
                        `⚠️ ${isIncrease ? 'Below starting point' : 'Above starting point'} by ${Math.abs(percentage)}%`
                      ) : (
                        `${isIncrease ? '📈' : '📉'} ${progressText}`
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {startingAmount > 0 
                          ? `${formatGoalValue(startingAmount, goal.valueType || 'number')} → ${formatGoalValue(goal.currentAmount, goal.valueType || 'number')} / ${formatGoalValue(goal.targetAmount, goal.valueType || 'number')}`
                          : `${formatGoalValue(goal.currentAmount, goal.valueType || 'number')} / ${formatGoalValue(goal.targetAmount, goal.valueType || 'number')}`
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(goal.deadline), 'MMM d')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {goals.length > 3 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => navigate('/goals')}
                  variant="outline"
                  className="bg-white/5 hover:bg-white/10 text-white border-white/20"
                >
                  View All {goals.length} Goals
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

