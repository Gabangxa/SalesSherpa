import { Link } from "wouter";
import {
  Home,
  Target,
  CalendarCheck,
  Mountain,
  Menu,
  X,
  LogOut,
  Settings,
  Radio,
  NotebookPen,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface MobileHeaderProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  userData: {
    name: string;
    role: string;
  };
  currentPath: string;
}

export default function MobileHeader({ isMenuOpen, toggleMenu, userData, currentPath }: MobileHeaderProps) {
  const { logoutMutation } = useAuth();
  
  const navLinks = [
    { name: "Dashboard", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { name: "Goals & Targets", path: "/goals", icon: <Target className="w-5 h-5 mr-3" /> },
    { name: "Check-ins", path: "/check-ins", icon: <CalendarCheck className="w-5 h-5 mr-3" /> },
    { name: "Meeting Notes", path: "/meeting-notes", icon: <NotebookPen className="w-5 h-5 mr-3" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5 mr-3" /> },
  ];
  
  // Development and testing links
  const devLinks = [
    { name: "WebSocket Test", path: "/websocket-test", icon: <Radio className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-moss dark:bg-dark-sidebar text-white border-b border-white/10 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-lg bg-clay flex items-center justify-center shadow-md">
            <Mountain className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-2 text-lg font-bold text-forest dark:text-parchment">SalesSherpa</h1>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={toggleMenu}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`
          absolute top-[57px] left-0 right-0 bg-moss dark:bg-dark-sidebar border-b border-white/10 shadow-lg transform transition-all duration-200
          ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'}
        `}
      >
        <div className="px-4 py-3 max-h-[80vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-white/10 rounded-xl flex items-center">
            <div className="w-10 h-10 rounded-full bg-clay/40 flex items-center justify-center shadow-sm">
              <span className="text-sm font-medium text-white">
                {userData?.name ? userData.name.split(" ").map(n => n[0]).join("") : "U"}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{userData?.name || "User"}</p>
              <p className="text-xs text-white/60">{userData?.role || "Sales Rep"}</p>
            </div>
          </div>

          <div className="text-xs uppercase text-white/50 font-semibold mb-2 px-2">
            Main Navigation
          </div>
          
          <nav>
            <ul className="space-y-1 mb-6">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    href={link.path}
                    onClick={toggleMenu}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                      currentPath === link.path
                        ? "bg-sage/40 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Development section */}
            <div className="text-xs uppercase text-white/40 font-semibold mt-6 mb-2 px-2">
              Development
            </div>
            <ul className="space-y-1 mb-6">
              {devLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    onClick={toggleMenu}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                      currentPath === link.path
                        ? "bg-sage/40 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <Separator className="my-4" />
            
            <button
              onClick={() => logoutMutation.mutate()}
              className="w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl text-red-300 hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
