import { useQuery } from "@tanstack/react-query";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Calendar } from "lucide-react";

interface SalesMetrics {
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

const getBadgeColor = (percentage: number) => {
  if (percentage >= 90) return "accent";
  if (percentage >= 70) return "primary";
  return "secondary";
};

export default function ProgressTracking() {
  const { data: metrics, isLoading } = useQuery<SalesMetrics>({
    queryKey: ['/api/sales-metrics'],
  });

  // Default values for metrics when data is missing
  const defaultMetrics: SalesMetrics = {
    newAccountsTarget: 0,
    newAccountsCurrent: 0,
    meetingsTarget: 10,
    meetingsCurrent: 0,
    tripsTarget: 5,
    tripsCurrent: 0,
    crmUpdatePercentage: 0,
    weeklyActivity: {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    }
  };

  // Use fallback when metrics is undefined or null
  const safeMetrics = metrics || defaultMetrics;

  // Transform the weekly activity data for the chart - with safe access
  const chartData = [
    { day: 'Mon', value: safeMetrics.weeklyActivity?.monday || 0 },
    { day: 'Tue', value: safeMetrics.weeklyActivity?.tuesday || 0 },
    { day: 'Wed', value: safeMetrics.weeklyActivity?.wednesday || 0 },
    { day: 'Thu', value: safeMetrics.weeklyActivity?.thursday || 0 },
    { day: 'Fri', value: safeMetrics.weeklyActivity?.friday || 0 },
    { day: 'Sat', value: safeMetrics.weeklyActivity?.saturday || 0 },
    { day: 'Sun', value: safeMetrics.weeklyActivity?.sunday || 0 },
  ];

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Performance Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Performance Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-neutral-500">No metrics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages using safeMetrics
  const accountsPercentage = calculatePercentage(safeMetrics.newAccountsCurrent, safeMetrics.newAccountsTarget);
  const meetingsPercentage = calculatePercentage(safeMetrics.meetingsCurrent, safeMetrics.meetingsTarget);
  const tripsPercentage = calculatePercentage(safeMetrics.tripsCurrent, safeMetrics.tripsTarget);
  const crmPercentage = safeMetrics.crmUpdatePercentage || 0;

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-md overflow-hidden border-border/60">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance Tracking
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5">
        {/* Responsive grid for metrics cards - stacks on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Field Trips - Using consistent primary color styling */}
          <div className="rounded-lg p-4 border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/80"></div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Field Trips</h3>
              <Badge variant={tripsPercentage >= 90 ? "default" : tripsPercentage >= 70 ? "default" : "secondary"} 
                className={cn("font-medium", tripsPercentage >= 90 ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" : "")}>
                {tripsPercentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {safeMetrics.tripsCurrent}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Target: <span className="text-foreground font-bold">{safeMetrics.tripsTarget}</span> field trips per month
              </p>
            </div>
            <div className="mt-3">
              <Progress 
                value={tripsPercentage} 
                className="h-2.5"
                indicatorClassName="bg-primary" 
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {safeMetrics.tripsTarget - safeMetrics.tripsCurrent > 0 ? 
                `${safeMetrics.tripsTarget - safeMetrics.tripsCurrent} more field trips needed` : 
                'Field trips target achieved!'}
            </div>
          </div>
          
          {/* CRM Update Level - Using consistent primary color styling */}
          <div className="rounded-lg p-4 border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/80"></div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">CRM Updated</h3>
              <Badge variant={crmPercentage >= 90 ? "default" : crmPercentage >= 70 ? "default" : "secondary"} 
                className={cn("font-medium", crmPercentage >= 90 ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" : "")}>
                {crmPercentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {crmPercentage}%
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Customer data completeness
              </p>
            </div>
            <div className="mt-3">
              <Progress 
                value={crmPercentage} 
                className="h-2.5"
                indicatorClassName="bg-primary" 
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {crmPercentage < 80 ? 
                "Update customer records to reach 80% target" : 
                "Good job keeping records updated!"}
            </div>
          </div>
          
          {/* Client Meetings - Using consistent primary color styling */}
          <div className="rounded-lg p-4 border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/80"></div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Client Meetings</h3>
              <Badge variant={meetingsPercentage >= 90 ? "default" : meetingsPercentage >= 70 ? "default" : "secondary"} 
                className={cn("font-medium", meetingsPercentage >= 90 ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" : "")}>
                {meetingsPercentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {safeMetrics.meetingsCurrent}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Target: <span className="text-foreground font-bold">{safeMetrics.meetingsTarget}</span> meetings per month
              </p>
            </div>
            <div className="mt-3">
              <Progress 
                value={meetingsPercentage} 
                className="h-2.5"
                indicatorClassName="bg-primary" 
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {safeMetrics.meetingsTarget - safeMetrics.meetingsCurrent > 0 ? 
                `${safeMetrics.meetingsTarget - safeMetrics.meetingsCurrent} more meetings needed this month` : 
                'Monthly target achieved! Great job!'}
            </div>
          </div>
        </div>
        
        {/* Weekly Activity Chart with improved styling */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Weekly Activity
          </h3>
          <div className="h-64 rounded-lg border border-border bg-card p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
