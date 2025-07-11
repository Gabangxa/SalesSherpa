import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Goal } from "@shared/schema";
import { GOAL_CATEGORIES, getFieldLabels } from "@/lib/goalUtils";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z.coerce.number().int("Target must be a whole number").positive("Target must be a positive number"),
  currentAmount: z.coerce.number().int("Current amount must be a whole number").min(0, "Current amount must be 0 or greater"),
  startingAmount: z.coerce.number().int("Starting amount must be a whole number").min(0, "Starting amount must be 0 or greater"),
  deadline: z.string().min(1, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
  valueType: z.enum(["monetary", "number", "percentage"], {
    required_error: "Please select a value type",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface GoalFormProps {
  goal?: Goal; // Optional goal for editing
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Get today's date in the format YYYY-MM-DD for the default deadline
  const today = new Date().toISOString().split('T')[0];
  
  // Setup the form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: goal ? {
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      startingAmount: goal.startingAmount ?? 0,
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      category: goal.category,
      valueType: goal.valueType ?? "number",
    } : {
      title: "",
      targetAmount: 10,
      currentAmount: 0,
      startingAmount: 0,
      deadline: today,
      category: "sales",
      valueType: "number",
    },
  });
  
  // Setup the mutation for creating/updating a goal
  const saveGoalMutation = useMutation({
    mutationFn: (values: FormValues) => {
      setLoading(true);
      // Convert string date to a proper Date object
      const deadlineDate = new Date(values.deadline + 'T23:59:59');
      
      const payload = {
        title: values.title,
        targetAmount: parseInt(values.targetAmount.toString()),
        currentAmount: parseInt(values.currentAmount.toString()),
        startingAmount: parseInt(values.startingAmount.toString()),
        deadline: deadlineDate,
        category: values.category,
        valueType: values.valueType
      };
      
      // Use PATCH for editing, POST for creating
      if (goal) {
        return apiRequest('PATCH', `/api/goals/${goal.id}`, payload);
      } else {
        return apiRequest('POST', '/api/goals', payload);
      }
    },
    onSuccess: () => {
      setLoading(false);
      toast({
        title: goal ? "Goal updated successfully" : "Goal created successfully",
        description: goal ? "Your goal has been updated" : "Your goal has been added to your dashboard",
      });
      
      // Invalidate the goals query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      setLoading(false);
      toast({
        variant: "destructive",
        title: goal ? "Failed to update goal" : "Failed to create goal",
        description: error instanceof Error ? error.message : "Please check all fields and try again",
      });
      console.error("Goal save error:", error);
    },
  });
  
  // Handle form submission
  function onSubmit(values: FormValues) {
    saveGoalMutation.mutate(values);
  }
  
  // Categories moved to shared utilities

  // Watch the valueType to update field labels
  const valueType = form.watch("valueType");
  const fieldLabels = getFieldLabels(valueType);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Increase monthly sales by 20%" {...field} />
              </FormControl>
              <FormDescription>
                Enter a clear, specific goal that you want to achieve
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="startingAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldLabels.starting}</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormDescription>
                  {fieldLabels.startingDesc}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldLabels.current}</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormDescription>
                  {fieldLabels.currentDesc}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldLabels.target}</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
                </FormControl>
                <FormDescription>
                  {fieldLabels.targetDesc}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="valueType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monetary">💰 Monetary (e.g., $50,000)</SelectItem>
                  <SelectItem value="number">🔢 Number (e.g., 10 meetings)</SelectItem>
                  <SelectItem value="percentage">📊 Percentage (e.g., 25%)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How should the target and progress be measured?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <Input type="date" min={today} {...field} />
                </FormControl>
                <FormDescription>
                  When do you aim to achieve this goal?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GOAL_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  What area does this goal relate to?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? (goal ? 'Updating...' : 'Creating...') : (goal ? 'Update Goal' : 'Create Goal')}
          </Button>
        </div>
      </form>
    </Form>
  );
}