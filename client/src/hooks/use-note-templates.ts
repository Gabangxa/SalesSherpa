import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { NoteTemplate } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

export function useNoteTemplates() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: templates = [], isLoading } = useQuery<NoteTemplate[]>({
    queryKey: ['/api/note-templates'],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; sections: string; isDefault?: boolean }) => {
      const res = await apiRequest('POST', '/api/note-templates', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Template saved' });
      queryClient.invalidateQueries({ queryKey: ['/api/note-templates'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<NoteTemplate> & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/note-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Template updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/note-templates'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating template', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/note-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Template deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/note-templates'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting template', description: error.message, variant: 'destructive' });
    },
  });

  return { templates, isLoading, createMutation, updateMutation, deleteMutation };
}
