import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Target, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GoalDialog } from "@/components/dialogs/GoalDialog";

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export default function GoalsPage() {
  const { toast } = useToast();
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  // Update goal progress
  const updateGoalProgress = useMutation({
    mutationFn: (params: { id: number; currentAmount: number }) => {
      return apiRequest('PATCH', `/api/goals/${params.id}`, {
        currentAmount: params.currentAmount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
      toast({
        title: "Progress updated",
        description: "Your goal progress has been updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update progress",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Delete goal
  const deleteGoal = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/goals/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
      toast({
        title: "Goal deleted",
        description: "The goal has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete goal",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return 'bg-primary';
      case 'meetings':
        return 'bg-blue-500';
      case 'leads':
        return 'bg-green-500';
      case 'revenue':
        return 'bg-amber-500';
      case 'clients':
        return 'bg-purple-500';
      default:
        return 'bg-primary';
    }
  };

  // Format category label
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals & Targets</h1>
          <p className="text-muted-foreground mt-1">Track your progress and set new sales targets</p>
        </div>
        
        <GoalDialog 
          trigger={
            <Button className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Create New Goal
            </Button>
          }
          open={isGoalDialogOpen}
          onOpenChange={setIsGoalDialogOpen}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Goals Set Yet</h2>
          <p className="text-muted-foreground mb-6">Create your first goal to start tracking your progress</p>
          <Button 
            onClick={() => setIsGoalDialogOpen(true)}
            className="mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            // Handle legacy goals without startingAmount field
            const startingAmount = goal.startingAmount ?? 0;
            const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount, startingAmount);
            const isNegative = percentage < 0;
            
            return (
              <Card key={goal.id} className="overflow-hidden border-border/60 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle>{goal.title}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          const newAmount = prompt("Update progress:", goal.currentAmount.toString());
                          if (newAmount !== null) {
                            const parsedAmount = parseFloat(newAmount);
                            if (!isNaN(parsedAmount)) {
                              updateGoalProgress.mutate({
                                id: goal.id,
                                currentAmount: parsedAmount
                              });
                            }
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this goal?")) {
                            deleteGoal.mutate(goal.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Due by {format(new Date(goal.deadline), "MMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">
                      {formatCategory(goal.category)}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isNegative ? "text-red-500" : ""
                    )}>
                      {percentage}% {isNegative ? "(Below Starting Point)" : "Complete"}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.max(0, percentage)} 
                    className="h-2 mb-3" 
                    indicatorClassName={isNegative ? "bg-red-500" : getCategoryColor(goal.category)}
                  />
                  
                  {isNegative && (
                    <div className="text-xs text-red-500 mb-2">
                      ⚠️ Below starting point by {Math.abs(percentage)}%
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        {startingAmount > 0 ? "Starting" : "Current"}
                      </span>
                      <span className="text-sm text-muted-foreground">Target</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">
                        {startingAmount > 0 ? (
                          <span>
                            {goal.valueType === 'monetary' ? formatCurrency(startingAmount) : 
                             goal.valueType === 'percentage' ? `${startingAmount}%` : 
                             startingAmount} → {goal.valueType === 'monetary' ? formatCurrency(goal.currentAmount) : 
                             goal.valueType === 'percentage' ? `${goal.currentAmount}%` : 
                             goal.currentAmount}
                          </span>
                        ) : (
                          goal.valueType === 'monetary' ? formatCurrency(goal.currentAmount) : 
                          goal.valueType === 'percentage' ? `${goal.currentAmount}%` : 
                          goal.currentAmount
                        )}
                      </span>
                      <span className="text-lg font-semibold">
                        {goal.valueType === 'monetary' ? formatCurrency(goal.targetAmount) : 
                         goal.valueType === 'percentage' ? `${goal.targetAmount}%` : 
                         goal.targetAmount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
