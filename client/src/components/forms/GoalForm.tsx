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

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z.coerce.number().int("Target must be a whole number").positive("Target must be a positive number"),
  currentAmount: z.coerce.number().int("Current amount must be a whole number").min(0, "Current amount must be 0 or greater"),
  deadline: z.string().min(1, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface GoalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GoalForm({ onSuccess, onCancel }: GoalFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Get today's date in the format YYYY-MM-DD for the default deadline
  const today = new Date().toISOString().split('T')[0];
  
  // Setup the form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      targetAmount: 10,
      currentAmount: 0,
      deadline: today,
      category: "sales",
    },
  });
  
  // Setup the mutation for creating a goal
  const createGoalMutation = useMutation({
    mutationFn: (values: FormValues) => {
      setLoading(true);
      // Convert string date to ISO date format required by the API
      const deadlineDate = new Date(values.deadline + 'T23:59:59');
      
      // Ensure all required fields are present and properly formatted
      // Note: userId is now handled by the server from the session
      return apiRequest('POST', '/api/goals', {
        title: values.title,
        targetAmount: parseInt(values.targetAmount.toString()), // Ensure it's an integer
        currentAmount: parseInt(values.currentAmount.toString()), // Ensure it's an integer
        deadline: deadlineDate.toISOString(),
        category: values.category
      });
    },
    onSuccess: () => {
      setLoading(false);
      toast({
        title: "Goal created successfully",
        description: "Your goal has been added to your dashboard",
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
        title: "Failed to create goal",
        description: error instanceof Error ? error.message : "Please check all fields and try again",
      });
      console.error("Goal creation error:", error);
    },
  });
  
  // Handle form submission
  function onSubmit(values: FormValues) {
    createGoalMutation.mutate(values);
  }
  
  // Categories for the select dropdown
  const categories = [
    { value: "sales", label: "Sales" },
    { value: "meetings", label: "Meetings" },
    { value: "leads", label: "Leads" },
    { value: "revenue", label: "Revenue" },
    { value: "clients", label: "Clients" },
  ];
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Amount</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
                </FormControl>
                <FormDescription>
                  The numerical target you aim to achieve (whole number)
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
                <FormLabel>Current Amount</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormDescription>
                  Your current progress toward the goal (whole number)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
                    {categories.map(category => (
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
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
}