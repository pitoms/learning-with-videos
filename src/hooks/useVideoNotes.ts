import { useState, useEffect, useCallback } from "react";
import type { VideoNote } from "../types";

const STORAGE_KEY = "video_notes";
const DEFAULT_ESTIMATED_DURATION = 30;

type NotesMap = Record<string, VideoNote[]>;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStoredNotes(): NotesMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredNotes(notes: NotesMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Storage full or unavailable
  }
}

interface UseVideoNotesResult {
  notes: VideoNote[];
  addNote: (content: string, timestamp: number) => VideoNote;
  deleteNote: (noteId: string) => void;
  updateNote: (noteId: string, content: string) => void;
}

export function useVideoNotes(
  videoId: string | undefined
): UseVideoNotesResult {
  const [notes, setNotes] = useState<VideoNote[]>([]);

  useEffect(() => {
    if (!videoId) return;
    const stored = getStoredNotes();
    setNotes(stored[videoId] || []);
  }, [videoId]);

  const addNote = useCallback(
    (content: string, timestamp: number): VideoNote => {
      if (!videoId) throw new Error("No videoId provided");

      const newNote: VideoNote = {
        id: generateId(),
        videoId,
        content,
        timestamp,
        estimatedDuration: DEFAULT_ESTIMATED_DURATION,
        createdAt: new Date().toISOString(),
      };

      setNotes((prev) => {
        const updated = [...prev, newNote].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        const stored = getStoredNotes();
        stored[videoId] = updated;
        saveStoredNotes(stored);
        return updated;
      });

      return newNote;
    },
    [videoId]
  );

  const deleteNote = useCallback(
    (noteId: string) => {
      if (!videoId) return;

      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== noteId);
        const stored = getStoredNotes();
        stored[videoId] = updated;
        saveStoredNotes(stored);
        return updated;
      });
    },
    [videoId]
  );

  const updateNote = useCallback(
    (noteId: string, content: string) => {
      if (!videoId) return;

      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === noteId ? { ...n, content } : n
        );
        const stored = getStoredNotes();
        stored[videoId] = updated;
        saveStoredNotes(stored);
        return updated;
      });
    },
    [videoId]
  );

  return { notes, addNote, deleteNote, updateNote };
}
