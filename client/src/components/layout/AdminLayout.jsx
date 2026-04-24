import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ChefHat, ShoppingBag, Users, Truck, TrendingUp, MessageSquare, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/kitchen', icon: ChefHat, label: 'Kitchen' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/partners', icon: Truck, label: 'Partners' },
  { to: '/admin/revenue', icon: TrendingUp, label: 'Revenue' },
  { to: '/admin/support', icon: MessageSquare, label: 'Support' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }) {
  const { admin, logoutAdmin } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-ci-black">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-ci-black-soft border-r border-ci-black-border fixed h-full">
        <div className="p-6 border-b border-ci-black-border">
          <h1 className="font-playfair text-ci-gold text-xl font-bold">Cafe Indoor</h1>
          <p className="text-ci-white-muted text-xs mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-ci-gold text-ci-black' : 'text-ci-white-muted hover:text-ci-white hover:bg-ci-black-border'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-ci-black-border">
          <p className="text-ci-white text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-ci-white-muted hover:text-ci-error text-sm mt-2 transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-ci-black-soft border-b border-ci-black-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-playfair text-ci-gold text-lg font-bold">Cafe Indoor</h1>
        <button onClick={handleLogout} className="text-ci-white-muted">
          <LogOut size={20} />
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-ci-black-soft border-t border-ci-black-border">
        <div className="flex items-center justify-around py-1.5 overflow-x-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px] text-center transition-colors ${isActive ? 'text-ci-gold' : 'text-ci-white-muted'}`
              }
            >
              <Icon size={18} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-60 mt-14 md:mt-0 mb-16 md:mb-0 overflow-y-auto">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
