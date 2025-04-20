import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const formSchema = z.object({
  startDate: z.string()
    .refine(date => date !== "", {
      message: "Start date is required",
    }),
  endDate: z.string()
    .refine(date => date !== "", {
      message: "End date is required",
    }),
  notes: z.string().optional(),
})
.refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

interface TimeOffFormProps {
  onSuccess?: () => void;
}

export function TimeOffForm({ onSuccess }: TimeOffFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: format(today, "yyyy-MM-dd"),
      endDate: format(tomorrow, "yyyy-MM-dd"),
      notes: "",
    },
  });
  
  const timeOffMutation = useMutation({
    mutationFn: (values: FormValues) => {
      return apiRequest('POST', '/api/time-off', values);
    },
    onSuccess: () => {
      toast({
        title: "Time off scheduled",
        description: "Your time off has been scheduled. I'll respect your time away.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-off'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to schedule time off",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
  
  function onSubmit(values: FormValues) {
    timeOffMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={format(today, "yyyy-MM-dd")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={format(today, "yyyy-MM-dd")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Reason for time off, handover details, etc."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={timeOffMutation.isPending}
        >
          {timeOffMutation.isPending ? "Scheduling..." : "Schedule Time Off"}
        </Button>
      </form>
    </Form>
  );
}
