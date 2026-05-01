import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Check, X, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const features = [
  { label: "Goals",           free: "3 max",     pro: "Unlimited" },
  { label: "Daily check-ins", free: "Basic form", pro: "AI-guided flows" },
  { label: "AI chat",         free: false,        pro: true },
  { label: "Teams",           free: false,        pro: true },
  { label: "Sales metrics",   free: false,        pro: true },
];

export default function PricingPage() {
  const { isPro } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const checkoutId = new URLSearchParams(window.location.search).get("checkout_id");
  const showSuccess = !!checkoutId;

  // Refresh subscription state after a successful checkout redirect
  useEffect(() => {
    if (showSuccess) {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
    }
  }, [showSuccess]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/checkout", { plan: "pro" });
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: () => {
      toast({
        title: "Checkout failed",
        description: "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (showSuccess) {
    return (
      <div className="container max-w-lg py-20 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">You're on Pro!</h1>
          <p className="text-muted-foreground">
            Your subscription is being activated. All Pro features are now
            unlocked — it may take a few seconds for the change to reflect.
          </p>
        </div>
        <Button onClick={() => navigate("/")} className="gap-2">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12">
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Start free. Upgrade when you're ready to unlock the full power of Sales Sherpa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Free tier */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl">Starter</CardTitle>
              <Badge variant="secondary">Free forever</Badge>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground pb-1">/month</span>
            </div>
            <CardDescription>Get started with the basics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-sm">
                {f.free ? (
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={!f.free ? "text-muted-foreground" : ""}>
                  {f.label}
                  {typeof f.free === "string" && (
                    <span className="text-muted-foreground ml-1">({f.free})</span>
                  )}
                </span>
              </div>
            ))}
            <div className="pt-4">
              <Button variant="outline" className="w-full" disabled>
                {isPro ? "Downgrade" : "Current plan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro tier */}
        <Card className="border-primary shadow-lg relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground gap-1 px-3 py-1">
              <Zap className="h-3 w-3" /> Most popular
            </Badge>
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl">Pro</CardTitle>
              <Badge variant="default">Monthly</Badge>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">$19</span>
              <span className="text-muted-foreground pb-1">/month</span>
            </div>
            <CardDescription>Everything you need to hit your sales targets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>
                  {f.label}
                  {typeof f.pro === "string" && (
                    <span className="text-muted-foreground ml-1">({f.pro})</span>
                  )}
                </span>
              </div>
            ))}
            <div className="pt-4">
              {isPro ? (
                <Button variant="outline" className="w-full" onClick={() => navigate("/billing")}>
                  Manage Billing
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Payments processed securely by Polar.sh. Cancel any time.
      </p>
    </div>
  );
}
