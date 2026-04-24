import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import PartnerLayout from '../../components/layout/PartnerLayout';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function PartnerProfile() {
  const navigate = useNavigate();
  const { partner, logoutPartner } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/partner/profile').then(res => setProfile(res?.data?.partner)).finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    logoutPartner();
    navigate('/partner/login');
  }

  if (loading) return <PartnerLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></PartnerLayout>;

  const areas = profile?.area_coverage ? (profile.area_coverage) : [];

  return (
    <PartnerLayout>
      <div className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="font-playfair text-2xl text-ci-white font-bold pt-4">My Profile</h1>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-ci-gold flex items-center justify-center text-ci-black font-bold text-xl">
            {profile?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-ci-white font-semibold text-lg">{profile?.name}</h2>
            <p className="text-ci-white-muted">+91 {profile?.phone}</p>
          </div>
        </div>

        <Card>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ci-white-muted">Vehicle</span>
              <span className="text-ci-white capitalize">{profile?.vehicle_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ci-white-muted">Status</span>
              <span className={profile?.status === 'active' ? 'text-ci-success' : 'text-ci-error'}>{profile?.status}</span>
            </div>
            <div>
              <p className="text-ci-white-muted mb-1">Coverage Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {areas.map(a => (
                  <span key={a} className="bg-ci-gold/20 text-ci-gold text-xs px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <button onClick={handleLogout} className="flex items-center gap-2 text-ci-error text-sm w-full justify-center py-3">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </PartnerLayout>
  );
}
