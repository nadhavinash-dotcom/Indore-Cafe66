import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import Button from '../../components/ui/Button';

const PRICES = {
  monthly: { both: 4800, single: 2880 },
  trial: { both: 1400, single: 840 },
};

export default function PlanSelection() {
  const navigate = useNavigate();
  const [mealType, setMealType] = useState('both');
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const price = PRICES[selectedPlan][mealType === 'both' ? 'both' : 'single'];

  function proceed() {
    sessionStorage.setItem('ci_plan', JSON.stringify({ planType: selectedPlan, mealType }));
    navigate('/customer/login');
  }

  return (
    <div className="min-h-screen bg-ci-black p-4 pb-8">
      <div className="max-w-md mx-auto">
        <div className="text-center pt-8 mb-8">
          <h1 className="font-playfair text-3xl text-ci-white font-bold">Apna Plan Chuniye</h1>
          <p className="text-ci-white-muted mt-2">Indore mein ghar jaisa khana</p>
        </div>

        {/* Meal type toggle */}
        <div className="flex bg-ci-black-soft border border-ci-black-border rounded-xl p-1 mb-6">
          {[['both', 'Lunch + Dinner'], ['lunch', 'Sirf Lunch'], ['dinner', 'Sirf Dinner']].map(([v, l]) => (
            <button key={v} onClick={() => setMealType(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mealType === v ? 'bg-ci-gold text-ci-black' : 'text-ci-white-muted'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Monthly Plan */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`bg-ci-black-soft border-2 rounded-card p-5 cursor-pointer transition-colors ${selectedPlan === 'monthly' ? 'border-ci-gold' : 'border-ci-black-border'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-ci-white font-playfair text-xl font-bold">Monthly Plan</h3>
                <p className="text-ci-white-muted text-sm">30 din</p>
              </div>
              <div className="text-right">
                <p className="text-ci-gold text-2xl font-bold">₹{PRICES.monthly[mealType === 'both' ? 'both' : 'single']}</p>
                <p className="text-ci-white-muted text-xs">/month</p>
              </div>
            </div>
            {['Chef-curated fresh tiffins', 'Daily delivery', 'Pause/resume anytime', 'Priority support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-ci-white-muted mb-1.5">
                <Check size={14} className="text-ci-gold flex-shrink-0" />{f}
              </div>
            ))}
            {selectedPlan === 'monthly' && <div className="mt-3 text-xs text-ci-gold font-medium">✓ Selected</div>}
          </div>

          {/* Trial Plan */}
          <div
            onClick={() => setSelectedPlan('trial')}
            className={`bg-ci-black-soft border-2 rounded-card p-5 cursor-pointer transition-colors ${selectedPlan === 'trial' ? 'border-ci-gold' : 'border-ci-black-border'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-ci-white font-playfair text-xl font-bold">7-Day Trial</h3>
                <p className="text-ci-white-muted text-sm">Pehle try karo</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 bg-ci-gold/20 border border-ci-gold/30 rounded-full px-2 py-0.5 mb-1">
                  <Star size={11} className="text-ci-gold" />
                  <span className="text-ci-gold text-xs font-medium">Pehle try karo</span>
                </div>
                <p className="text-ci-gold text-2xl font-bold">₹{PRICES.trial[mealType === 'both' ? 'both' : 'single']}</p>
                <p className="text-ci-white-muted text-xs">/7 days</p>
              </div>
            </div>
            {['7 days trial', 'Full experience', 'No commitment'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-ci-white-muted mb-1.5">
                <Check size={14} className="text-ci-gold flex-shrink-0" />{f}
              </div>
            ))}
            {selectedPlan === 'trial' && <div className="mt-3 text-xs text-ci-gold font-medium">✓ Selected</div>}
          </div>
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-3 mb-6 text-center">
          <p className="text-ci-white font-semibold">Total: <span className="text-ci-gold text-xl">₹{price}</span></p>
          <p className="text-ci-white-muted text-xs mt-0.5">{selectedPlan === 'monthly' ? '30 din' : '7 din'} · {mealType === 'both' ? 'Lunch + Dinner' : mealType}</p>
        </div>

        <Button size="lg" onClick={proceed}>Aage Badhein →</Button>
      </div>
    </div>
  );
}
