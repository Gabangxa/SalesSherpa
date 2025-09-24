import { Link } from "wouter";
import { 
  Home, 
  Target, 
  CalendarCheck, 
  Swords, 
  Settings,
  LogOut,
  Radio
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState } from "react";

interface SidebarProps {
  userData: {
    name: string;
    role: string;
  };
  currentPath: string;
}

export default function Sidebar({ userData, currentPath }: SidebarProps) {
  const { logoutMutation } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { name: "Goals & Targets", path: "/goals", icon: <Target className="w-5 h-5 mr-3" /> },
    { name: "Check-ins", path: "/check-ins", icon: <CalendarCheck className="w-5 h-5 mr-3" /> },
    { name: "Strategic Planning", path: "/strategy", icon: <Swords className="w-5 h-5 mr-3" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5 mr-3" /> },
  ];
  
  // Development and testing links - would be removed in production
  const devLinks = [
    { name: "WebSocket Test", path: "/websocket-test", icon: <Radio className="w-5 h-5 mr-3" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border p-5">
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Sales Sherpa</h1>
          <p className="text-xs text-muted-foreground">Accountability & Guidance</p>
        </div>
        <ThemeToggle />
      </div>
      
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
        
        {/* Development section */}
        <div className="text-xs uppercase text-muted-foreground font-semibold mt-6 mb-3 ml-2">
          Development
        </div>
        <ul className="space-y-1">
          {devLinks.map((link) => (
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
      </nav>
      
      <div className="border-t border-border pt-4 mt-auto">
        <div className="flex items-center p-3 bg-muted/50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
            <span className="text-sm font-medium text-primary">
              {userData?.name ? userData.name.split(" ").map(n => n[0]).join("") : "JD"}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userData?.name || "Jordan Doe"}</p>
            <p className="text-xs text-muted-foreground truncate">{userData?.role || "Fintech Sales Manager"}</p>
          </div>
          
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
