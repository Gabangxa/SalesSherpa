import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeOffForm } from "@/components/forms/TimeOffForm";

interface TimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeOffDialog({ open, onOpenChange }: TimeOffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Time Off</DialogTitle>
          <DialogDescription>
            Set your time off dates. During this period, you won't receive any check-in reminders or notifications.
          </DialogDescription>
        </DialogHeader>
        <TimeOffForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
