import { useQuery } from "@tanstack/react-query";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import SalesAssistantChat from "@/components/dashboard/SalesAssistantChat";
import ProgressTracking from "@/components/dashboard/ProgressTracking";
import TodosAndReminders from "@/components/dashboard/TodosAndReminders";
import RecentCheckIns from "@/components/dashboard/RecentCheckIns";

export default function Dashboard() {
  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Welcome header with reduced padding */}
      <div className="mb-6">
        <WelcomeSection name={user?.name || "Jordan"} />
      </div>
      
      {/* Main content area with improved grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat and check-ins column (takes 2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <SalesAssistantChat userName={user?.name || "Jordan Doe"} />
          <RecentCheckIns />
        </div>
        
        {/* Progress tracking and todos column (takes 1/3 on large screens) */}
        <div className="space-y-6">
          <ProgressTracking />
          <TodosAndReminders />
        </div>
      </div>
    </div>
  );
}
