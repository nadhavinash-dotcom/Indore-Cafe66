import { create } from 'zustand';

const useOrderStore = create((set) => ({
  todayOrders: [],
  subscription: null,
  setTodayOrders: (orders) => set({ todayOrders: orders }),
  setSubscription: (sub) => set({ subscription: sub }),
  updateOrderStatus: (id, status) =>
    set((state) => ({
      todayOrders: state.todayOrders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
}));

export default useOrderStore;
