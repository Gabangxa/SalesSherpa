import { useState, useCallback, useEffect } from "react";
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
import { calculatePercentage, isIncreaseGoal, cn } from "@/lib/utils";
import { getCategoryColor, formatCategory, formatGoalValue, getProgressDisplayText, getProgressColor } from "@/lib/goalUtils";
import { format } from "date-fns";
import { Plus, Target, Edit, Trash2, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GoalDialog } from "@/components/dialogs/GoalDialog";
import { Goal } from "@shared/schema";
import { webSocketService, WebSocketMessageType } from "@/lib/websocketService";

export default function GoalsPage() {
  const { toast } = useToast();
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Optimized event handlers with useCallback
  const handleEditGoal = useCallback((goal: Goal) => {
    setEditingGoal(goal);
  }, []);
  
  const handleCloseEditDialog = useCallback((open: boolean) => {
    if (!open) setEditingGoal(null);
  }, []);
  
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
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete goal
  const deleteGoal = useMutation({
    mutationFn: (goalId: number) => {
      return apiRequest('DELETE', `/api/goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuickProgressUpdate = useCallback((goal: Goal) => {
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
  }, [updateGoalProgress]);
  
  const handleDeleteGoal = useCallback((goalId: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoal.mutate(goalId);
    }
  }, [deleteGoal]);

  // Fetch goals (longer stale time since we get real-time updates via WebSocket)
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
        console.log(`Received WebSocket goal notification: ${payload.type}`, payload);
        
        // Refresh goals data to show the changes
        queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      }
    });
    
    console.log('GoalsPage: Subscribed to WebSocket goal notifications');
    
    return () => {
      unsubscribe();
      console.log('GoalsPage: Unsubscribed from WebSocket goal notifications');
    };
  }, []);

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
      
      {/* Edit Goal Dialog */}
      {editingGoal && (
        <GoalDialog 
          goal={editingGoal}
          open={!!editingGoal}
          onOpenChange={handleCloseEditDialog}
          trigger={<div />} // Hidden trigger since we control open state
        />
      )}
      
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
            const isIncrease = isIncreaseGoal(goal.targetAmount, startingAmount);
            const isNegative = percentage < 0;
            const progressText = getProgressDisplayText(percentage, goal.targetAmount, startingAmount);
            const progressColorClass = getProgressColor(percentage, goal.targetAmount, startingAmount);
            
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
                        onClick={() => handleQuickProgressUpdate(goal)}
                        title="Quick progress update"
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditGoal(goal)}
                        title="Edit goal details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                        onClick={() => handleDeleteGoal(goal.id)}
                        title="Delete goal"
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
                      progressColorClass
                    )}>
                      {progressText} {isIncrease ? '📈' : '📉'}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.max(0, percentage)} 
                    className="h-2 mb-3" 
                    indicatorClassName={isNegative ? "bg-red-500" : getCategoryColor(goal.category)}
                  />
                  
                  {isNegative && (
                    <div className="text-xs text-red-500 mb-2">
                      ⚠️ {isIncrease ? 'Below starting point' : 'Above starting point'} by {Math.abs(percentage)}%
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
                            {formatGoalValue(startingAmount, goal.valueType || 'number')} → {formatGoalValue(goal.currentAmount, goal.valueType || 'number')}
                          </span>
                        ) : (
                          formatGoalValue(goal.currentAmount, goal.valueType || 'number')
                        )}
                      </span>
                      <span className="text-lg font-semibold">
                        {formatGoalValue(goal.targetAmount, goal.valueType || 'number')}
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
