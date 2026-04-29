import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, Clock3 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import useAuthStore from '../../store/authStore';
import {
  addDaysToISTDate,
  formatISTDate,
  getMealTypeLabel,
  getPlanTypeLabel,
  getServerTime,
  getSubscriptionTiming,
} from '../../lib/timeUtils';
import api from '../../lib/api';

const PLAN_OPTIONS = [
  { value: 'trial', label: '7 Days', days: 7 },
  { value: 'monthly', label: '30 Days', days: 30 },
];

const MEAL_OPTIONS = [
  { value: 'lunch', label: 'Lunch Only' },
  { value: 'dinner', label: 'Dinner Only' },
  { value: 'both', label: 'Both (Lunch & Dinner)' },
];

 const PRICES = {
    trial: { lunch: 855, dinner: 855, both: 1710 },
    monthly: { lunch: 4855, dinner: 4855, both: 9710 },
  };

export default function PlanSelection() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const [planType, setPlanType] = useState('trial');
  const [mealType, setMealType] = useState('both');
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [serverNow, setServerNow] = useState(null);
  const [loadingTime, setLoadingTime] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadServerTime() {
      const now = await getServerTime();
      if (!mounted) return;
      setServerNow(now);
      setLoadingTime(false);
    }
    loadServerTime();
    return () => { mounted = false; };
  }, []);


 
  const PriceFetch = async () => {
    const res = await api.get('/admin/settings');
    const s = res.data.settings;

    const monthlySingle = Number(s.monthly_single_price);
    const monthlyBoth = Number(s.monthly_both_price);
    const trialSingle = Number(s.trial_single_price);
    const trialBoth = Number(s.trial_both_price);

    // Set values
    PRICES.monthly.lunch = monthlySingle;
    PRICES.monthly.dinner = monthlySingle;
    PRICES.monthly.both = monthlyBoth;

    PRICES.trial.lunch = trialSingle;
    PRICES.trial.dinner = trialSingle;
    PRICES.trial.both = trialBoth;

    console.log(PRICES);
  };

  const timing = useMemo(
    () => getSubscriptionTiming(mealType, serverNow || new Date()),
    [mealType, serverNow]
  );

 useEffect(() => {
    PriceFetch()
  },);


  useEffect(() => {
    setSelectedStartDate(timing.firstServiceDate);
  }, [timing.firstServiceDate]);

  const durationDays = PLAN_OPTIONS.find((option) => option.value === planType)?.days || 7;
  const price = PRICES[planType][mealType];
  const isUsingRecommendedDate = selectedStartDate === timing.firstServiceDate;
  const mealStartDates = isUsingRecommendedDate
    ? timing.mealStartDates
    : {
      lunch: mealType === 'dinner' ? null : selectedStartDate,
      dinner: mealType === 'lunch' ? null : selectedStartDate,
    };
  const subscriptionEndDate = addDaysToISTDate(selectedStartDate, durationDays - 1);

  function proceed() {
    const planDraft = {
      planType,
      durationDays,
      mealType,
      totalPrice: price,
      selectedStartDate,
      recommendedStartDate: timing.firstServiceDate,
      mealStartDates,
      cutoffWindow: timing.cutoffWindow,
      serverTimeISO: (serverNow || new Date()).toISOString(),
      scheduleMessage: timing.message,
    };
    sessionStorage.setItem('ci_plan', JSON.stringify(planDraft));

    if (customer) {
      navigate(customer.hasAddress ? '/customer/payment' : '/customer/address');
      return;
    }
    navigate('/customer/login');
  }

  if (loadingTime) {
    return (
      <div className="min-h-screen bg-ci-black flex items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ci-black p-4 pb-8">
      <div className="max-w-md mx-auto pt-6 space-y-5">
        <div className="text-center">
          <h1 className="font-playfair text-3xl text-ci-white font-bold">Choose Your Subscription</h1>
          <p className="text-ci-white-muted mt-2">Select a 7-day or 30-day plan, pick your meal slot, and confirm the start date.</p>
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5">
          <p className="text-ci-gold text-sm font-medium mb-3">Duration</p>
          <div className="grid grid-cols-2 gap-3">
            {PLAN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPlanType(option.value)}
                className={`rounded-xl border p-4 text-left transition-colors ${planType === option.value ? 'border-ci-gold bg-ci-gold/10' : 'border-ci-black-border'}`}
              >
                <p className="text-ci-white font-semibold">{option.label}</p>
                <p className="text-ci-white-muted text-sm mt-1">Fresh meals for {option.days} days</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5">
          <p className="text-ci-gold text-sm font-medium mb-3">Meal Choice</p>
          <div className="space-y-3">
            {MEAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMealType(option.value)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${mealType === option.value ? 'border-ci-gold bg-ci-gold/10' : 'border-ci-black-border'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-ci-white font-medium">{option.label}</p>
                  <span className="text-ci-gold font-semibold">Rs {PRICES[planType][option.value]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-ci-gold/10 border border-ci-gold/30 rounded-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Clock3 size={18} className="text-ci-gold mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-ci-white font-semibold">Start Date Recommendation</p>
              <p className="text-ci-white-muted text-sm mt-1">{timing.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            {mealStartDates.lunch && (
              <div className="flex items-center justify-between rounded-xl bg-ci-black/30 px-3 py-2">
                <span className="text-ci-white-muted">Lunch starts</span>
                <span className="text-ci-white">{formatISTDate(mealStartDates.lunch)}</span>
              </div>
            )}
            {mealStartDates.dinner && (
              <div className="flex items-center justify-between rounded-xl bg-ci-black/30 px-3 py-2">
                <span className="text-ci-white-muted">Dinner starts</span>
                <span className="text-ci-white">{formatISTDate(mealStartDates.dinner)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-ci-gold text-sm font-medium mb-1.5">Start Date</label>
            <input
              type="date"
              value={selectedStartDate}
              min={timing.minSelectableDate}
              onChange={(e) => setSelectedStartDate(e.target.value)}
              className="input-field"
            />
            <p className="text-ci-white-muted text-xs mt-2">
              Default recommended date: {formatISTDate(timing.firstServiceDate)}. You can also choose any future date.
            </p>
          </div>

          {timing.hasSplitStart && isUsingRecommendedDate && (
            <p className="text-ci-gold text-xs">
              If you keep the recommended date, dinner will begin earlier and lunch will start the next day.
            </p>
          )}
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-ci-white font-semibold">Checkout Summary</p>
              <p className="text-ci-white-muted text-sm mt-1">{getPlanTypeLabel(planType)} • {getMealTypeLabel(mealType)}</p>
            </div>
            <p className="text-ci-gold text-2xl font-bold">Rs {price}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ci-white-muted">Subscription starts</span>
              <span className="text-ci-white">{formatISTDate(selectedStartDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ci-white-muted">Subscription ends</span>
              <span className="text-ci-white">{formatISTDate(subscriptionEndDate)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              'Recommended automatically based on the current server time',
              'You can manually choose a future start date',
              'The subscription becomes active after payment',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-ci-white-muted">
                <Check size={14} className="text-ci-gold flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-ci-white-muted pt-1">
            <CalendarDays size={14} className="text-ci-gold" />
            <span>Recommended first service date: {formatISTDate(timing.firstServiceDate)}</span>
          </div>
        </div>

        <Button size="lg" onClick={proceed}>
          Continue to Checkout
        </Button>
      </div>
    </div>
  );
}
