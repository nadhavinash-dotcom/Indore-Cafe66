import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import useRazorpay from '../../hooks/useRazorpay';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CustomerLayout from '../../components/layout/CustomerLayout';

const PRICES = {
  monthly: { both: 4800, lunch: 2880, dinner: 2880 },
  trial: { both: 1400, lunch: 840, dinner: 840 },
};
const COUPONS = { INDOORI10: { type: 'percent', value: 10 }, TRIAL50: { type: 'flat', value: 50 } };

export default function Payment() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const { loading, error, initiatePayment } = useRazorpay();
  const plan = JSON.parse(sessionStorage.getItem('ci_plan') || '{"planType":"monthly","mealType":"both"}');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const basePrice = PRICES[plan.planType]?.[plan.mealType] || 0;
  const gst = Math.floor(basePrice * 0.18);
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') discount = Math.floor((basePrice + gst) * appliedCoupon.value / 100);
    else discount = appliedCoupon.value;
  }
  const total = basePrice + gst - discount;

  function applyCoupon() {
    const c = COUPONS[coupon.toUpperCase()];
    if (c) { setAppliedCoupon(c); toast.success('Coupon apply ho gaya!'); }
    else toast.error('Invalid coupon');
  }

  async function handlePay() {
    initiatePayment({
      planType: plan.planType,
      mealType: plan.mealType,
      couponCode: appliedCoupon ? coupon : undefined,
      customer: { name: customer?.name, phone: customer?.phone },
      onSuccess: (data) => {
        sessionStorage.removeItem('ci_plan');
        navigate('/customer/success', { state: { subscription: data.subscription } });
      },
    });
  }

  return (
    <CustomerLayout>
      <div className="p-4 pb-8 max-w-md mx-auto">
        <h1 className="font-playfair text-2xl text-ci-white font-bold pt-4 mb-6">Payment</h1>

        {/* Order Summary */}
        <div className="bg-ci-black-soft border-l-4 border-l-ci-gold border border-ci-black-border rounded-card p-4 mb-4 space-y-2">
          <h3 className="text-ci-white font-semibold">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-ci-white-muted capitalize">{plan.planType} Plan — {plan.mealType}</span>
            <span className="text-ci-white">₹{basePrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ci-white-muted">GST (18%)</span>
            <span className="text-ci-white">₹{gst}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm">
              <span className="text-ci-gold flex items-center gap-1"><Tag size={12} /> {coupon}</span>
              <span className="text-ci-success">-₹{discount}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-ci-black-border pt-2 mt-2">
            <span className="text-ci-white">Total</span>
            <span className="text-ci-gold">₹{total}</span>
          </div>
        </div>

        {/* Coupon */}
        {!appliedCoupon ? (
          <div className="flex gap-2 mb-4">
            <Input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code (INDOORI10)" className="flex-1" />
            <Button variant="secondary" onClick={applyCoupon}>Apply</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-ci-success/10 border border-ci-success/30 rounded-xl px-4 py-2 mb-4">
            <Tag size={14} className="text-ci-success" />
            <span className="text-ci-success text-sm flex-1">{coupon} applied</span>
            <button onClick={() => { setAppliedCoupon(null); setCoupon(''); }}><X size={14} className="text-ci-white-muted" /></button>
          </div>
        )}

        {error && <p className="text-ci-error text-sm mb-3">{error}</p>}

        <Button size="lg" loading={loading} onClick={handlePay}>
          Razorpay se Pay Karo — ₹{total}
        </Button>
        <p className="text-ci-white-muted text-xs text-center mt-3">Secure payment via Razorpay</p>
      </div>
    </CustomerLayout>
  );
}
