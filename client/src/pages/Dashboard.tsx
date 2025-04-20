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
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <WelcomeSection name={user?.name || "Jordan"} />
      
      <SalesAssistantChat userName={user?.name || "Jordan Doe"} />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <ProgressTracking />
        <TodosAndReminders />
      </div>
      
      <RecentCheckIns />
    </div>
  );
}
