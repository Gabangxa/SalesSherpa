import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckInForm } from "@/components/forms/CheckInForm";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInDialog({ open, onOpenChange }: CheckInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Daily Check-in</DialogTitle>
          <DialogDescription>
            Share your progress, challenges, and goals to stay accountable and get personalized guidance.
          </DialogDescription>
        </DialogHeader>
        <CheckInForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
