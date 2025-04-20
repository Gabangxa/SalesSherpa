import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  achievements: z.string().min(1, "Please share your achievements"),
  challenges: z.string().min(1, "Please share your challenges"),
  goals: z.string().min(1, "Please set goals for your next steps"),
  reflection: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CheckInFormProps {
  onSuccess?: () => void;
}

export function CheckInForm({ onSuccess }: CheckInFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      achievements: "",
      challenges: "",
      goals: "",
      reflection: "",
    },
  });
  
  const checkInMutation = useMutation({
    mutationFn: (values: FormValues) => {
      return apiRequest('POST', '/api/check-ins', values);
    },
    onSuccess: () => {
      toast({
        title: "Check-in submitted successfully",
        description: "Your daily check-in has been recorded",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit check-in",
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
  
  function onSubmit(values: FormValues) {
    checkInMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="achievements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What did you accomplish today?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your wins and achievements..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="challenges"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What challenges did you face?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe any obstacles or difficulties..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are your goals for tomorrow?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Set specific, actionable goals..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="reflection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional reflections (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other thoughts or reflections on your day..."
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
          disabled={checkInMutation.isPending}
        >
          {checkInMutation.isPending ? "Submitting..." : "Submit Check-in"}
        </Button>
      </form>
    </Form>
  );
}
