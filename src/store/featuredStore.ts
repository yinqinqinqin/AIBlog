import { create } from "zustand";

type FeaturedStore = {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  next: (total: number) => void;
};

export const useFeaturedStore = create<FeaturedStore>((set) => ({
  currentIndex: 0,
  setCurrentIndex: (index) => set({ currentIndex: index }),
  next: (total) =>
    set((state) => ({
      currentIndex: total > 0 ? (state.currentIndex + 1) % total : 0,
    })),
}));
