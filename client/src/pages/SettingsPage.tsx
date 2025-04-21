import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Check, Info, CheckCircle2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { calculatePercentage } from "@/lib/utils";

// Sales metrics type definition
interface SalesMetrics {
  id: number;
  userId: number;
  newAccountsTarget: number;
  newAccountsCurrent: number;
  meetingsTarget: number;
  meetingsCurrent: number;
  tripsTarget: number;
  tripsCurrent: number;
  crmUpdatePercentage: number;
  weeklyActivity: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
}

// Form schema for performance metrics
const formSchema = z.object({
  newAccountsTarget: z.coerce.number().int().min(1, "Must be at least 1"),
  meetingsTarget: z.coerce.number().int().min(1, "Must be at least 1"),
  tripsTarget: z.coerce.number().int().min(0, "Cannot be negative"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<FormValues | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch current sales metrics
  const { data: metrics, isLoading } = useQuery<SalesMetrics>({
    queryKey: ["/api/sales-metrics"],
    retry: 1,
  });

  // Setup form with current values or defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newAccountsTarget: metrics?.newAccountsTarget || 10,
      meetingsTarget: metrics?.meetingsTarget || 30,
      tripsTarget: metrics?.tripsTarget || 5,
    },
    values: metrics ? {
      newAccountsTarget: metrics.newAccountsTarget,
      meetingsTarget: metrics.meetingsTarget,
      tripsTarget: metrics.tripsTarget,
    } : undefined,
  });

  // Update metrics mutation
  const updateMetricsMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest("PATCH", "/api/sales-metrics", {
        ...values,
        userId: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-metrics"] });
      toast({
        title: "Settings updated",
        description: "Your performance metrics have been updated successfully.",
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: FormValues) {
    // Check if this is the first time setting metrics
    if (!metrics) {
      // If first time, update directly
      updateMetricsMutation.mutate(values);
    } else {
      // Store changes and open confirmation dialog
      setPendingChanges(values);
      setIsConfirmDialogOpen(true);
    }
  }

  // Handle confirmation dialog approval
  function handleApprovalConfirmation() {
    if (pendingChanges) {
      updateMetricsMutation.mutate(pendingChanges);
      setIsConfirmDialogOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">
          Manage your performance metrics and application preferences
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Set your target performance metrics for tracking and accountability
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
                        <FormLabel>Prospect Engagements (Monthly)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of meaningful prospect engagements you aim to achieve each month
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
                        <FormLabel>Client Meetings Target (Monthly)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of client meetings you aim to conduct each month
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
                        <FormLabel>Field Trips Target (Monthly)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of field trips or site visits you aim to conduct each month
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2 mt-6">
                    <Info className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-gray-500">
                      Changes to your performance metrics after initial setup will require a brief discussion with your virtual sales mentor
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={updateMetricsMutation.isPending || showSuccess}
                    className="w-full md:w-auto"
                  >
                    {updateMetricsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving changes...
                      </>
                    ) : showSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Current Progress</CardTitle>
                <CardDescription>
                  Your current progress against your performance targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">Prospect Engagements: {metrics.newAccountsCurrent} of {metrics.newAccountsTarget}</p>
                      <p className="text-sm text-gray-500">{calculatePercentage(metrics.newAccountsCurrent, metrics.newAccountsTarget)}%</p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(metrics.newAccountsCurrent, metrics.newAccountsTarget), 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">Client Meetings: {metrics.meetingsCurrent} of {metrics.meetingsTarget}</p>
                      <p className="text-sm text-gray-500">{calculatePercentage(metrics.meetingsCurrent, metrics.meetingsTarget)}%</p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(metrics.meetingsCurrent, metrics.meetingsTarget), 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">Field Trips: {metrics.tripsCurrent} of {metrics.tripsTarget}</p>
                      <p className="text-sm text-gray-500">{calculatePercentage(metrics.tripsCurrent, metrics.tripsTarget)}%</p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(metrics.tripsCurrent, metrics.tripsTarget), 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">CRM Updates</p>
                      <p className="text-sm text-gray-500">{metrics.crmUpdatePercentage}%</p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${metrics.crmUpdatePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>About Your Sales Mentor</CardTitle>
              <CardDescription>Your virtual sales assistant and coach</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">Your FinSales Coach</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Helping you reach your fintech sales targets through daily guidance
                  and accountability
                </p>
                <div className="w-full space-y-3 mt-2">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Daily check-ins</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Progress tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Strategic advice</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Resource recommendations</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog for Metric Changes */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Metrics Change</DialogTitle>
            <DialogDescription>
              Changes to your performance metrics require a brief discussion with your virtual sales mentor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Your virtual sales mentor says:</p>
            <div className="bg-gray-100 p-4 rounded-lg text-gray-700 mb-4">
              "I see you're adjusting your performance targets. That's a significant step.
              Could you share your reasoning behind these changes? 
              Understanding your motivation will help me provide better guidance and support."
            </div>
            
            <div className="space-y-2">
              {pendingChanges && metrics && (
                <>
                  {pendingChanges.newAccountsTarget !== metrics.newAccountsTarget && (
                    <p className="text-sm">
                      <span className="font-medium">Prospect Engagements:</span>{" "}
                      <span className="text-gray-600">{metrics.newAccountsTarget}</span>{" "}
                      <span className="text-gray-400">→</span>{" "}
                      <span className="text-primary font-medium">{pendingChanges.newAccountsTarget}</span>
                    </p>
                  )}
                  
                  {pendingChanges.meetingsTarget !== metrics.meetingsTarget && (
                    <p className="text-sm">
                      <span className="font-medium">Meetings Target:</span>{" "}
                      <span className="text-gray-600">{metrics.meetingsTarget}</span>{" "}
                      <span className="text-gray-400">→</span>{" "}
                      <span className="text-primary font-medium">{pendingChanges.meetingsTarget}</span>
                    </p>
                  )}
                  
                  {pendingChanges.tripsTarget !== metrics.tripsTarget && (
                    <p className="text-sm">
                      <span className="font-medium">Field Trips Target:</span>{" "}
                      <span className="text-gray-600">{metrics.tripsTarget}</span>{" "}
                      <span className="text-gray-400">→</span>{" "}
                      <span className="text-primary font-medium">{pendingChanges.tripsTarget}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprovalConfirmation}>
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}