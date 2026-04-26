import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { MeetingNote } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

export function useMeetingNotes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);

  const { data: notes = [], isLoading } = useQuery<MeetingNote[]>({
    queryKey: ['/api/meeting-notes'],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<MeetingNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/meeting-notes', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Note saved', description: 'Meeting note has been saved.' });
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving note', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MeetingNote> & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/meeting-notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Note updated', description: 'Meeting note has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes'] });
      setSelectedNote(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating note', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Error deleting note', description: error.message, variant: 'destructive' });
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
