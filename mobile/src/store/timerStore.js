import { create } from 'zustand';

const useTimerStore = create((set) => ({
  lunch: { secondsRemaining: 0, isOpen: false, nextOpenAt: null },
  dinner: { secondsRemaining: 0, isOpen: false, nextOpenAt: null },

  setMealTimer: (meal, data) =>
    set((state) => ({ [meal]: { ...state[meal], ...data } })),

  tick: (meal) =>
    set((state) => {
      const current = state[meal];
      if (!current.isOpen || current.secondsRemaining <= 0) return state;
      const next = current.secondsRemaining - 1;
      return { [meal]: { ...current, secondsRemaining: next, isOpen: next > 0 } };
    }),
}));

export default useTimerStore;
