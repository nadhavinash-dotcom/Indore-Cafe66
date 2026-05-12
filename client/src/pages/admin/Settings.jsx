import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
      setForm(res.data.settings);
      console.log(form)
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(keys) {
    setSaving(true);
    try {
      const payload = {};
      keys.forEach(k => { payload[k] = form[k]; });
      await api.put('/admin/settings', payload);
      toast.success('Settings saved!');
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <AdminLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-playfair text-2xl text-ci-white font-bold">Settings</h1>

        <Card>
          <h2 className="text-ci-white font-semibold mb-4">Order Cutoff Times (IST)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lunch Cutoff" type="time" value={form.lunch_cutoff || '09:00'} onChange={e => setForm({ ...form, lunch_cutoff: e.target.value })} />
            <Input label="Dinner Cutoff" type="time" value={form.dinner_cutoff || '16:00'} onChange={e => setForm({ ...form, dinner_cutoff: e.target.value })} />
          </div>
          <Button className="mt-4" size="sm" loading={saving} onClick={() => handleSave(['lunch_cutoff', 'dinner_cutoff'])}>Save Cutoff Times</Button>
          <p className="text-ci-white-muted text-xs mt-2">Note: Changing cutoff times requires server restart to update cron jobs.</p>
        </Card>

        <Card>
          <h2 className="text-ci-white font-semibold mb-4">Pricing (in ₹)</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'monthly_both_price', label: 'Monthly (Both Meals)' },
              { key: 'monthly_single_price', label: 'Monthly (Single Meal)' },
              { key: 'trial_both_price', label: 'Trial (Both Meals)' },
              { key: 'trial_single_price', label: 'Trial (Single Meal)' },
            ].map(({ key, label }) => (
              <Input key={key} label={label} type="number"
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} />
            ))}
          </div>
          <Button className="mt-4" size="sm" loading={saving} onClick={() => handleSave(['monthly_both_price', 'monthly_single_price', 'trial_both_price', 'trial_single_price'])}>Save Prices</Button>
        </Card>

        <Card>
          <h2 className="text-ci-white font-semibold mb-4">Coupons (JSON)</h2>
          <textarea
            value={form.coupons || ''}
            onChange={e => setForm({ ...form, coupons: e.target.value })}
            rows={4}
            className="w-full bg-ci-black border border-ci-black-border text-ci-white placeholder-ci-white-muted px-4 py-3 rounded-xl focus:border-ci-gold text-sm font-mono"
            placeholder='[{"code":"Indoor10","type":"percent","value":10}]'
          />
          <Button className="mt-3" size="sm" loading={saving} onClick={() => handleSave(['coupons'])}>Save Coupons</Button>
        </Card>

        {/* <Card>
          <h2 className="text-ci-white font-semibold mb-4">Closed Dates (JSON Array)</h2>
          <textarea
            value={form.closed_dates || '[]'}
            onChange={e => setForm({ ...form, closed_dates: e.target.value })}
            rows={3}
            className="w-full bg-ci-black border border-ci-black-border text-ci-white placeholder-ci-white-muted px-4 py-3 rounded-xl focus:border-ci-gold text-sm font-mono"
            placeholder='["2026-08-15", "2026-10-02"]'
          />
          <Button className="mt-3" size="sm" loading={saving} onClick={() => handleSave(['closed_dates'])}>Save Closed Dates</Button>
        </Card> */}
      </div>
    </AdminLayout>
  );
}
