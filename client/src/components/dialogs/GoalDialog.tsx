import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoalForm } from "@/components/forms/GoalForm";
import { ReactNode } from "react";

interface GoalDialogProps {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GoalDialog({ trigger, open, onOpenChange }: GoalDialogProps) {
  const handleSuccess = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Set a measurable goal to track your sales performance progress
          </DialogDescription>
        </DialogHeader>
        <GoalForm onSuccess={handleSuccess} onCancel={() => onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  );
}