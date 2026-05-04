import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  customer: { token: 'ci_customer_token', user: 'ci_customer_user' },
  partner: { token: 'ci_partner_token', user: 'ci_partner_user' },
  admin: { token: 'ci_admin_token', user: 'ci_admin_user' },
};

const useAuthStore = create((set, get) => ({
  customer: null,
  partner: null,
  admin: null,
  hydrated: false,

  hydrate: async () => {
    const [customer, partner, admin] = await Promise.all([
      AsyncStorage.getItem(KEYS.customer.user),
      AsyncStorage.getItem(KEYS.partner.user),
      AsyncStorage.getItem(KEYS.admin.user),
    ]);
    set({
      customer: customer ? JSON.parse(customer) : null,
      partner: partner ? JSON.parse(partner) : null,
      admin: admin ? JSON.parse(admin) : null,
      hydrated: true,
    });
  },

  setAuth: async (role, data) => {
    const { token, user: userData, ...rest } = data;
    const userPayload = { token, ...rest, ...(userData || {}) };
    await AsyncStorage.setItem(KEYS[role].token, token);
    await AsyncStorage.setItem(KEYS[role].user, JSON.stringify(userPayload));
    set({ [role]: userPayload });
  },

  

  clearAuth: async (role) => {
    await AsyncStorage.multiRemove([KEYS[role].token, KEYS[role].user]);
    set({ [role]: null });
  },

  isAuthenticated: (role) => {
    return !!get()[role]?.token;
  },

  getToken: (role) => get()[role]?.token || null,
}));

export default useAuthStore;
