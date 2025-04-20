import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Target, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    deadline: format(new Date(), "yyyy-MM-dd"),
    category: "revenue",
  });

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  // Add new goal
  const addGoal = useMutation({
    mutationFn: (goal: { 
      title: string; 
      targetAmount: number; 
      deadline: string; 
      category: string 
    }) => {
      return apiRequest('POST', '/api/goals', goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setShowNewGoalForm(false);
      setNewGoal({
        title: "",
        targetAmount: "",
        deadline: format(new Date(), "yyyy-MM-dd"),
        category: "revenue",
      });
      
      toast({
        title: "Goal created",
        description: "Your new goal has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create goal",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.title || !newGoal.targetAmount) return;
    
    addGoal.mutate({
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      deadline: newGoal.deadline,
      category: newGoal.category,
    });
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue':
        return 'bg-secondary-500';
      case 'accounts':
        return 'bg-primary-500';
      case 'activities':
        return 'bg-accent-500';
      default:
        return 'bg-neutral-500';
    }
  };

  // Format category label
  const formatCategory = (category: string) => {
    switch (category) {
      case 'revenue':
        return 'Revenue';
      case 'accounts':
        return 'Accounts';
      case 'activities':
        return 'Activities';
      default:
        return category;
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Goals & Targets</h1>
          <p className="text-neutral-600 mt-1">Track your progress and set new sales targets</p>
        </div>
        
        <Button 
          onClick={() => setShowNewGoalForm(true)}
          className="mt-4 md:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Goal
        </Button>
      </div>
      
      {showNewGoalForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
            <CardDescription>Set a specific, measurable target with a deadline</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Monthly Sales Target"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="e.g., 100000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal({...newGoal, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="accounts">Accounts</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewGoalForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addGoal.isPending}>
                {addGoal.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">No Goals Set Yet</h2>
          <p className="text-neutral-500 mb-6">Create your first goal to start tracking your progress</p>
          <Button 
            onClick={() => setShowNewGoalForm(true)}
            className="mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount);
            
            return (
              <Card key={goal.id} className="overflow-hidden">
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
                        className="h-8 w-8 text-destructive"
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
                    <span className="text-sm text-neutral-500">
                      {formatCategory(goal.category)}
                    </span>
                    <span className="text-sm font-medium">
                      {percentage}% Complete
                    </span>
                  </div>
                  
                  <Progress 
                    value={percentage} 
                    className={`h-2 mb-3 ${getCategoryColor(goal.category)}`} 
                  />
                  
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-neutral-500">Current</span>
                      <span className="text-sm text-neutral-500">Target</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">
                        {goal.category === 'revenue' 
                          ? formatCurrency(goal.currentAmount) 
                          : goal.currentAmount}
                      </span>
                      <span className="text-lg font-semibold">
                        {goal.category === 'revenue' 
                          ? formatCurrency(goal.targetAmount) 
                          : goal.targetAmount}
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
