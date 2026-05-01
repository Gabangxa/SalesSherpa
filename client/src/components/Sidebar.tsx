import { Link } from "wouter";
<<<<<<< railway_polar
import {
  Home,
  Target,
  CalendarCheck,
  Swords,
  Settings,
  LogOut,
  Radio,
  CreditCard,
  Zap,
} from "lucide-react";
=======
import { BarChart3, Target, CheckSquare, Mountain, Settings, LogOut, Search, Sun, Moon, NotebookPen } from "lucide-react";
>>>>>>> master
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { calculatePercentage } from "@/lib/utils";
import { Goal } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface SidebarProps {
  userData: { name: string; role: string };
  currentPath: string;
}

const NAV_ITEMS = [
  { icon: BarChart3, label: "Overview", path: "/" },
  { icon: Target, label: "Goals & Targets", path: "/goals" },
  { icon: CheckSquare, label: "Check-ins", path: "/check-ins" },
  { icon: NotebookPen, label: "Meeting Notes", path: "/meeting-notes" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar({ userData, currentPath }: SidebarProps) {
<<<<<<< railway_polar
  const { logoutMutation, isPro } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { name: "Goals & Targets", path: "/goals", icon: <Target className="w-5 h-5 mr-3" /> },
    { name: "Check-ins", path: "/check-ins", icon: <CalendarCheck className="w-5 h-5 mr-3" /> },
    { name: "Strategic Planning", path: "/strategy", icon: <Swords className="w-5 h-5 mr-3" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5 mr-3" /> },
    { name: "Billing", path: "/billing", icon: <CreditCard className="w-5 h-5 mr-3" /> },
  ];
  
  // Development and testing links - would be removed in production
  const devLinks = [
    { name: "WebSocket Test", path: "/websocket-test", icon: <Radio className="w-5 h-5 mr-3" /> },
  ];
=======
  const { logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: goals = [] } = useQuery<Goal[]>({ queryKey: ["/api/goals"] });
  const completedGoals = goals.filter(
    (g) => calculatePercentage(g.currentAmount, g.targetAmount, g.startingAmount ?? 0) >= 100
  ).length;
  const overallProgress = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const initials = userData?.name
    ? userData.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";
>>>>>>> master

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-moss dark:bg-dark-sidebar text-white h-full relative z-20 flex-shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-clay rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
          <Mountain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">SalesSherpa</span>
      </div>
<<<<<<< railway_polar
      
      <nav className="flex-1 mb-6">
        <div className="text-xs uppercase text-muted-foreground font-semibold mb-3 ml-2">
          Main Navigation
        </div>
        <ul className="space-y-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link 
                href={link.path} 
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  currentPath === link.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        
        {!isPro && (
          <div className="mt-6 mx-1 rounded-lg bg-primary/10 border border-primary/20 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Zap className="w-4 h-4" />
              Unlock Pro
            </div>
            <p className="text-xs text-muted-foreground">AI chat, teams, metrics &amp; unlimited goals.</p>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-primary hover:underline"
            >
              See plans →
            </Link>
          </div>
        )}

        {/* Development section */}
        <div className="text-xs uppercase text-muted-foreground font-semibold mt-6 mb-3 ml-2">
          Development
=======

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-black/10 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-clay/50 focus:ring-1 focus:ring-clay/50 transition-all"
          />
>>>>>>> master
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 px-2">Menu</p>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all relative ${
                isActive
                  ? "bg-sage/40 dark:bg-sage/30 text-white shadow-sm"
                  : "opacity-70 hover:opacity-100 text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-clay absolute left-3 shadow-sm" />
              )}
              <item.icon className={`w-4 h-4 relative z-10 ${isActive ? "ml-4" : "ml-1"}`} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Current Ascent progress widget */}
      <div className="px-6 pb-4">
        <div className="bg-sage/30 dark:bg-sage/20 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Current Ascent</p>
          <p className="text-lg font-bold">{overallProgress}% to Peak</p>
          <div className="w-full bg-black/20 h-1.5 rounded-full mt-2">
            <div
              className="bg-clay h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
          <p className="text-[10px] mt-2 opacity-60">
            {completedGoals} of {goals.length} goal{goals.length !== 1 ? "s" : ""} completed
          </p>
        </div>
      </div>

      {/* Footer: user card + theme + logout */}
      <div className="px-4 pb-4 border-t border-white/10 pt-4 mx-2 space-y-1">
        {/* Dark/light toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium opacity-70 hover:opacity-100 transition-opacity text-white"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 ml-1" />
          ) : (
            <Moon className="w-4 h-4 ml-1" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User card + dropdown */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-clay/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{userData?.name || "User"}</p>
            <p className="text-[10px] opacity-60 truncate">{userData?.role || "Sales Rep"}</p>
          </div>
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="text-white/60 hover:text-white p-1 rounded transition-colors flex-shrink-0">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
