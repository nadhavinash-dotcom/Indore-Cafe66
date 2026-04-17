import { create } from 'zustand';

const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,

  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  clearOrders: () => set({ orders: [], currentOrder: null }),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, status }
          : state.currentOrder,
    })),
}));

export default useOrderStore;
