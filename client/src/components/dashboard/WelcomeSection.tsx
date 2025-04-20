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
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {greeting}, {name}!
          </h1>
          <p className="text-neutral-600 mt-1">{todayDate}</p>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button 
            onClick={() => setCheckInDialogOpen(true)} 
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Daily Check-in
          </Button>
          <Button 
            onClick={() => setTimeOffDialogOpen(true)} 
            variant="outline" 
            className="text-sm"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Set Time Off
          </Button>
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
