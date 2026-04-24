import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

export default function PartnersTable() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', vehicleType: 'bike', areas: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/partners');
      console.log('Loaded partners:', res);
      setPartners(res.data.partners);
    } finally {
      setLoading(false);
    }
  }

  const toggleDuty = async (id, isOnDuty) => {
    await api.put(`/partner/${id}`, {
      isOnDuty: isOnDuty
    });
    load();
  };
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/partners', { ...form, areas: form.areas.split(',').map(s => s.trim()).filter(Boolean) });
      toast.success('Partner added!');
      setShowAdd(false);
      setForm({ name: '', phone: '', vehicleType: 'bike', areas: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding partner');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-2xl text-ci-white font-bold">Delivery Partners</h1>
          <Button onClick={() => setShowAdd(true)} size="sm"><Plus size={16} className="mr-1" /> Add Partner</Button>
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <div className="grid gap-3">
            {partners.map(p => (
              <Card className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-ci-white font-semibold">{p.name}</p>
                  <p className="text-ci-white-muted text-sm">{p.phone} · {p.vehicle_type}</p>
                  <p className="text-ci-white-muted text-xs mt-0.5">
                    {p.area_coverage?.map(area =>
                      area.charAt(0).toUpperCase() + area.slice(1).toLowerCase()
                    ).join(', ')}
                  </p>                </div>
                <div className="text-center">
                  <p className="text-ci-gold font-bold text-lg">{p.today_delivered}/{p.today_total}</p>
                  <p className="text-ci-white-muted text-xs">Today</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge status={p.status === 'active' ? 'active' : 'cancelled'}>{p.status}</Badge>
                  <button
                    onClick={() => toggleDuty(p.id, p.is_on_duty)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${p.is_on_duty ? 'bg-ci-gold text-ci-black' : 'bg-ci-black-border text-ci-white-muted'}`}
                  >
                    {p.is_on_duty ? 'On Duty' : 'Off Duty'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Delivery Partner">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone (10 digit)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required maxLength={10} />
          <div>
            <label className="block text-ci-gold text-sm font-medium mb-1.5">Vehicle Type</label>
            <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} className="input-field">
              <option value="bike">Bike</option>
              <option value="cycle">Cycle</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <Input label="Areas (comma separated)" value={form.areas} onChange={e => setForm({ ...form, areas: e.target.value })} placeholder="Vijay Nagar, Palasia" />
          <Button type="submit" size="lg" loading={saving}>Add Partner</Button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
