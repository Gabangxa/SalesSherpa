import { useQuery } from "@tanstack/react-query";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

const getBadgeColor = (percentage: number) => {
  if (percentage >= 90) return "accent";
  if (percentage >= 70) return "primary";
  return "secondary";
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'sales':
      return 'from-emerald-500 to-teal-500';
    case 'meetings':
      return 'from-blue-500 to-indigo-500';
    case 'leads':
      return 'from-green-500 to-emerald-500';
    case 'revenue':
      return 'from-amber-500 to-orange-500';
    case 'clients':
      return 'from-purple-500 to-pink-500';
    case 'accounts':
      return 'from-cyan-500 to-blue-500';
    case 'activities':
      return 'from-rose-500 to-red-500';
    default:
      return 'from-slate-500 to-gray-500';
  }
};

export default function ProgressTracking() {
  const [, navigate] = useLocation();
  
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  // Calculate overall progress
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => 
    calculatePercentage(goal.currentAmount, goal.targetAmount) >= 100
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
                const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount);
                const isMonetary = goal.category === 'revenue' || goal.title.toLowerCase().includes('revenue') || goal.title.toLowerCase().includes('sales');
                
                return (
                  <div key={goal.id} className="rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/20 relative overflow-hidden">
                    <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", getCategoryColor(goal.category))}></div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300 truncate">{goal.title}</h3>
                      <Badge className={cn(
                        "font-bold text-xs px-2 py-1 rounded-full",
                        percentage >= 90 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : 
                        percentage >= 70 ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : 
                        "bg-gray-600/20 text-gray-300 border-gray-500/30"
                      )}>
                        {percentage}%
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {isMonetary ? formatCurrency(goal.currentAmount) : goal.currentAmount} / {isMonetary ? formatCurrency(goal.targetAmount) : goal.targetAmount}
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

