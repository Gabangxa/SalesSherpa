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
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

  // Transform the weekly activity data for the chart
  const chartData = metrics ? [
    { day: 'Mon', value: metrics.weeklyActivity.monday },
    { day: 'Tue', value: metrics.weeklyActivity.tuesday },
    { day: 'Wed', value: metrics.weeklyActivity.wednesday },
    { day: 'Thu', value: metrics.weeklyActivity.thursday },
    { day: 'Fri', value: metrics.weeklyActivity.friday },
    { day: 'Sat', value: metrics.weeklyActivity.saturday },
    { day: 'Sun', value: metrics.weeklyActivity.sunday },
  ] : [];

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

  // Calculate percentages
  const accountsPercentage = calculatePercentage(metrics.newAccountsCurrent, metrics.newAccountsTarget);
  const meetingsPercentage = calculatePercentage(metrics.meetingsCurrent, metrics.meetingsTarget);
  const tripsPercentage = calculatePercentage(metrics.tripsCurrent, metrics.tripsTarget);
  const crmPercentage = metrics.crmUpdatePercentage || 0;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Performance Tracking</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Field Trips Target */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-700">Field Trips</h3>
              <Badge variant="secondary" className={cn("font-medium", 
                tripsPercentage >= 90 ? "bg-green-100 text-green-800" : 
                tripsPercentage >= 70 ? "bg-blue-100 text-blue-800" : 
                "bg-amber-100 text-amber-800")}>
                {tripsPercentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-blue-900">
                {metrics.tripsCurrent}
              </p>
              <p className="text-sm text-blue-700 font-medium">
                Target: <span className="text-blue-900 font-bold">{metrics.tripsTarget}</span> field trips per month
              </p>
            </div>
            <div className="mt-3">
              <Progress 
                value={tripsPercentage} 
                className="h-2.5 bg-blue-100" 
                indicatorClassName="bg-blue-600" 
              />
            </div>
            <div className="mt-2 text-xs text-blue-700">
              {metrics.tripsTarget - metrics.tripsCurrent > 0 ? 
                `${metrics.tripsTarget - metrics.tripsCurrent} more field trips needed` : 
                'Field trips target achieved!'}
            </div>
          </div>
          
          {/* CRM Update Level */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-emerald-700">CRM Updated</h3>
              <Badge variant="secondary" className={cn("font-medium", 
                crmPercentage >= 90 ? "bg-green-100 text-green-800" : 
                crmPercentage >= 70 ? "bg-emerald-100 text-emerald-800" : 
                "bg-amber-100 text-amber-800")}>
                {crmPercentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-emerald-900">
                {crmPercentage}%
              </p>
              <p className="text-sm text-emerald-700 font-medium">
                Customer data completeness
              </p>
            </div>
            <div className="mt-3">
              <Progress 
                value={crmPercentage} 
                className="h-2.5 bg-emerald-100" 
                indicatorClassName="bg-emerald-600" 
              />
            </div>
            <div className="mt-2 text-xs text-emerald-700">
              {crmPercentage < 80 ? 
                "Update customer records to reach 80% target" : 
                "Good job keeping records updated!"}
            </div>
          </div>
          
          {/* Client Meetings - Highlighted with primary accent */}
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-primary-700">Monthly Client Meetings</h3>
              <Badge variant="secondary" className={cn("font-medium", 
                meetingsPercentage >= 90 ? "bg-green-100 text-green-800" : 
                meetingsPercentage >= 70 ? "bg-blue-100 text-blue-800" : 
                "bg-amber-100 text-amber-800")}>
                {meetingsPercentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-primary-900">
                {metrics.meetingsCurrent}
              </p>
              <p className="text-sm text-primary-700 font-medium">
                Target: <span className="text-primary-900 font-bold">{metrics.meetingsTarget}</span> meetings per month
              </p>
            </div>
            <div className="mt-3">
              <Progress 
                value={meetingsPercentage} 
                className="h-2.5 bg-primary-100" 
                indicatorClassName="bg-primary-600" 
              />
            </div>
            <div className="mt-2 text-xs text-primary-700">
              {metrics.meetingsTarget - metrics.meetingsCurrent > 0 ? 
                `${metrics.meetingsTarget - metrics.meetingsCurrent} more meetings needed this month` : 
                'Monthly target achieved! Great job!'}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-sm font-medium text-neutral-600 mb-4">Weekly Activity</h3>
          <div className="h-64 bg-neutral-50 rounded-lg border border-neutral-200">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
