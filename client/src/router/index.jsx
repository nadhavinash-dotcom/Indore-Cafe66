import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Customer
import Splash from '../pages/customer/Splash';
import CustomerLogin from '../pages/customer/CustomerLogin';
import PlanSelection from '../pages/customer/PlanSelection';
import AddressForm from '../pages/customer/AddressForm';
import Payment from '../pages/customer/Payment';
import PaymentSuccess from '../pages/customer/PaymentSuccess';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import BookMeal from '../pages/customer/BookMeal';
import OrderHistory from '../pages/customer/OrderHistory';
import Profile from '../pages/customer/Profile';

// Partner
import PartnerLogin from '../pages/partner/PartnerLogin';
import PartnerDashboard from '../pages/partner/PartnerDashboard';
import OrderDetail from '../pages/partner/OrderDetail';
import PartnerProfile from '../pages/partner/PartnerProfile';

// Admin
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import KitchenPrepList from '../pages/admin/KitchenPrepList';
import OrdersTable from '../pages/admin/OrdersTable';
import CustomersTable from '../pages/admin/CustomersTable';
import PartnersTable from '../pages/admin/PartnersTable';
import Revenue from '../pages/admin/Revenue';
import Support from '../pages/admin/Support';
import Settings from '../pages/admin/Settings';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/customer/login" replace /> },

  // Customer portal
  // { path: '/customer', element: <Splash /> },
  { path: '/customer/login', element: <CustomerLogin /> },
  { path: '/customer/plans', element: <PlanSelection /> },
  { path: '/customer/address', element: <ProtectedRoute role="customer"><AddressForm /></ProtectedRoute> },
  { path: '/customer/payment', element: <ProtectedRoute role="customer"><Payment /></ProtectedRoute> },
  { path: '/customer/success', element: <ProtectedRoute role="customer"><PaymentSuccess /></ProtectedRoute> },
  { path: '/customer/dashboard', element: <ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute> },
  { path: '/customer/book', element: <ProtectedRoute role="customer"><BookMeal /></ProtectedRoute> },
  { path: '/customer/orders', element: <ProtectedRoute role="customer"><OrderHistory /></ProtectedRoute> },
  { path: '/customer/profile', element: <ProtectedRoute role="customer"><Profile /></ProtectedRoute> },

  // Partner portal
  { path: '/partner', element: <Navigate to="/partner/login" replace /> },
  { path: '/partner/login', element: <PartnerLogin /> },
  { path: '/partner/dashboard', element: <ProtectedRoute role="partner"><PartnerDashboard /></ProtectedRoute> },
  { path: '/partner/order/:id', element: <ProtectedRoute role="partner"><OrderDetail /></ProtectedRoute> },
  { path: '/partner/profile', element: <ProtectedRoute role="partner"><PartnerProfile /></ProtectedRoute> },

  // Admin portal
  { path: '/admin', element: <Navigate to="/admin/login" replace /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin/dashboard', element: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute> },
  { path: '/admin/kitchen', element: <ProtectedRoute role="admin"><KitchenPrepList /></ProtectedRoute> },
  { path: '/admin/orders', element: <ProtectedRoute role="admin"><OrdersTable /></ProtectedRoute> },
  { path: '/admin/customers', element: <ProtectedRoute role="admin"><CustomersTable /></ProtectedRoute> },
  { path: '/admin/partners', element: <ProtectedRoute role="admin"><PartnersTable /></ProtectedRoute> },
  { path: '/admin/revenue', element: <ProtectedRoute role="admin"><Revenue /></ProtectedRoute> },
  { path: '/admin/support', element: <ProtectedRoute role="admin"><Support /></ProtectedRoute> },
  { path: '/admin/settings', element: <ProtectedRoute role="admin"><Settings /></ProtectedRoute> },
]);

export default router;
