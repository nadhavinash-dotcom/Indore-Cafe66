import { create } from 'zustand';
import { setToken, clearToken, getToken } from '../lib/api';

const useAuthStore = create((set) => ({
  // Customer
  customer: JSON.parse(localStorage.getItem('ci_customer_user') || 'null'),
  customerToken: getToken('customer'),
  setCustomer: (user, token) => {
    localStorage.setItem('ci_customer_user', JSON.stringify(user));
    setToken('customer', token);
    set({ customer: user, customerToken: token });
  },
  logoutCustomer: () => {
    localStorage.removeItem('ci_customer_user');
    clearToken('customer');
    set({ customer: null, customerToken: null });
  },

  // Partner
  partner: JSON.parse(localStorage.getItem('ci_partner_user') || 'null'),
  partnerToken: getToken('partner'),
  setPartner: (user, token) => {
    localStorage.setItem('ci_partner_user', JSON.stringify(user));
    setToken('partner', token);
    set({ partner: user, partnerToken: token });
  },
  logoutPartner: () => {
    localStorage.removeItem('ci_partner_user');
    clearToken('partner');
    set({ partner: null, partnerToken: null });
  },

  // Admin
  admin: JSON.parse(localStorage.getItem('ci_admin_user') || 'null'),
  adminToken: getToken('admin'),
  setAdmin: (user, token) => {
    localStorage.setItem('ci_admin_user', JSON.stringify(user));
    setToken('admin', token);
    set({ admin: user, adminToken: token });
  },
  logoutAdmin: () => {
    localStorage.removeItem('ci_admin_user');
    clearToken('admin');
    set({ admin: null, adminToken: null });
  },
}));

export default useAuthStore;
