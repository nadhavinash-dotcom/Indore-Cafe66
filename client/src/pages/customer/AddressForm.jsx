import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CustomerLayout from '../../components/layout/CustomerLayout';

const AREAS = ['Vijay Nagar', 'Palasia', 'Scheme 54', 'AB Road', 'Bengali Square', 'Rau', 'Nipania', 'Other'];

export default function AddressForm() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name || '',
    address_line1: '',
    address_line2: '',
    area: 'Vijay Nagar',
    landmark: '',
    pincode: '452001',
    meal_preference: 'veg',
    special_instructions: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.address_line1.trim()) { toast.error('Address daalein'); return; }
    setLoading(true);
    try {
      await api.put('/customer/profile', form);
      toast.success('Address save ho gaya!');
      const plan = sessionStorage.getItem('ci_plan');
      navigate(plan ? '/customer/payment' : '/customer/dashboard');
    } catch {
      toast.error('Save nahi ho saka');
    } finally {
      setLoading(false);
    }
  }

  const Wrap = customer ? CustomerLayout : 'div';

  return (
    <Wrap>
      <div className="p-4 pb-8 max-w-md mx-auto">
        <h1 className="font-playfair text-2xl text-ci-white font-bold pt-4 mb-6">Apna Address</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Naam" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Flat/House No, Street" value={form.address_line1} onChange={e => setForm({ ...form, address_line1: e.target.value })} required placeholder="Flat 4, Green Park Colony" />
          <Input label="Address Line 2 (optional)" value={form.address_line2} onChange={e => setForm({ ...form, address_line2: e.target.value })} placeholder="Near water tank" />
          <Input label="Landmark" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="Near XYZ temple" />
          <div>
            <label className="block text-ci-gold text-sm font-medium mb-1.5">Area</label>
            <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="input-field">
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Input label="Pincode" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} maxLength={6} />

          <div>
            <label className="block text-ci-gold text-sm font-medium mb-2">Meal Preference</label>
            <div className="flex gap-3">
              {[['veg', '🌿 Veg'], ['nonveg', '🍗 Non-Veg'], ['jain', '🌾 Jain']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setForm({ ...form, meal_preference: v })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.meal_preference === v ? 'bg-ci-gold text-ci-black border-ci-gold' : 'border-ci-black-border text-ci-white-muted'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-ci-gold text-sm font-medium mb-1.5">Special Instructions (optional)</label>
            <textarea value={form.special_instructions} onChange={e => setForm({ ...form, special_instructions: e.target.value })} rows={2}
              className="input-field" placeholder="Allergy, diet notes..." />
          </div>

          <Button type="submit" size="lg" loading={loading}>Aage Badhein →</Button>
        </form>
      </div>
    </Wrap>
  );
}
