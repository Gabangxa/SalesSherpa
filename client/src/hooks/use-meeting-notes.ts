import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { MeetingNote } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import type { MeetingNotePayload } from '@/components/forms/MeetingNoteForm';

function extractErrorMessage(error: Error): string {
  const data = (error as any).data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e: { path?: string[]; message: string }) =>
        e.path?.length ? `${e.path.join('.')}: ${e.message}` : e.message
      )
      .join(', ');
  }
  return error.message;
}

export function useMeetingNotes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);

  const { data: notes = [], isLoading } = useQuery<MeetingNote[]>({
    queryKey: ['/api/meeting-notes'],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: MeetingNotePayload) => {
      const res = await apiRequest('POST', '/api/meeting-notes', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Note saved', description: 'Meeting note has been saved.' });
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Could not save note', description: extractErrorMessage(error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: MeetingNotePayload & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/meeting-notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Note updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes'] });
      setSelectedNote(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Could not update note', description: extractErrorMessage(error), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/meeting-notes/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Note deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes'] });
      setSelectedNote(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Could not delete note', description: extractErrorMessage(error), variant: 'destructive' });
    },
  });

  return {
    notes,
    isLoading,
    selectedNote,
    setSelectedNote,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
