import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMeetingNotes } from '@/hooks/use-meeting-notes';
import { useNoteTemplates } from '@/hooks/use-note-templates';
import { MeetingNoteDialog } from '@/components/dialogs/MeetingNoteDialog';
import { TemplateBuilderDialog } from '@/components/dialogs/TemplateBuilderDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  NotebookPen,
  Plus,
  Edit,
  Trash2,
  Building2,
  User2,
  MapPin,
  CalendarDays,
  Users,
  LayoutTemplate,
  Pencil,
} from 'lucide-react';
import type { MeetingNote, NoteTemplate } from '@shared/schema';

const PURPOSE_COLORS: Record<string, string> = {
  Discovery: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  Demo: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Follow-up': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Proposal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Check-in': 'bg-clay/15 text-clay dark:bg-clay/20 dark:text-clay/90',
  Internal: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  Other: 'bg-earth/15 text-forest/60 dark:bg-earth/10 dark:text-parchment/50',
};

function formatNoteDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface SectionEntry { label: string; content: string; }

function parseSections(raw: string): SectionEntry[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function NoteCard({ note, onView, onEdit, onDelete }: {
  note: MeetingNote;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sections = parseSections(note.sections);
  const firstSection = sections.find((s) => s.content?.trim());

  return (
    <div
      className="p-4 rounded-2xl border border-earth/15 dark:border-earth/10 bg-cream/40 dark:bg-dark-card/40 hover:border-earth/30 dark:hover:border-earth/20 transition-all cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {note.purpose && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PURPOSE_COLORS[note.purpose] ?? PURPOSE_COLORS.Other}`}>
                {note.purpose}
              </span>
            )}
            <span className="text-xs text-forest/40 dark:text-parchment/35 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatNoteDate(note.date)}
            </span>
          </div>
          <p className="text-sm font-semibold text-forest dark:text-parchment truncate">{note.title}</p>
          {note.company && (
            <p className="text-xs text-forest/55 dark:text-parchment/50 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{note.company}{note.contactName ? ` — ${note.contactName}` : ''}</span>
            </p>
          )}
          {firstSection && (
            <p className="text-xs text-forest/40 dark:text-parchment/35 mt-1.5 line-clamp-2 leading-relaxed">
              {firstSection.content}
            </p>
          )}
        </div>
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="icon" className="h-7 w-7 text-forest/40 hover:text-forest dark:text-parchment/40" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-forest/40 hover:text-red-500" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoteDetailView({ note, onEdit, onClose }: { note: MeetingNote; onEdit: () => void; onClose: () => void }) {
  const sections = parseSections(note.sections);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {note.purpose && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PURPOSE_COLORS[note.purpose] ?? PURPOSE_COLORS.Other}`}>
                {note.purpose}
              </span>
            )}
            {note.location && (
              <span className="text-[10px] text-forest/45 dark:text-parchment/40 flex items-center gap-1">
                <MapPin className="h-3 w-3" />{note.location}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-forest dark:text-parchment">{note.title}</h2>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl flex-shrink-0 gap-1.5" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-earth/5 dark:bg-earth/5 border border-earth/10 text-xs">
        <div className="flex items-center gap-1.5 text-forest/60 dark:text-parchment/50">
          <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{formatNoteDate(note.date)}</span>
        </div>
        {note.company && (
          <div className="flex items-center gap-1.5 text-forest/60 dark:text-parchment/50">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{note.company}</span>
          </div>
        )}
        {note.contactName && (
          <div className="flex items-center gap-1.5 text-forest/60 dark:text-parchment/50">
            <User2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{note.contactName}</span>
          </div>
        )}
        {note.attendees && (
          <div className="flex items-center gap-1.5 text-forest/60 dark:text-parchment/50 col-span-2">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{note.attendees}</span>
          </div>
        )}
      </div>

      {sections.filter((s) => s.content?.trim()).map((sec, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-xs font-semibold text-forest/60 dark:text-parchment/55 uppercase tracking-wide">{sec.label}</p>
          <p className="text-sm text-forest dark:text-parchment whitespace-pre-wrap leading-relaxed">{sec.content}</p>
        </div>
      ))}

      <button onClick={onClose} className="text-xs text-forest/40 dark:text-parchment/35 hover:text-forest dark:hover:text-parchment transition-colors">
        ← Back to list
      </button>
    </div>
  );
}

function TemplateManagerPanel({ onClose }: { onClose: () => void }) {
  const { templates, deleteMutation } = useNoteTemplates();
  const [editTemplate, setEditTemplate] = useState<NoteTemplate | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-forest dark:text-parchment">My templates</h3>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs" onClick={() => { setEditTemplate(null); setBuilderOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> New template
        </Button>
      </div>

      <div className="p-3 rounded-xl border border-earth/15 dark:border-earth/10 bg-earth/5">
        <p className="text-xs font-medium text-forest/70 dark:text-parchment/60">Standard Sales Template</p>
        <p className="text-[10px] text-forest/40 dark:text-parchment/35 mt-0.5">Built-in — cannot be edited or deleted</p>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-forest/40 dark:text-parchment/35 text-center py-4">No custom templates yet.</p>
      ) : (
        templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-earth/15 dark:border-earth/10 bg-earth/5">
            <span className="text-xs font-medium text-forest dark:text-parchment">{t.name}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-forest/40 hover:text-forest dark:text-parchment/40" onClick={() => { setEditTemplate(t); setBuilderOpen(true); }}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-forest/40 hover:text-red-500" onClick={() => deleteMutation.mutate(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}

      <button onClick={onClose} className="text-xs text-forest/40 dark:text-parchment/35 hover:text-forest dark:hover:text-parchment transition-colors">
        ← Back to notes
      </button>

      <TemplateBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} editTemplate={editTemplate} />
    </div>
  );
}

export default function MeetingNotesPage() {
  const { notes, isLoading, selectedNote, setSelectedNote, deleteMutation } = useMeetingNotes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<MeetingNote | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'templates'>('list');

  const openCreate = () => { setEditNote(null); setDialogOpen(true); };
  const openEdit = (note: MeetingNote) => { setEditNote(note); setDialogOpen(true); };
  const openDetail = (note: MeetingNote) => { setSelectedNote(note); setView('detail'); };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-forest dark:text-parchment flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-clay" />
            Meeting Notes
          </h1>
          <p className="text-sm text-forest/50 dark:text-parchment/50 mt-0.5">
            Capture sales calls, demos, and client conversations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs"
            onClick={() => setView('templates')}
          >
            <LayoutTemplate className="h-3.5 w-3.5" /> Templates
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-clay hover:bg-clay/90 text-white gap-1.5"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> New note
          </Button>
        </div>
      </div>

      {view === 'templates' ? (
        <TemplateManagerPanel onClose={() => setView('list')} />
      ) : view === 'detail' && selectedNote ? (
        <NoteDetailView
          note={selectedNote}
          onEdit={() => { openEdit(selectedNote); }}
          onClose={() => setView('list')}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-clay border-t-transparent" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-earth/30 dark:border-earth/15 bg-earth/5">
          <NotebookPen className="mx-auto h-8 w-8 text-forest/25 dark:text-parchment/25 mb-3" />
          <p className="text-sm font-medium text-forest/60 dark:text-parchment/55">No notes yet</p>
          <p className="text-xs text-forest/40 dark:text-parchment/35 mt-1 mb-4">
            Start capturing your sales conversations.
          </p>
          <Button size="sm" className="rounded-xl bg-clay hover:bg-clay/90 text-white" onClick={openCreate}>
            New note
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onView={() => openDetail(note)}
              onEdit={() => openEdit(note)}
              onDelete={() => setDeleteTargetId(note.id)}
            />
          ))}
        </div>
      )}

      <MeetingNoteDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditNote(null); }}
        note={editNote}
      />

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-forest dark:text-parchment">Delete note</AlertDialogTitle>
            <AlertDialogDescription className="text-forest/55 dark:text-parchment/55">
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl"
              onClick={() => { if (deleteTargetId) deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
