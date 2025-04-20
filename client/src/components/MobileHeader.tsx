import { Link } from "wouter";
import { 
  Home, 
  Target, 
  CalendarCheck, 
  Swords, 
  BookOpen,
  Menu, 
  X,
  LogOut,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

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
    { name: "Strategic Planning", path: "/strategy", icon: <Swords className="w-5 h-5 mr-3" /> },
    { name: "Resources", path: "/resources", icon: <BookOpen className="w-5 h-5 mr-3" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="ml-2 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">FinSales</h1>
        </div>
        <button 
          onClick={toggleMenu}
          className="text-muted-foreground p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`
          absolute top-[57px] left-0 right-0 bg-card border-b border-border shadow-lg transform transition-all duration-200 
          ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'}
        `}
      >
        <div className="px-4 py-3 max-h-[80vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
              <span className="text-sm font-medium text-primary">
                {userData?.name ? userData.name.split(" ").map(n => n[0]).join("") : "JD"}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{userData?.name || "Jordan Doe"}</p>
              <p className="text-xs text-muted-foreground">{userData?.role || "Fintech Sales Manager"}</p>
            </div>
          </div>

          <div className="text-xs uppercase text-muted-foreground font-semibold mb-2 px-2">
            Main Navigation
          </div>
          
          <nav>
            <ul className="space-y-1 mb-6">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    href={link.path}
                    onClick={toggleMenu}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
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
            
            <Separator className="my-4" />
            
            <button
              onClick={() => logoutMutation.mutate()}
              className="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
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
