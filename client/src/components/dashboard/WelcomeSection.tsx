import { useState } from "react";
import { formatDateWithDay, getGreeting } from "@/lib/dateUtils";
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl font-light italic text-forest dark:text-parchment mb-1">
          {greeting}, {name}.
        </h1>
        <p className="text-sm text-forest/60 dark:text-parchment/60">{todayDate}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setTimeOffDialogOpen(true)}
          className="px-5 py-2.5 bg-white dark:bg-dark-card border border-earth/30 dark:border-earth/10 hover:bg-earth/5 dark:hover:bg-white/5 text-forest dark:text-parchment text-sm font-bold uppercase tracking-widest rounded-full transition-colors shadow-sm flex items-center gap-2"
        >
          <CalendarPlus className="w-4 h-4" />
          Time Off
        </button>
        <button
          onClick={() => setCheckInDialogOpen(true)}
          className="px-5 py-2.5 flex items-center gap-2 bg-clay hover:bg-clay/90 shadow-md text-white text-sm font-bold uppercase tracking-widest rounded-full transition-all"
        >
          <Plus className="w-4 h-4" />
          Daily Check-in
        </button>
      </div>

      <CheckInDialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen} />
      <TimeOffDialog open={timeOffDialogOpen} onOpenChange={setTimeOffDialogOpen} />
    </div>
  );
}
