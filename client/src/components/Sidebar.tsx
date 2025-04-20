import { Link } from "wouter";
import { 
  Home, 
  Target, 
  CalendarCheck, 
  Swords, 
  BookOpen,
  Settings
} from "lucide-react";

interface SidebarProps {
  userData: {
    name: string;
    role: string;
  };
  currentPath: string;
}

export default function Sidebar({ userData, currentPath }: SidebarProps) {
  const navLinks = [
    { name: "Dashboard", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { name: "Goals & Targets", path: "/goals", icon: <Target className="w-5 h-5 mr-3" /> },
    { name: "Check-ins", path: "/check-ins", icon: <CalendarCheck className="w-5 h-5 mr-3" /> },
    { name: "Strategic Planning", path: "/strategy", icon: <Swords className="w-5 h-5 mr-3" /> },
    { name: "Resources", path: "/resources", icon: <BookOpen className="w-5 h-5 mr-3" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200 p-5">
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="ml-3">
          <h1 className="text-xl font-bold text-neutral-900">FinSales</h1>
          <p className="text-xs text-neutral-500">Virtual Sales Mentor</p>
        </div>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link 
                href={link.path} 
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPath === link.path 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="border-t border-neutral-200 pt-4 mt-6">
        <div className="flex items-center px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center">
            <span className="text-xs font-medium text-neutral-700">
              {userData?.name ? userData.name.split(" ").map(n => n[0]).join("") : "JD"}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900">{userData?.name || "Jordan Doe"}</p>
            <p className="text-xs text-neutral-500">{userData?.role || "Fintech Sales Manager"}</p>
          </div>
          <button className="ml-auto text-neutral-400 hover:text-neutral-600">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
