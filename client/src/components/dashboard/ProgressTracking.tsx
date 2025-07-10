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
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/20">
      <CardHeader className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-sm border-b border-white/10 pb-6">
        <CardTitle className="text-xl font-bold flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          Performance Tracking Centre
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Responsive grid for metrics cards - stacks on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Field Trips - Using refined styling */}
          <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Field Trips</h3>
              <Badge className={cn(
                "font-bold text-xs px-3 py-1 rounded-full",
                tripsPercentage >= 90 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : 
                tripsPercentage >= 70 ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : 
                "bg-gray-600/20 text-gray-300 border-gray-500/30"
              )}>
                {tripsPercentage}%
              </Badge>
            </div>
            <div>
              <p className="text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                {safeMetrics.tripsCurrent}
              </p>
              <p className="text-sm text-gray-400 font-medium">
                Target: <span className="text-gray-200 font-bold">{safeMetrics.tripsTarget}</span> field trips per month
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
