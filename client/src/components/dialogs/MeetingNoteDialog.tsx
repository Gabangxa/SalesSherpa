import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { MeetingNoteForm } from '@/components/forms/MeetingNoteForm';
import { useMeetingNotes } from '@/hooks/use-meeting-notes';
import type { MeetingNote } from '@shared/schema';

interface MeetingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: MeetingNote | null;
}

export function MeetingNoteDialog({ open, onOpenChange, note }: MeetingNoteDialogProps) {
  const { createMutation, updateMutation } = useMeetingNotes();

  const handleSubmit = (data: Omit<MeetingNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (note) {
      updateMutation.mutate({ id: note.id, ...data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <VisuallyHidden><DialogTitle>{note ? 'Edit meeting note' : 'New meeting note'}</DialogTitle></VisuallyHidden>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-forest dark:text-parchment">
            {note ? 'Edit meeting note' : 'New meeting note'}
          </h2>
          <p className="text-xs text-forest/50 dark:text-parchment/50 mt-0.5">
            Fill in what's relevant — blank sections are fine.
          </p>
        </div>
        <MeetingNoteForm
          note={note ?? undefined}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
