import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useRazorpay from '../../hooks/useRazorpay';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CustomerLayout from '../../components/layout/CustomerLayout';
import api from '../../lib/api';
import {
  addDaysToISTDate,
  formatISTDate,
  getMealTypeLabel,
  getPlanTypeLabel,
} from '../../lib/timeUtils';

export default function Payment() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const { loading, error, initiatePayment } = useRazorpay();
  const plan = JSON.parse(sessionStorage.getItem('ci_plan') || 'null');
  const razorpayPaymentLink = import.meta.env.VITE_RAZORPAY_PAYMENT_LINK?.trim() || '';
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (!plan) navigate('/customer/plans', { replace: true });
  }, [navigate, plan]);

  useEffect(() => {
    let mounted = true;

    async function loadCoupons() {
      try {
        const res = await api.get('/admin/settings');
        const rawCoupons = res.data?.settings?.coupons;

        if (!rawCoupons) {
          if (mounted) setAvailableCoupons([]);
          return;
        }

        const parsedCoupons = Array.isArray(rawCoupons) ? rawCoupons : JSON.parse(rawCoupons);
        if (mounted) setAvailableCoupons(Array.isArray(parsedCoupons) ? parsedCoupons : []);
      } catch (err) {
        console.error('Failed to load coupons', err);
        if (mounted) setAvailableCoupons([]);
      }
    }

    loadCoupons();
    return () => {
      mounted = false;
    };
  }, []);

  if (!plan) return null;

  const total = Number(plan.totalPrice) || 0;
  const endDate = addDaysToISTDate(plan.selectedStartDate, (plan.durationDays || 7) - 1);

  const matchedCoupon = useMemo(() => {
    const normalizedCode = appliedCouponCode.trim().toLowerCase();
    if (!normalizedCode) return null;
    return availableCoupons.find((coupon) => coupon.code?.toLowerCase() === normalizedCode) || null;
  }, [appliedCouponCode, availableCoupons]);

  const discountAmount = useMemo(() => {
    if (!matchedCoupon) return 0;

    if (matchedCoupon.type === 'percent') {
      return Math.min(total, Math.round((total * Number(matchedCoupon.value || 0)) / 100));
    }

    if (matchedCoupon.type === 'flat') {
      return Math.min(total, Number(matchedCoupon.value || 0));
    }

    return 0;
  }, [matchedCoupon, total]);

  const payableTotal = Math.max(0, total - discountAmount);

  function applyCoupon() {
    const normalizedCode = couponCode.trim().toLowerCase();

    if (!normalizedCode) {
      setAppliedCouponCode('');
      setCouponError('Please enter a coupon code.');
      return;
    }

    const coupon = availableCoupons.find((item) => item.code?.toLowerCase() === normalizedCode);
    if (!coupon) {
      setAppliedCouponCode('');
      setCouponError('This coupon code is not valid.');
      return;
    }

    setAppliedCouponCode(coupon.code);
    setCouponCode(coupon.code);
    setCouponError('');
    toast.success('Coupon applied.');
  }

  async function handlePay() {
    if (!customer) {
      toast.error('Login required');
      navigate('/customer/login');
      return;
    }

    if (razorpayPaymentLink) {
      try {
        const paymentUrl = new URL(razorpayPaymentLink);
        window.location.assign(paymentUrl.toString());
        return;
      } catch {
        toast.error('Razorpay payment link is invalid.');
        return;
      }
    }

    initiatePayment({
      planType: plan.planType,
      mealType: plan.mealType,
      couponCode: matchedCoupon ? matchedCoupon.code : '',
      subscriptionPlan: {
        ...plan,
        couponCode: matchedCoupon ? matchedCoupon.code : '',
        discountAmount,
        finalAmount: payableTotal,
      },
      customer: { name: customer?.name, phone: customer?.phone, email: customer?.email },
      onSuccess: (data) => {
        sessionStorage.removeItem('ci_plan');
        navigate('/customer/success', {
          state: {
            subscription: {
              ...plan,
              ...data.subscription,
              start_date: data.subscription?.start_date || plan.selectedStartDate,
              end_date: data.subscription?.end_date || endDate,
            },
          },
        });
      },
    });
  }

  return (
    <CustomerLayout>
      <div className="p-4 pb-8 max-w-md mx-auto space-y-4">
        <div className="pt-4">
          <h1 className="font-playfair text-2xl text-ci-white font-bold">Checkout</h1>
          <p className="text-ci-white-muted text-sm mt-1">Review the subscription details you selected.</p>
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-ci-white font-semibold">Subscription Summary</p>
              <p className="text-ci-white-muted text-sm mt-1">{getPlanTypeLabel(plan.planType)} • {getMealTypeLabel(plan.mealType)}</p>
            </div>
            <p className="text-ci-gold text-2xl font-bold">Rs {payableTotal}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ci-white-muted">Plan total</span>
              <span className="text-ci-white">Rs {total}</span>
            </div>
            {matchedCoupon && (
              <div className="flex items-center justify-between">
                <span className="text-ci-white-muted">Coupon discount</span>
                <span className="text-ci-gold">- Rs {discountAmount}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-ci-white-muted">Selected start date</span>
              <span className="text-ci-white">{formatISTDate(plan.selectedStartDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ci-white-muted">Subscription end date</span>
              <span className="text-ci-white">{formatISTDate(endDate)}</span>
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-ci-gold/10 border border-ci-gold/20 p-4">
            <p className="text-ci-white font-medium">Meal activation</p>
            {plan.mealStartDates?.lunch && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ci-white-muted">Lunch</span>
                <span className="text-ci-white">{formatISTDate(plan.mealStartDates.lunch)}</span>
              </div>
            )}
            {plan.mealStartDates?.dinner && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ci-white-muted">Dinner</span>
                <span className="text-ci-white">{formatISTDate(plan.mealStartDates.dinner)}</span>
              </div>
            )}
            {plan.scheduleMessage && (
              <p className="text-ci-white-muted text-xs">{plan.scheduleMessage}</p>
            )}
          </div>
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5 space-y-3">
          <p className="text-ci-white font-semibold">Coupon Code</p>
          <div className="space-y-3">
            <Input
              label="Insert coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setAppliedCouponCode('');
                setCouponError('');
              }}
              error={couponError}
              placeholder="Enter coupon code"
            />
            <Button type="button" size="sm" onClick={applyCoupon}>
              Apply Coupon
            </Button>
          </div>
          {matchedCoupon && !couponError && (
            <p className="text-ci-gold text-sm">
              Applied {matchedCoupon.code} ({matchedCoupon.type === 'percent' ? `${matchedCoupon.value}% off` : `Rs ${matchedCoupon.value} off`}).
            </p>
          )}
        </div>

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5 space-y-2">
          <p className="text-ci-white font-semibold">What happens next</p>
          <p className="text-ci-white-muted text-sm">
            {razorpayPaymentLink
              ? 'Click pay to continue on Razorpay and complete your payment.'
              : 'Once payment succeeds, your subscription will become active and appear on your dashboard.'}
          </p>
        </div>

        {error && <p className="text-ci-error text-sm">{error}</p>}

        <Button size="lg" loading={loading} onClick={handlePay}>
          Pay Rs {payableTotal}
        </Button>
      </div>
    </CustomerLayout>
  );
}
