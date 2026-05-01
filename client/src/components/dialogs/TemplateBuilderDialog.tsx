import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useNoteTemplates } from '@/hooks/use-note-templates';
import type { NoteTemplate } from '@shared/schema';

interface TemplateSection {
  label: string;
  placeholder: string;
}

interface TemplateBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSections?: TemplateSection[];
  editTemplate?: NoteTemplate | null;
}

export function TemplateBuilderDialog({ open, onOpenChange, initialSections, editTemplate }: TemplateBuilderDialogProps) {
  const { createMutation, updateMutation } = useNoteTemplates();
  const [name, setName] = useState('');
  const [sections, setSections] = useState<TemplateSection[]>([
    { label: '', placeholder: '' },
  ]);

  useEffect(() => {
    if (open) {
      if (editTemplate) {
        setName(editTemplate.name);
        try {
          setSections(JSON.parse(editTemplate.sections));
        } catch {
          setSections([{ label: '', placeholder: '' }]);
        }
      } else if (initialSections && initialSections.length > 0) {
        setName('');
        setSections(initialSections);
      } else {
        setName('');
        setSections([{ label: '', placeholder: '' }]);
      }
    }
  }, [open, editTemplate, initialSections]);

  const addSection = () => setSections((s) => [...s, { label: '', placeholder: '' }]);

  const removeSection = (i: number) =>
    setSections((s) => s.filter((_, idx) => idx !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    setSections((s) => {
      const next = [...s];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveDown = (i: number) => {
    setSections((s) => {
      if (i === s.length - 1) return s;
      const next = [...s];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const updateSection = (i: number, field: keyof TemplateSection, value: string) =>
    setSections((s) => s.map((sec, idx) => idx === i ? { ...sec, [field]: value } : sec));

  const handleSave = () => {
    if (!name.trim() || sections.every((s) => !s.label.trim())) return;
    const payload = {
      name: name.trim(),
      sections: JSON.stringify(sections.filter((s) => s.label.trim())),
    };
    if (editTemplate) {
      updateMutation.mutate({ id: editTemplate.id, ...payload }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <VisuallyHidden><DialogTitle>Template Builder</DialogTitle></VisuallyHidden>
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-forest dark:text-parchment">
              {editTemplate ? 'Edit template' : 'Save as template'}
            </h2>
            <p className="text-xs text-forest/50 dark:text-parchment/50 mt-0.5">
              Define the sections that appear in notes using this template.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-name" className="text-xs font-medium text-forest/70 dark:text-parchment/70">
              Template name
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Discovery Call Template"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-forest/70 dark:text-parchment/70">Sections</Label>
            {sections.map((sec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-earth/15 dark:border-earth/10 bg-earth/5">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <Input
                    value={sec.label}
                    onChange={(e) => updateSection(i, 'label', e.target.value)}
                    placeholder="Section label (e.g., Pain Points)"
                    className="rounded-lg text-sm h-8"
                  />
                  <Input
                    value={sec.placeholder}
                    onChange={(e) => updateSection(i, 'placeholder', e.target.value)}
                    placeholder="Hint text shown in textarea (optional)"
                    className="rounded-lg text-xs h-7 text-forest/60 dark:text-parchment/60"
                  />
                </div>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="p-1 rounded text-forest/40 hover:text-forest dark:text-parchment/40 dark:hover:text-parchment disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === sections.length - 1}
                    className="p-1 rounded text-forest/40 hover:text-forest dark:text-parchment/40 dark:hover:text-parchment disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeSection(i)}
                  disabled={sections.length === 1}
                  className="p-1 rounded text-forest/30 hover:text-red-500 disabled:opacity-20 flex-shrink-0 mt-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSection}
              className="text-xs text-clay hover:text-clay/80 hover:bg-clay/5 gap-1 px-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add section
            </Button>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-clay hover:bg-clay/90 text-white"
              onClick={handleSave}
              disabled={isPending || !name.trim()}
            >
              {isPending ? 'Saving...' : 'Save template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
