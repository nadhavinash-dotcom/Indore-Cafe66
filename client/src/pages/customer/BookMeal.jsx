import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useTimerStore from '../../store/timerStore';
import CustomerLayout from '../../components/layout/CustomerLayout';
import Button from '../../components/ui/Button';
import { todayIST, tomorrowIST } from '../../lib/timeUtils';

export default function BookMeal() {
  const navigate = useNavigate();
  const location = useLocation();
  const timerStore = useTimerStore();
  const [meal, setMeal] = useState(location.state?.meal || (timerStore.lunchLocked ? 'dinner' : 'lunch'));
  const [date, setDate] = useState(timerStore.lunchLocked && timerStore.dinnerLocked ? tomorrowIST() : todayIST());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const today = todayIST();

  const isToday = date === today;
  const lunchLocked = isToday && timerStore.lunchLocked;
  const dinnerLocked = isToday && timerStore.dinnerLocked;
  const currentMealLocked = (meal === 'lunch' && lunchLocked) || (meal === 'dinner' && dinnerLocked);
  const warningTime = isToday && (
    (meal === 'lunch' && !lunchLocked && timerStore.secondsRemaining < 1800) ||
    (meal === 'dinner' && !dinnerLocked && timerStore.secondsRemaining < 1800 && timerStore.meal === 'dinner')
  );

  useEffect(() => {
    if (isToday && meal === 'lunch' && lunchLocked && !dinnerLocked) setMeal('dinner');
  }, [lunchLocked, dinnerLocked, isToday]);

  async function handleBook() {
    if (currentMealLocked) { toast.error('Booking is closed. Please try again for tomorrow.'); return; }
    setLoading(true);
    try {
      await api.post('/orders/book', { mealType: meal, date, specialNote: note, profile:location.state?.profile });
      toast.success('Order confirmed. Your meal is on the way.');
      navigate('/customer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomerLayout>
      <div className="p-4 max-w-md mx-auto">
        <h1 className="font-playfair text-2xl text-ci-white font-bold pt-4 mb-6">Book a Meal</h1>

        {warningTime && !currentMealLocked && (
          <div className="bg-ci-error/10 border border-ci-error/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4 animate-pulse">
            <AlertTriangle size={16} className="text-ci-error flex-shrink-0" />
            <p className="text-ci-error text-sm">Only a few minutes left. Confirm quickly.</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-ci-gold text-sm font-medium mb-1.5">Date</label>
          <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="input-field" />
        </div>

        <div className="mb-4">
          <label className="block text-ci-gold text-sm font-medium mb-2">Meal</label>
          <div className="grid grid-cols-2 gap-3">
            {[['lunch', '☀️ Lunch', '12 PM - 2 PM'], ['dinner', '🌙 Dinner', '7 PM - 9 PM']].map(([value, label, window]) => {
              const locked = (value === 'lunch' && lunchLocked) || (value === 'dinner' && dinnerLocked);
              return (
                <button
                  key={value}
                  disabled={locked}
                  onClick={() => setMeal(value)}
                  className={`p-3 rounded-xl border-2 transition-colors text-left ${meal === value && !locked ? 'border-ci-gold bg-ci-gold/10' : locked ? 'border-ci-black-border opacity-40 cursor-not-allowed' : 'border-ci-black-border hover:border-ci-gold/50'}`}
                >
                  <p className="text-ci-white font-medium text-sm">{label}</p>
                  <p className="text-ci-white-muted text-xs">{window}</p>
                  {locked && <p className="text-ci-error text-xs mt-1">Closed</p>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-ci-gold text-sm font-medium mb-1.5">Special Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input-field" placeholder="Any special requirement..." />
        </div>

        {currentMealLocked ? (
          <div className="bg-ci-error/10 border border-ci-error/30 rounded-xl p-4 text-center">
            <p className="text-ci-error font-semibold">Booking is closed</p>
            <p className="text-ci-white-muted text-sm mt-1">Please choose tomorrow or a future date.</p>
          </div>
        ) : (
          <Button size="lg" loading={loading} onClick={handleBook}>Confirm Booking</Button>
        )}
      </div>
    </CustomerLayout>
  );
}
