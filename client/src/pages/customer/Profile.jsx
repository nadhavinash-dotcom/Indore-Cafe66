import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import CustomerLayout from '../../components/layout/CustomerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { formatISTDate, daysLeft } from '../../lib/timeUtils';

const AREAS = [
  "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", 
  "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", 
  "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", 
  "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", 
  "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", 
  "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", 
  "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", 
  "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
];

export default function Profile() {
  const navigate = useNavigate();
  const { logoutCustomer } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [pauseForm, setPauseForm] = useState({ startDate: '', endDate: '' });

  async function load() {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([api.get('/customer/profile'), api.get('/customer/subscription')]);
      setProfile(pRes.data.customer);
      setSub(sRes.data.subscription);
      setEditForm(pRes.data.customer);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/customer/profile', editForm);
      toast.success('Profile updated successfully.');
      setEditing(false);
      load();
    } catch {
      toast.error('Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePause() {
    try {
      await api.post('/customer/subscription/pause', pauseForm);
      toast.success('Subscription pause scheduled.');
      setShowPause(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel the subscription?')) return;
    await api.post('/customer/subscription/cancel');
    toast.success('Subscription cancelled successfully.');
    load();
  }

  function handleLogout() {
    logoutCustomer();
    navigate('/customer/login');
  }

  useEffect(() => { load(); }, []);

  const initials = profile?.name?.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2) || 'CI';

  if (loading) return <CustomerLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="font-playfair text-2xl text-ci-white font-bold pt-4">Profile</h1>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-ci-gold flex items-center justify-center text-ci-black font-bold text-xl">
            {initials}
          </div>
          <div>
            <h2 className="text-ci-white font-semibold text-lg">{profile?.name}</h2>
            <p className="text-ci-white-muted">+91 {profile?.phone}</p>
          </div>
          <button onClick={() => setEditing(true)} className="ml-auto text-ci-gold hover:text-ci-gold-light">
            <Edit2 size={18} />
          </button>
        </div>

        <Card>
          <h3 className="text-ci-gold font-medium mb-2">Delivery Address</h3>
          <p className="text-ci-white text-sm">{profile?.address_line1}</p>
          <p className="text-ci-white-muted text-xs mt-0.5">{profile?.area}, Indore {profile?.pincode}</p>
          {profile?.landmark && <p className="text-ci-white-muted text-xs">Near: {profile.landmark}</p>}
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ci-gold/20 text-ci-gold">
            {profile?.meal_preference}
          </div>
        </Card>

        {sub ? (
          <Card goldLeft>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-ci-white font-semibold">Subscription</h3>
              <Badge status={sub.status}>{sub.status}</Badge>
            </div>
            <p className="text-ci-white capitalize text-sm">{sub.plan_type} - {sub.meal_type}</p>
            <p className="text-ci-white-muted text-xs mt-0.5">
              {formatISTDate(sub.start_date)} - {formatISTDate(sub.end_date)} • {daysLeft(sub.end_date)} days left
            </p>
            {sub.status === 'active' && (
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={() => setShowPause(true)}>Pause</Button>
                <Button variant="danger" size="sm" onClick={handleCancel}>Cancel</Button>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <p className="text-ci-white-muted text-sm mb-2">No active subscription found.</p>
            <Button size="sm" onClick={() => navigate('/customer/plans')}>Choose a Plan</Button>
          </Card>
        )}

        <Card className="cursor-pointer hover:border-ci-gold" onClick={() => navigate('/customer/support')}>
          <p className="text-ci-white font-medium">Help & Support</p>
          <p className="text-ci-white-muted text-xs">Need help? We are here for you.</p>
        </Card>

        <button onClick={handleLogout} className="flex items-center gap-2 text-ci-error hover:opacity-80 text-sm w-full justify-center py-3">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Profile">
        <div className="space-y-3">
          <Input label="Name" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Address" value={editForm.address_line1 || ''} onChange={e => setEditForm({ ...editForm, address_line1: e.target.value })} />
          <div>
            <label className="block text-ci-gold text-sm font-medium mb-1.5">Area</label>
            <select value={editForm.area || ''} onChange={e => setEditForm({ ...editForm, area: e.target.value })} className="input-field">
              {AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <Input label="Pincode" value={editForm.pincode || ''} onChange={e => setEditForm({ ...editForm, pincode: e.target.value })} />
          <div>
            <label className="block text-ci-gold text-sm font-medium mb-2">Meal Preference</label>
            <div className="flex gap-2">
              {['veg', 'nonveg', 'jain'].map((preference) => (
                <button
                  key={preference}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, meal_preference: preference })}
                  className={`flex-1 py-2 rounded-xl text-sm capitalize border transition-colors ${editForm.meal_preference === preference ? 'bg-ci-gold text-ci-black border-ci-gold' : 'border-ci-black-border text-ci-white-muted'}`}
                >
                  {preference}
                </button>
              ))}
            </div>
          </div>
          <Button size="lg" loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </Modal>

      <Modal isOpen={showPause} onClose={() => setShowPause(false)} title="Pause Subscription">
        <div className="space-y-3">
          <Input label="Pause Start Date" type="date" value={pauseForm.startDate} onChange={e => setPauseForm({ ...pauseForm, startDate: e.target.value })} />
          <Input label="Pause End Date" type="date" value={pauseForm.endDate} onChange={e => setPauseForm({ ...pauseForm, endDate: e.target.value })} />
          <Button size="lg" onClick={handlePause}>Pause Subscription</Button>
        </div>
      </Modal>
    </CustomerLayout>
  );
}
