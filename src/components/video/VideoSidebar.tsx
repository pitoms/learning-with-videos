import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, Edit2, Plus, Trash2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Textarea, Button } from "../ui";
import { useVideoPlayer } from "../../contexts";
import type { Video, VideoNote } from "../../types";

interface VideoSidebarProps {
  video: Video;
  notes: VideoNote[];
  addNote: (content: string, timestamp: number) => VideoNote;
  deleteNote: (noteId: string) => void;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface NoteItemProps {
  note: VideoNote;
  onDelete: (id: string) => void;
  onSeek: (timestamp: number) => void;
  isActive: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}

function NoteItem({ note, onDelete, onSeek, isActive, setRef }: NoteItemProps) {
  return (
    <div
      ref={setRef}
      onClick={() => onSeek(note.timestamp)}
      className={`group relative p-3 rounded-lg transition-colors cursor-pointer ${
        isActive
          ? "bg-primary/10 ring-1 ring-primary/30"
          : "bg-muted/50 hover:bg-muted"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-primary mb-1.5 font-medium">
        <Clock className="w-3 h-3" />
        {formatTimestamp(note.timestamp)}
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words pr-6">
        {note.content}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.id);
        }}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
        aria-label="Delete note"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function VideoSidebar({
  video,
  notes,
  addNote,
  deleteNote,
}: VideoSidebarProps) {
  const [noteInput, setNoteInput] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [heldTimestamp, setHeldTimestamp] = useState<number | null>(null);
  const [displayedTime, setDisplayedTime] = useState(0);
  const { seekTo, videoRef, ytPlayerRef } = useVideoPlayer();
  const noteRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const notesContainerRef = useRef<HTMLDivElement>(null);

  const getCurrentTime = useCallback((): number => {
    if (ytPlayerRef.current) {
      return ytPlayerRef.current.getCurrentTime();
    }
    if (videoRef.current) {
      return videoRef.current.currentTime;
    }
    return 0;
  }, [ytPlayerRef, videoRef]);

  // Update displayed time at a consistent rate to prevent flickering
  useEffect(() => {
    const interval = setInterval(() => {
      if (heldTimestamp === null) {
        setDisplayedTime(getCurrentTime());
      }
    }, 500);
    return () => clearInterval(interval);
  }, [heldTimestamp, getCurrentTime]);

  const handleSaveNote = () => {
    if (!noteInput.trim()) return;
    const timestamp = getCurrentTime();
    addNote(noteInput.trim(), timestamp);
    setNoteInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveNote();
      setHeldTimestamp(null);
    }
  };

  const handleTextareaFocus = () => {
    setHeldTimestamp(getCurrentTime());
  };

  const handleTextareaBlur = () => {
    setHeldTimestamp(null);
  };

  const prevVideoId = useRef(video.id);
  // eslint-disable-next-line react-hooks/refs
  if (prevVideoId.current !== video.id) {
    // eslint-disable-next-line react-hooks/refs
    prevVideoId.current = video.id;
    setActiveNoteId(null);
    setHeldTimestamp(null);
  }

  useEffect(() => {
    const updateActiveNote = () => {
      const currentTime = getCurrentTime();
      if (notes.length === 0) {
        setActiveNoteId(null);
        return;
      }
      const activeNote = notes
        .filter((n) => n.timestamp <= currentTime)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      if (activeNote && activeNote.id !== activeNoteId) {
        setActiveNoteId(activeNote.id);
        const noteEl = noteRefs.current.get(activeNote.id);
        const container = notesContainerRef.current;
        if (noteEl && container) {
          const noteTop = noteEl.offsetTop - container.offsetTop - 8;
          container.scrollTo({ top: noteTop, behavior: "smooth" });
        }
      } else if (!activeNote && activeNoteId !== null) {
        setActiveNoteId(null);
      }
    };
    const interval = setInterval(updateActiveNote, 500);
    return () => clearInterval(interval);
  }, [notes, activeNoteId, video.id, getCurrentTime]);

  return (
    <div className="w-full lg:w-[360px] lg:border-l border-border bg-card lg:h-full lg:overflow-hidden flex flex-col">
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-card-foreground">
            {video.title}
          </h2>
          <Link
            to={`/video/${video.id}/edit`}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span>{video.user_id}</span>
          {video.created_at && (
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
          )}
        </div>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {video.description}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Add Note</h3>
              <span className="text-xs text-muted-foreground">
                at {formatTimestamp(heldTimestamp ?? displayedTime)}
              </span>
            </div>
            <Textarea
              placeholder="What did you learn at this moment? (Enter to save)"
              className="min-h-[60px] resize-none text-sm"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value.slice(0, 150))}
              onKeyDown={handleKeyDown}
              onFocus={handleTextareaFocus}
              onBlur={handleTextareaBlur}
              maxLength={150}
            />
            <span className="text-xs text-muted-foreground text-right">
              {noteInput.length}/150
            </span>
            <Button
              className="w-full"
              size="sm"
              disabled={!noteInput.trim()}
              onClick={handleSaveNote}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Save Note
            </Button>
          </div>
          {notes.length > 0 && (
            <div className="space-y-2 pt-3 mt-3 border-t border-border">
              <h3 className="text-sm font-medium text-foreground">
                Your Notes ({notes.length})
              </h3>
              <div
                ref={notesContainerRef}
                className="space-y-2 max-h-[50vh] overflow-y-auto p-1 -m-1"
              >
                {notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onDelete={deleteNote}
                    onSeek={seekTo}
                    isActive={note.id === activeNoteId}
                    setRef={(el) => noteRefs.current.set(note.id, el)}
                  />
                ))}
              </div>
            </div>
          )}
          {notes.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <BookOpen className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
              <p className="text-xs">No notes yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
