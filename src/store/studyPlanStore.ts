import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CustomStudyPlanTask = {
  id: string;
  label: string;
  completed: boolean;
};

export type CustomStudyPlan = {
  id: string;
  title: string;
  trackId: string;
  phaseId: string;
  duration: string;
  goal: string;
  tasks: CustomStudyPlanTask[];
  createdAt: string;
  updatedAt: string;
};

type CreateCustomPlanInput = {
  title: string;
  trackId: string;
  phaseId: string;
  duration: string;
  goal: string;
  tasks?: string[];
};

type StudyPlanStore = {
  activePhaseId: string;
  activeTrackId: string;
  completedTaskIds: string[];
  completedRoutineIds: string[];
  customPlans: CustomStudyPlan[];
  selectedPlanId: string | null;
  setActivePhaseId: (phaseId: string) => void;
  setActiveTrackId: (trackId: string) => void;
  toggleTask: (taskId: string) => void;
  toggleRoutine: (routineId: string) => void;
  selectPlan: (planId: string | null) => void;
  createPlan: (input: CreateCustomPlanInput) => string;
  updatePlan: (planId: string, input: CreateCustomPlanInput) => void;
  deletePlan: (planId: string) => void;
  addPlanTask: (planId: string, label: string) => void;
  updatePlanTask: (planId: string, taskId: string, label: string) => void;
  togglePlanTask: (planId: string, taskId: string) => void;
  deletePlanTask: (planId: string, taskId: string) => void;
};

function toggleId(ids: string[], target: string) {
  return ids.includes(target) ? ids.filter((id) => id !== target) : [...ids, target];
}

function buildId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildTasks(tasks: string[]) {
  return tasks
    .map((task) => task.trim())
    .filter(Boolean)
    .map((label) => ({
      id: buildId("plan-task"),
      label,
      completed: false,
    }));
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
      activePhaseId: "foundation",
      activeTrackId: "rendering",
      completedTaskIds: [],
      completedRoutineIds: [],
      customPlans: [],
      selectedPlanId: null,
      setActivePhaseId: (activePhaseId) => set({ activePhaseId }),
      setActiveTrackId: (activeTrackId) => set({ activeTrackId }),
      toggleTask: (taskId) =>
        set((state) => ({
          completedTaskIds: toggleId(state.completedTaskIds, taskId),
        })),
      toggleRoutine: (routineId) =>
        set((state) => ({
          completedRoutineIds: toggleId(state.completedRoutineIds, routineId),
        })),
      selectPlan: (selectedPlanId) => set({ selectedPlanId }),
      createPlan: ({ title, trackId, phaseId, duration, goal, tasks }) => {
        const planId = buildId("study-plan");
        const now = new Date().toISOString();

        set((state) => ({
          customPlans: [
            {
              id: planId,
              title: title.trim(),
              trackId,
              phaseId,
              duration: duration.trim(),
              goal: goal.trim(),
              tasks: buildTasks(tasks ?? []),
              createdAt: now,
              updatedAt: now,
            },
            ...state.customPlans,
          ],
          selectedPlanId: planId,
          activeTrackId: trackId,
          activePhaseId: phaseId,
        }));

        return planId;
      },
      updatePlan: (planId, { title, trackId, phaseId, duration, goal, tasks }) =>
        set((state) => ({
          customPlans: state.customPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  title: title.trim(),
                  trackId,
                  phaseId,
                  duration: duration.trim(),
                  goal: goal.trim(),
                  tasks: tasks ? buildTasks(tasks) : plan.tasks,
                  updatedAt: new Date().toISOString(),
                }
              : plan,
          ),
          activeTrackId: trackId,
          activePhaseId: phaseId,
        })),
      deletePlan: (planId) =>
        set((state) => {
          const nextPlans = state.customPlans.filter((plan) => plan.id !== planId);
          const nextSelectedPlanId =
            state.selectedPlanId === planId ? (nextPlans[0]?.id ?? null) : state.selectedPlanId;

          return {
            customPlans: nextPlans,
            selectedPlanId: nextSelectedPlanId,
          };
        }),
      addPlanTask: (planId, label) =>
        set((state) => ({
          customPlans: state.customPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  tasks: [
                    ...plan.tasks,
                    {
                      id: buildId("plan-task"),
                      label: label.trim(),
                      completed: false,
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : plan,
          ),
        })),
      updatePlanTask: (planId, taskId, label) =>
        set((state) => ({
          customPlans: state.customPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  tasks: plan.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          label: label.trim(),
                        }
                      : task,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : plan,
          ),
        })),
      togglePlanTask: (planId, taskId) =>
        set((state) => ({
          customPlans: state.customPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  tasks: plan.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          completed: !task.completed,
                        }
                      : task,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : plan,
          ),
        })),
      deletePlanTask: (planId, taskId) =>
        set((state) => ({
          customPlans: state.customPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  tasks: plan.tasks.filter((task) => task.id !== taskId),
                  updatedAt: new Date().toISOString(),
                }
              : plan,
          ),
        })),
    }),
    {
      name: "study-plan-store",
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        activePhaseId: state.activePhaseId,
        activeTrackId: state.activeTrackId,
        completedTaskIds: state.completedTaskIds,
        completedRoutineIds: state.completedRoutineIds,
        customPlans: state.customPlans,
        selectedPlanId: state.selectedPlanId,
      }),
    },
  ),
);
