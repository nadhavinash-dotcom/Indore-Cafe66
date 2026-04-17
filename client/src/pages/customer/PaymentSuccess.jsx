import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { formatISTDate } from '../../lib/timeUtils';

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const sub = state?.subscription;

  return (
    <div className="min-h-screen bg-ci-black flex flex-col items-center justify-center p-4 text-center">
      <div className="animate-checkmark mb-6">
        <div className="w-20 h-20 rounded-full bg-ci-success/20 border-2 border-ci-success flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-ci-success" />
        </div>
      </div>

      <h1 className="font-playfair text-3xl text-ci-gold font-bold mb-2">Subscription Confirmed!</h1>
      <p className="text-ci-white-muted text-base mb-8">Aapka tiffin tayar ho raha hai!</p>

      {sub && (
        <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-5 mb-8 w-full max-w-xs text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ci-white-muted">Plan</span>
            <span className="text-ci-white capitalize">{sub.plan_type} — {sub.meal_type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ci-white-muted">Start Date</span>
            <span className="text-ci-white">{formatISTDate(sub.start_date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ci-white-muted">End Date</span>
            <span className="text-ci-white">{formatISTDate(sub.end_date)}</span>
          </div>
          {sub.payment_id && (
            <div className="flex justify-between text-sm">
              <span className="text-ci-white-muted">Payment ID</span>
              <span className="text-ci-white text-xs">{sub.payment_id.slice(0, 18)}...</span>
            </div>
          )}
        </div>
      )}

      <Button size="lg" onClick={() => navigate('/customer/dashboard')} className="max-w-xs w-full">
        Dashboard Dekho
      </Button>
    </div>
  );
}
