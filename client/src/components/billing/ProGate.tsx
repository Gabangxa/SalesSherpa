import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface ProGateProps {
  feature: string;
  description?: string;
  children: ReactNode;
}

export default function ProGate({ feature, description, children }: ProGateProps) {
  const { isPro, isLoadingSubscription } = useAuth();
  const [, navigate] = useLocation();

  if (isLoadingSubscription) {
    return <div className="animate-pulse rounded-xl bg-muted h-48" />;
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Pro Feature</h3>
          <p className="text-sm font-medium text-foreground">{feature}</p>
          <p className="text-sm text-muted-foreground">
            {description ?? "Upgrade to Pro to unlock this and all premium features."}
          </p>
        </div>
        <Button onClick={() => navigate("/pricing")} className="gap-2">
          <Zap className="h-4 w-4" />
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
