import { useQuery } from "@tanstack/react-query";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import SalesAssistantChat from "@/components/dashboard/SalesAssistantChat";
import ProgressTracking from "@/components/dashboard/ProgressTracking";
import TodosAndReminders from "@/components/dashboard/TodosAndReminders";
import RecentCheckIns from "@/components/dashboard/RecentCheckIns";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export default function Dashboard() {
  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Welcome header with improved styling */}
      <div className="mb-8">
        <WelcomeSection name={user?.name || "Jordan"} />
      </div>
      {/* Main content area with improved grid layout and spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Sales Assistant & Check-ins (takes 2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          <SalesAssistantChat userName={user?.name || "Jordan Doe"} />
          <RecentCheckIns />
        </div>
        
        {/* Right column - Progress tracking and todos (takes 1/3 on large screens) */}
        <div className="space-y-8">
          <ProgressTracking />
          <TodosAndReminders />
        </div>
      </div>
    </div>
  );
}
