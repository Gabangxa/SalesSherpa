import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Form schema for performance metrics
const formSchema = z.object({
  newAccountsTarget: z.coerce.number().min(1, "Must be at least 1"),
  meetingsTarget: z.coerce.number().min(1, "Must be at least 1"),
  tripsTarget: z.coerce.number().min(1, "Must be at least 1"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<FormValues | null>(null);
  
  // Fetch the current metrics
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["/api/sales-metrics"],
    retry: 1
  });
  
  // Mutation for updating metrics
  const updateMetricsMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("PATCH", "/api/sales-metrics", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-metrics"] });
      toast({
        title: "Settings Updated",
        description: "Your performance metrics have been updated successfully.",
      });
      setNeedsApproval(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form for updating metrics
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newAccountsTarget: metrics?.newAccountsTarget || 10,
      meetingsTarget: metrics?.meetingsTarget || 30,
      tripsTarget: metrics?.tripsTarget || 10,
    },
  });
  
  // Update form values when metrics are loaded
  useEffect(() => {
    if (metrics) {
      form.reset({
        newAccountsTarget: metrics.newAccountsTarget,
        meetingsTarget: metrics.meetingsTarget,
        tripsTarget: metrics.tripsTarget,
      });
    }
  }, [metrics, form]);
  
  // Handle form submission
  function onSubmit(values: FormValues) {
    // Check if this is the first time setting metrics
    if (!needsApproval) {
      updateMetricsMutation.mutate(values);
    } else {
      // If metrics have been set before, show the approval dialog
      setPendingChanges(values);
      setApprovalDialogOpen(true);
    }
  }
  
  // Handle approval from virtual sales coach
  function handleApprovalConfirmation() {
    if (pendingChanges) {
      updateMetricsMutation.mutate(pendingChanges);
      setApprovalDialogOpen(false);
      setPendingChanges(null);
      
      // Create a chat message about the changes
      apiRequest("POST", "/api/chat", {
        message: `I've updated my performance metrics to: ${pendingChanges.newAccountsTarget} new accounts, ${pendingChanges.meetingsTarget} meetings, and ${pendingChanges.tripsTarget} field trips.`,
        sender: "user"
      });
    }
  }
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load your metrics. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Performance Metrics Settings</CardTitle>
          <CardDescription>
            Define your target metrics for sales performance. These metrics will be used to track your progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newAccountsTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Accounts Target</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      The number of new accounts you aim to acquire per month.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="meetingsTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Client Meetings Target</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      The number of client meetings you aim to conduct per month.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tripsTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Trips Target</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      The number of field trips you aim to conduct per month.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={updateMetricsMutation.isPending}
                className="w-full"
              >
                {updateMetricsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : needsApproval ? "Request Approval for Changes" : "Save Settings"}
              </Button>
              
              {needsApproval && (
                <Alert>
                  <AlertTitle>Approval Required</AlertTitle>
                  <AlertDescription>
                    Changing your performance metrics requires discussion with your virtual sales coach. Submit your requested changes to start the conversation.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discuss Performance Metric Changes</DialogTitle>
            <DialogDescription>
              Your virtual sales coach needs to discuss changes to your performance metrics with you. 
              This ensures your targets are challenging yet achievable based on your situation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-3">
              <p className="font-medium">Your requested changes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>New Accounts Target: {pendingChanges?.newAccountsTarget}</li>
                <li>Monthly Meetings Target: {pendingChanges?.meetingsTarget}</li>
                <li>Field Trips Target: {pendingChanges?.tripsTarget}</li>
              </ul>
              
              <div className="border-l-4 border-primary-600 pl-4 mt-4 py-2 bg-primary-50 italic">
                "I see you want to adjust your targets. Let's discuss whether these are aligned with your current capacity and market conditions. Are you sure these new metrics are the right balance of ambitious yet attainable?"
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApprovalDialogOpen(false)}
            >
              Reconsider
            </Button>
            <Button
              onClick={handleApprovalConfirmation}
            >
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}