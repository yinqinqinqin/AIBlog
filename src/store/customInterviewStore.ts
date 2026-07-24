import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CustomInterviewQuestion = {
  id: string;
  question: string;
  answer: string;
  module: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

type NewCustomQuestion = Omit<CustomInterviewQuestion, "id" | "createdAt" | "updatedAt">;

type CustomInterviewStore = {
  questions: CustomInterviewQuestion[];
  addQuestion: (question: NewCustomQuestion) => string;
  updateQuestion: (id: string, question: NewCustomQuestion) => void;
  removeQuestion: (id: string) => void;
  restoreQuestion: (question: CustomInterviewQuestion) => void;
  importQuestions: (questions: CustomInterviewQuestion[]) => void;
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
  const storage = globalThis.localStorage;
  return storage && typeof storage.getItem === "function" ? storage : createFallbackStorage();
}

function createQuestionId() {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useCustomInterviewStore = create<CustomInterviewStore>()(
  persist(
    (set) => ({
      questions: [],
      addQuestion: (question) => {
        const id = createQuestionId();
        const now = Date.now();
        set((state) => ({
          questions: [...state.questions, { ...question, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },
      updateQuestion: (id, question) =>
        set((state) => ({
          questions: state.questions.map((item) =>
            item.id === id ? { ...item, ...question, updatedAt: Date.now() } : item,
          ),
        })),
      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((question) => question.id !== id),
        })),
      restoreQuestion: (question) =>
        set((state) => ({
          questions: state.questions.some((item) => item.id === question.id)
            ? state.questions
            : [...state.questions, question],
        })),
      importQuestions: (incomingQuestions) =>
        set((state) => {
          const merged = new Map(state.questions.map((question) => [question.id, question]));
          incomingQuestions.forEach((question) => merged.set(question.id, question));
          return { questions: Array.from(merged.values()) };
        }),
    }),
    {
      name: "custom-interview-wiki",
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({ questions: state.questions }),
    },
  ),
);
