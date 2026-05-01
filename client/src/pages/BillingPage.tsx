import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CreditCard, ExternalLink, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge className="bg-green-500 text-white">Active</Badge>;
  if (status === "canceled") return <Badge variant="destructive">Canceled</Badge>;
  if (status === "past_due") return <Badge variant="destructive">Past due</Badge>;
  if (status === "revoked") return <Badge variant="destructive">Revoked</Badge>;
  return <Badge variant="secondary">Free</Badge>;
}

export default function BillingPage() {
  const { subscription, isPro, isLoadingSubscription } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/billing/portal");
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: () => {
      toast({
        title: "Could not open billing portal",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {isPro ? "You have full access to all Pro features." : "You're on the free tier."}
              </CardDescription>
            </div>
            <StatusBadge status={subscription?.status ?? "free"} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Plan</p>
              <p className="font-medium capitalize">{subscription?.plan ?? "Free"}</p>
            </div>
            {isPro && (
              <>
                <div>
                  <p className="text-muted-foreground mb-1">Renewal date</p>
                  <p className="font-medium">{formatDate(subscription?.currentPeriodEnd)}</p>
                </div>
                {subscription?.cancelAtPeriodEnd && (
                  <div className="col-span-2">
                    <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                      Your subscription will cancel on {formatDate(subscription?.currentPeriodEnd)}.
                      You retain Pro access until then.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            {isPro ? (
              <Button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                {portalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Billing
              </Button>
            ) : (
              <Button onClick={() => navigate("/pricing")} className="gap-2">
                <Zap className="h-4 w-4" />
                Upgrade to Pro — $19/mo
              </Button>
            )}
          </div>

          {isPro && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pro features included
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Unlimited goals</li>
                <li>AI-guided daily check-in flows</li>
                <li>AI Sales Sherpa chat</li>
                <li>Team collaboration</li>
                <li>Sales performance metrics</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Billing managed by{" "}
        <span className="font-medium">Polar.sh</span>. For billing issues, use the portal above.
      </p>
    </div>
  );
}
