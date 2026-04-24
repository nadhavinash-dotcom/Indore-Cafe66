import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useRazorpay from '../../hooks/useRazorpay';
import Button from '../../components/ui/Button';
import CustomerLayout from '../../components/layout/CustomerLayout';
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

  useEffect(() => {
    if (!plan) navigate('/customer/plans', { replace: true });
  }, [navigate, plan]);

  if (!plan) return null;

  const total = plan.totalPrice || 0;
  const endDate = addDaysToISTDate(plan.selectedStartDate, (plan.durationDays || 7) - 1);

  async function handlePay() {
    if (!customer) {
      toast.error('Login required');
      navigate('/customer/login');
      return;
    }

    initiatePayment({
      planType: plan.planType,
      mealType: plan.mealType,
      subscriptionPlan: plan,
      customer: { name: customer?.name, phone: customer?.phone },
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
            <p className="text-ci-gold text-2xl font-bold">Rs {total}</p>
          </div>

          <div className="space-y-2 text-sm">
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

        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5 space-y-2">
          <p className="text-ci-white font-semibold">What happens next</p>
          <p className="text-ci-white-muted text-sm">Once payment succeeds, your subscription will become active and appear on your dashboard.</p>
        </div>

        {error && <p className="text-ci-error text-sm">{error}</p>}

        <Button size="lg" loading={loading} onClick={handlePay}>
          Pay Rs {total}
        </Button>
      </div>
    </CustomerLayout>
  );
}
