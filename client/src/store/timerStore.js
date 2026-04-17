import { create } from 'zustand';

const useTimerStore = create((set) => ({
  meal: null,           // 'lunch' | 'dinner' | null
  secondsRemaining: 0,
  isOpen: false,
  bothOpen: false,
  lunchLocked: false,
  dinnerLocked: false,
  lastSyncedAt: null,

  setTimerData: (data) => set({
    meal: data.nextCutoff?.meal || null,
    secondsRemaining: data.nextCutoff?.secondsRemaining || 0,
    isOpen: data.nextCutoff?.isOpen || false,
    bothOpen: data.nextCutoff?.bothOpen || false,
    lunchLocked: !data.lunch?.available,
    dinnerLocked: !data.dinner?.available,
    lastSyncedAt: Date.now(),
  }),

  decrementTimer: () => set((state) => {
    if (state.secondsRemaining <= 0) return state;
    const newSeconds = state.secondsRemaining - 1;
    // If timer hits 0, lock current meal
    if (newSeconds === 0) {
      const updates = { secondsRemaining: 0, isOpen: false };
      if (state.meal === 'lunch') updates.lunchLocked = true;
      if (state.meal === 'dinner') updates.dinnerLocked = true;
      return { ...state, ...updates };
    }
    return { ...state, secondsRemaining: newSeconds };
  }),
}));

export default useTimerStore;
