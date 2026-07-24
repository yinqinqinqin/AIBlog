import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type StudyTaskStatus = "todo" | "doing" | "done";

export type StudyTask = {
  id: string;
  title: string;
  status: StudyTaskStatus;
  createdAt: string;
  updatedAt: string;
};

type StudyTaskInput = {
  title: string;
  status: StudyTaskStatus;
};

type StudyPlanStore = {
  tasks: StudyTask[];
  selectedTaskId: string | null;
  selectTask: (taskId: string | null) => void;
  createTask: (input: StudyTaskInput) => string;
  updateTask: (taskId: string, input: StudyTaskInput) => void;
  deleteTask: (taskId: string) => void;
};

function buildId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

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

export const useStudyPlanStore = create<StudyPlanStore>()(
  persist(
    (set) => ({
      tasks: [],
      selectedTaskId: null,
      selectTask: (selectedTaskId) => set({ selectedTaskId }),
      createTask: ({ title, status }) => {
        const taskId = buildId("study-task");
        const now = new Date().toISOString();

        set((state) => ({
          tasks: [
            {
              id: taskId,
              title: title.trim(),
              status,
              createdAt: now,
              updatedAt: now,
            },
            ...state.tasks,
          ],
          selectedTaskId: taskId,
        }));

        return taskId;
      },
      updateTask: (taskId, { title, status }) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  title: title.trim(),
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
        })),
      deleteTask: (taskId) =>
        set((state) => {
          const nextTasks = state.tasks.filter((task) => task.id !== taskId);
          const nextSelectedTaskId =
            state.selectedTaskId === taskId ? (nextTasks[0]?.id ?? null) : state.selectedTaskId;

          return {
            tasks: nextTasks,
            selectedTaskId: nextSelectedTaskId,
          };
        }),
    }),
    {
      name: "study-plan-store",
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        selectedTaskId: state.selectedTaskId,
      }),
    },
  ),
);
