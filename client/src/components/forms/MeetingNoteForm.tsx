import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookmarkPlus } from 'lucide-react';
import { useNoteTemplates } from '@/hooks/use-note-templates';
import { TemplateBuilderDialog } from '@/components/dialogs/TemplateBuilderDialog';
import type { MeetingNote } from '@shared/schema';

export const STANDARD_TEMPLATE_ID = '__standard__';

export const STANDARD_SECTIONS = [
  { label: 'Key Discussion Points', placeholder: 'Main topics covered, decisions made...' },
  { label: 'Pain Points Identified', placeholder: 'What challenges did the prospect mention?' },
  { label: 'Action Items', placeholder: '- [Person]: [action] — [due date]' },
  { label: 'Next Steps / Follow-up', placeholder: 'What happens next and when?' },
];

const PURPOSES = ['Discovery', 'Demo', 'Follow-up', 'Proposal', 'Check-in', 'Internal', 'Other'];
const LOCATIONS = ['In-person', 'Zoom', 'Phone', 'Teams', 'Other'];

interface Section {
  label: string;
  placeholder: string;
  content: string;
}

export type MeetingNotePayload = Omit<MeetingNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface MeetingNoteFormProps {
  note?: MeetingNote;
  onSubmit: (data: MeetingNotePayload) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function MeetingNoteForm({ note, onSubmit, isSubmitting, onCancel }: MeetingNoteFormProps) {
  const { templates } = useNoteTemplates();
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(STANDARD_TEMPLATE_ID);
  const [sections, setSections] = useState<Section[]>(
    STANDARD_SECTIONS.map((s) => ({ ...s, content: '' }))
  );

  // Populate form when editing
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDate(new Date(note.date).toISOString().split('T')[0]);
      setCompany(note.company ?? '');
      setContactName(note.contactName ?? '');
      setPurpose(note.purpose ?? '');
      setLocation(note.location ?? '');
      setAttendees(note.attendees ?? '');

      try {
        const saved: { label: string; content: string }[] = JSON.parse(note.sections);
        const templateSections = getTemplateSections(note.templateId?.toString() ?? STANDARD_TEMPLATE_ID);
        setSections(
          templateSections.map((ts) => ({
            ...ts,
            content: saved.find((s) => s.label === ts.label)?.content ?? '',
          }))
        );
      } catch {
        setSections(STANDARD_SECTIONS.map((s) => ({ ...s, content: '' })));
      }

      setSelectedTemplateId(note.templateId?.toString() ?? STANDARD_TEMPLATE_ID);
    }
  }, [note]);

  function getTemplateSections(id: string): { label: string; placeholder: string }[] {
    if (id === STANDARD_TEMPLATE_ID) return STANDARD_SECTIONS;
    const found = templates.find((t) => t.id.toString() === id);
    if (!found) return STANDARD_SECTIONS;
    try {
      return JSON.parse(found.sections);
    } catch {
      return STANDARD_SECTIONS;
    }
  }

  const handleTemplateChange = (id: string) => {
    const hasContent = sections.some((s) => s.content.trim());
    if (hasContent && !confirm('Changing template will reset section content. Continue?')) return;
    setSelectedTemplateId(id);
    setSections(getTemplateSections(id).map((s) => ({ ...s, content: '' })));
  };

  const updateSection = (i: number, content: string) =>
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, content } : s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const templateId =
      selectedTemplateId === STANDARD_TEMPLATE_ID
        ? null
        : parseInt(selectedTemplateId, 10) || null;
    onSubmit({
      templateId,
      title: title.trim(),
      date: new Date(date),
      company: company.trim() || null,
      contactName: contactName.trim() || null,
      purpose: purpose || null,
      location: location || null,
      attendees: attendees.trim() || null,
      sections: JSON.stringify(sections.map(({ label, content }) => ({ label, content }))),
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Template selector */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs font-medium text-forest/60 dark:text-parchment/55 mb-1 block">Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STANDARD_TEMPLATE_ID}>Standard Sales Template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setTemplateBuilderOpen(true)}
            title="Save current sections as a new template"
            className="mt-5 p-2 rounded-xl text-forest/40 hover:text-clay dark:text-parchment/40 dark:hover:text-clay hover:bg-clay/5 transition-colors"
          >
            <BookmarkPlus className="h-4 w-4" />
          </button>
        </div>

        {/* Header fields */}
        <div className="p-4 rounded-2xl border border-earth/15 dark:border-earth/10 bg-cream/40 dark:bg-dark-card/40 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mn-title" className="text-xs font-medium text-forest/60 dark:text-parchment/55">
              Meeting title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="mn-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q2 Discovery Call — Acme Corp"
              className="rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mn-date" className="text-xs font-medium text-forest/60 dark:text-parchment/55">Date</Label>
              <Input
                id="mn-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-forest/60 dark:text-parchment/55">Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger className="rounded-xl h-10 text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mn-company" className="text-xs font-medium text-forest/60 dark:text-parchment/55">Company / Prospect</Label>
              <Input id="mn-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mn-contact" className="text-xs font-medium text-forest/60 dark:text-parchment/55">Contact name(s)</Label>
              <Input id="mn-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane Smith" className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-forest/60 dark:text-parchment/55">Location / Medium</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="rounded-xl h-10 text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mn-attendees" className="text-xs font-medium text-forest/60 dark:text-parchment/55">Attendees</Label>
              <Input id="mn-attendees" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="John, Sarah…" className="rounded-xl" />
            </div>
          </div>
        </div>

        {/* Dynamic sections */}
        <div className="space-y-4">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-1.5">
              <Label className="text-xs font-medium text-forest/70 dark:text-parchment/60">{sec.label}</Label>
              <Textarea
                value={sec.content}
                onChange={(e) => updateSection(i, e.target.value)}
                placeholder={sec.placeholder}
                rows={3}
                className="rounded-xl resize-none text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="rounded-xl bg-clay hover:bg-clay/90 text-white"
          >
            {isSubmitting ? 'Saving…' : note ? 'Update note' : 'Save note'}
          </Button>
        </div>
      </form>

      <TemplateBuilderDialog
        open={templateBuilderOpen}
        onOpenChange={setTemplateBuilderOpen}
        initialSections={sections.map(({ label, placeholder }) => ({ label, placeholder }))}
      />
    </>
  );
}
