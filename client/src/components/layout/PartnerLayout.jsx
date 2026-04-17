import { NavLink, useNavigate } from 'react-router-dom';
import { Package, User, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function PartnerLayout({ children }) {
  const { logoutPartner } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logoutPartner();
    navigate('/partner/login');
  }

  return (
    <div className="flex flex-col min-h-screen bg-ci-black max-w-md mx-auto">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-ci-black-soft border-t border-ci-black-border">
        <div className="flex items-center justify-around py-2">
          <NavItem to="/partner/dashboard" icon={<Package size={20} />} label="Orders" />
          <NavItem to="/partner/profile" icon={<User size={20} />} label="Profile" />
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 py-1 px-3 text-ci-white-muted">
            <LogOut size={20} />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${isActive ? 'text-ci-gold' : 'text-ci-white-muted'}`
      }
    >
      {icon}
      <span className="text-xs">{label}</span>
    </NavLink>
  );
}
