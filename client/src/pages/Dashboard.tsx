import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, CalendarDays, PlayCircle } from "lucide-react";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import SalesAssistantChat from "@/components/dashboard/SalesAssistantChat";
import ProgressTracking from "@/components/dashboard/ProgressTracking";
import TodosAndReminders from "@/components/dashboard/TodosAndReminders";
import RecentCheckIns from "@/components/dashboard/RecentCheckIns";
<<<<<<< railway_polar
import ProGate from "@/components/billing/ProGate";
=======
import { CheckInDialog } from "@/components/dialogs/CheckInDialog";
import { calculatePercentage } from "@/lib/utils";
import { Goal } from "@shared/schema";
>>>>>>> master

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface CheckIn {
  id: number;
  date: string;
  achievements: string;
  challenges: string;
  goals: string;
}

function StatCard({
  title, value, subtext, trendValue, trend, icon: Icon, dark, delay,
}: {
  title: string; value: string; subtext: string; trendValue: string;
  trend: "up" | "down"; icon: React.ComponentType<{ className?: string }>;
  dark: boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-6 rounded-3xl relative ${
        dark
          ? "bg-forest text-parchment border border-forest/50"
          : "bg-white dark:bg-dark-card text-forest dark:text-parchment shadow-sm border border-earth/20 dark:border-earth/10"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">{title}</h3>
        <div className={`p-2 rounded-xl ${dark ? "bg-white/10" : "bg-earth/10 dark:bg-white/5"}`}>
          <Icon className={`w-5 h-5 ${dark ? "text-parchment" : "text-clay"}`} />
        </div>
      </div>
      <div className="mb-4">
        <div className="text-4xl font-serif">{value}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${
          dark ? "text-white" : trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-clay"
        }`}>
          {trendValue}
        </span>
        <span className="text-xs opacity-60">{subtext}</span>
      </div>
      <div className={`mt-4 h-1 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-sage/10 dark:bg-white/5"}`}>
        <div className={`h-full rounded-full ${
          dark ? "bg-clay w-1/3" : trend === "up" ? "bg-sage w-2/3" : "bg-clay w-1/3"
        }`} />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [checkInOpen, setCheckInOpen] = useState(false);

  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: goals = [] } = useQuery<Goal[]>({ queryKey: ["/api/goals"] });
  const { data: checkIns = [] } = useQuery<CheckIn[]>({ queryKey: ["/api/check-ins"] });

  // Derived stats
  const completedGoals = goals.filter(
    (g) => calculatePercentage(g.currentAmount, g.targetAmount, g.startingAmount ?? 0) >= 100
  ).length;
  const overallProgress =
    goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const now = new Date();
  const mtdCheckIns = checkIns.filter((c) => {
    const d = new Date(c.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // Weekly check-in chart data (Mon–Sun of the current week)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const chartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = checkIns.filter((c) => {
      const d = new Date(c.date);
      return d >= dayStart && d <= dayEnd;
    }).length;
    return { name, checkIns: count };
  });

  // Sherpa insight copy
  const momentumMsg =
    mtdCheckIns >= 5
      ? `You've logged ${mtdCheckIns} check-ins this month — great cadence. Keep pushing toward your targets.`
      : "Start building your check-in habit. Consistent daily logs are the #1 predictor of goal achievement.";

  const pipelineMsg =
    goals.length > 0
      ? `${completedGoals} of ${goals.length} goals completed (${overallProgress}%). ${
          overallProgress >= 70 ? "You're ahead of pace." : "Focus time on lagging goals."
        }`
      : "No goals set yet. Head to Goals & Targets to define your objectives.";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <WelcomeSection name={user?.name || "there"} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Goals On Track"
          value={goals.length > 0 ? `${overallProgress}%` : "–"}
          subtext="completion rate"
          trend={overallProgress >= 50 ? "up" : "down"}
          trendValue={goals.length > 0 ? `${completedGoals} / ${goals.length} done` : "No goals yet"}
          icon={TrendingUp}
          delay={0.1}
          dark={false}
        />
        <StatCard
          title="Active Goals"
          value={String(goals.length - completedGoals)}
          subtext="remaining"
          trend={goals.length - completedGoals > 0 ? "down" : "up"}
          trendValue={goals.length > 0 ? `${completedGoals} completed` : "Set your first goal"}
          icon={Target}
          delay={0.2}
          dark={false}
        />
        <StatCard
          title="Check-ins (MTD)"
          value={String(mtdCheckIns)}
          subtext="this month"
          trend={mtdCheckIns >= 10 ? "up" : "down"}
          trendValue={mtdCheckIns >= 10 ? "Strong cadence" : "Keep it up"}
          icon={CalendarDays}
          delay={0.3}
          dark={true}
        />
      </div>

      {/* Chart + Sherpa Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-earth/20 dark:border-earth/10 flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-1 text-forest dark:text-parchment">
              Check-in Activity
            </h2>
            <p className="text-xs text-forest/50 dark:text-parchment/50">
              Daily check-ins this week
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#606C38" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#606C38" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DDD0" />
                <XAxis dataKey="name" stroke="#A3A3A3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A3A3A3" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#BC6C25",
                    color: "#1A3C34",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#1A3C34", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="checkIns"
                  name="Check-ins"
                  stroke="#606C38"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCheckIns)"
                  dot={{ fill: "#BC6C25", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#BC6C25" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sherpa Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-sage dark:bg-sage/30 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <h2 className="font-serif text-3xl italic mb-6 relative z-10">Sherpa Insights</h2>

          <div className="space-y-6 flex-1 relative z-10">
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-clay flex-shrink-0" />
                Momentum Check
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">{momentumMsg}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-earth flex-shrink-0" />
                Pipeline Status
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">{pipelineMsg}</p>
            </div>
          </div>

          <button
            onClick={() => setCheckInOpen(true)}
            className="w-full mt-6 py-3 flex items-center justify-center gap-2 bg-clay hover:bg-clay/90 text-white font-bold rounded-full shadow-lg transition-all relative z-10"
          >
            <PlayCircle className="w-4 h-4" />
            Start Daily Check-in
          </button>
        </motion.div>
      </div>
<<<<<<< railway_polar
      {/* Main content area with improved grid layout and spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Sales Assistant & Check-ins (takes 2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          <ProGate
            feature="AI Sales Sherpa Assistant"
            description="Chat with your AI-powered sales coach for personalized guidance and accountability."
          >
            <SalesAssistantChat userName={user?.name || "Jordan Doe"} />
          </ProGate>
=======

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesAssistantChat userName={user?.name || "there"} />
>>>>>>> master
          <RecentCheckIns />
        </div>
        <div className="space-y-6">
          <ProgressTracking />
          <TodosAndReminders />
        </div>
      </div>

      <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} />
    </div>
  );
}
