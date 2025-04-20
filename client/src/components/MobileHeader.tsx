import { Link } from "wouter";
import { 
  Home, 
  Target, 
  CalendarCheck, 
  Swords, 
  BookOpen,
  Menu, 
  X 
} from "lucide-react";

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
  const navLinks = [
    { name: "Dashboard", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { name: "Goals & Targets", path: "/goals", icon: <Target className="w-5 h-5 mr-3" /> },
    { name: "Check-ins", path: "/check-ins", icon: <CalendarCheck className="w-5 h-5 mr-3" /> },
    { name: "Strategic Planning", path: "/strategy", icon: <Swords className="w-5 h-5 mr-3" /> },
    { name: "Resources", path: "/resources", icon: <BookOpen className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="ml-2 text-lg font-bold text-neutral-900">FinSales</h1>
        </div>
        <button 
          onClick={toggleMenu}
          className="text-neutral-500"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`px-4 py-2 pb-4 border-t border-neutral-200 ${isMenuOpen ? 'block' : 'hidden'}`}>
        <nav>
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link href={link.path}>
                  <a 
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPath === link.path 
                        ? "bg-primary-50 text-primary-700" 
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
