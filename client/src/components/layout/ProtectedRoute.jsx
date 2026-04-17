import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ role, children }) {
  const store = useAuthStore();
  const tokenMap = { customer: store.customerToken, partner: store.partnerToken, admin: store.adminToken };
  const redirectMap = { customer: '/customer/login', partner: '/partner/login', admin: '/admin/login' };

  if (!tokenMap[role]) return <Navigate to={redirectMap[role]} replace />;
  return children;
}
