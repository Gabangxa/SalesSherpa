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

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  startingAmount?: number;
  deadline: string;
  category: string;
  valueType?: string;
}

interface GoalDialogProps {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  goal?: Goal; // Optional goal for editing
}

export function GoalDialog({ trigger, open, onOpenChange, goal }: GoalDialogProps) {
  const handleSuccess = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const isEditing = !!goal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your goal details and track your progress"
              : "Set a measurable goal to track your sales performance progress"
            }
          </DialogDescription>
        </DialogHeader>
        <GoalForm 
          goal={goal}
          onSuccess={handleSuccess} 
          onCancel={() => onOpenChange?.(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}