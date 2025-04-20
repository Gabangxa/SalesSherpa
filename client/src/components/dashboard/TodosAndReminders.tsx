import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TimeOffDialog } from "@/components/dialogs/TimeOffDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  completed: boolean;
  dueDate: string | null;
}

export default function TodosAndReminders() {
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Toggle task completion
  const toggleTaskCompletion = useMutation({
    mutationFn: (params: { id: number; completed: boolean }) => {
      return apiRequest('PATCH', `/api/tasks/${params.id}`, {
        completed: params.completed
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });

  // Add new task
  const addTask = useMutation({
    mutationFn: (task: { title: string; description: string; priority: string }) => {
      return apiRequest('POST', '/api/tasks', task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setNewTaskTitle("");
      setNewTaskDescription("");
    }
  });

  // Handle add task
  const handleAddTask = () => {
    if (newTaskTitle.trim() === '') return;

    addTask.mutate({
      title: newTaskTitle,
      description: newTaskDescription,
      priority: 'medium', // Default priority
    });
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-800 hover:bg-neutral-100">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="col-span-1">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today's Focus</CardTitle>
        </CardHeader>
        
        {isLoading ? (
          <CardContent>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </CardContent>
        ) : (
          <>
            <div className="divide-y divide-neutral-200">
              {tasks.length === 0 ? (
                <CardContent>
                  <p className="text-center text-neutral-500 py-4">No tasks for today</p>
                </CardContent>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <Checkbox 
                          checked={task.completed} 
                          onCheckedChange={(checked) => {
                            toggleTaskCompletion.mutate({ 
                              id: task.id, 
                              completed: checked as boolean 
                            });
                          }}
                        />
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-neutral-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="ml-auto">
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <CardFooter className="border-t border-neutral-200 p-6">
              <div className="space-y-3 w-full">
                <Input
                  placeholder="Add a new task..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <Button 
                  onClick={handleAddTask} 
                  className="w-full bg-primary-50 text-primary-700 hover:bg-primary-100"
                  disabled={newTaskTitle.trim() === '' || addTask.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Task
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Schedule Time Off</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                type="date" 
                id="start-date" 
                className="mt-1" 
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input 
                type="date" 
                id="end-date" 
                className="mt-1" 
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                rows={2} 
                className="mt-1" 
                placeholder="Reason for time off (optional)"
              />
            </div>
            
            <Button 
              className="bg-secondary-600 hover:bg-secondary-700"
              onClick={() => setTimeOffDialogOpen(true)}
            >
              Schedule Time Off
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <TimeOffDialog 
        open={timeOffDialogOpen} 
        onOpenChange={setTimeOffDialogOpen} 
      />
    </div>
  );
}
