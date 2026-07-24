import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type InterviewNotesStore = {
  notes: Record<string, string>;
  attachmentCounts: Record<string, number>;
  setNote: (questionId: string, value: string) => void;
  setAttachmentCount: (questionId: string, count: number) => void;
};

function createFallbackStorage(): Storage {
  const memory = new Map<string, string>();

  return {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key) {
      return memory.get(key) ?? null;
    },
    key(index) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key) {
      memory.delete(key);
    },
    setItem(key, value) {
      memory.set(key, value);
    },
  };
}

function resolveStorage() {
  const candidate = globalThis.localStorage;

  if (
    candidate &&
    typeof candidate.getItem === "function" &&
    typeof candidate.setItem === "function" &&
    typeof candidate.removeItem === "function"
  ) {
    return candidate;
  }

  return createFallbackStorage();
}

export const useInterviewNotesStore = create<InterviewNotesStore>()(
  persist(
    (set) => ({
      notes: {},
      attachmentCounts: {},
      setNote: (questionId, value) =>
        set((state) => {
          const nextNotes = { ...state.notes };
          if (value.trim()) {
            nextNotes[questionId] = value;
          } else {
            delete nextNotes[questionId];
          }
          return { notes: nextNotes };
        }),
      setAttachmentCount: (questionId, count) =>
        set((state) => {
          const nextCounts = { ...state.attachmentCounts };
          if (count > 0) {
            nextCounts[questionId] = count;
          } else {
            delete nextCounts[questionId];
          }
          return { attachmentCounts: nextCounts };
        }),
    }),
    {
      name: "ta-interview-notes",
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        notes: state.notes,
        attachmentCounts: state.attachmentCounts,
      }),
    },
  ),
);
