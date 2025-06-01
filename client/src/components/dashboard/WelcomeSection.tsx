import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDateWithDay, getGreeting } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Plus } from "lucide-react";
import { CheckInDialog } from "@/components/dialogs/CheckInDialog";
import { TimeOffDialog } from "@/components/dialogs/TimeOffDialog";

interface WelcomeSectionProps {
  name: string;
}

export default function WelcomeSection({ name }: WelcomeSectionProps) {
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  
  const todayDate = formatDateWithDay(new Date());
  const greeting = getGreeting();

  return (
    <div className="mb-10">
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {greeting}, {name}!
            </h1>
            <p className="text-gray-400 text-lg font-medium">{todayDate}</p>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 md:mt-0 flex space-x-4">
            <Button 
              onClick={() => setCheckInDialogOpen(true)} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-sm font-semibold rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Daily Check-in
            </Button>
            <Button 
              onClick={() => setTimeOffDialogOpen(true)} 
              variant="outline" 
              className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/30 backdrop-blur-sm px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Set Time Off
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CheckInDialog 
        open={checkInDialogOpen} 
        onOpenChange={setCheckInDialogOpen} 
      />
      
      <TimeOffDialog 
        open={timeOffDialogOpen} 
        onOpenChange={setTimeOffDialogOpen} 
      />
    </div>
  );
}
