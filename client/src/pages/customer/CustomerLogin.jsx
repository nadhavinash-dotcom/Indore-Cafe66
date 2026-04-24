import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useOtp from '../../hooks/useOtp';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import OtpInput from '../../components/shared/OtpInput';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { setCustomer, setPartner } = useAuthStore();
  const { step, phone, loading, error, resendTimer, requestOtp, verifyOtp, resend, resetOtpFlow } = useOtp();
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    if (phoneInput.length !== 10) { toast.error('Enter a 10-digit phone number.'); return; }
    await requestOtp(phoneInput);
  }

  function handleBack() {
    setOtp('');
    resetOtpFlow();
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP.'); return; }
    const result = await verifyOtp(otp, 'customer');
console.log(result.user)
    if (result) {
      if (result.role === 'partner') {
        setPartner(result.user, result.token);
        toast.success(`Welcome, ${result.user.name}!`);
        navigate('/partner/dashboard');
      } else {
        setCustomer(result.user, result.token);
        toast.success(`Welcome, ${result.user.name}!`);
        const hasPendingPlan = Boolean(sessionStorage.getItem('ci_plan'));
        if (hasPendingPlan) {
          navigate(!result.user.hasAddress ? '/customer/payment' : '/customer/address');
        } else {
          navigate(result.user.hasAddress ? '/customer/dashboard' : '/customer/address');
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-ci-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-4xl text-ci-gold font-bold">Cafe Indoor</h1>
          <p className="text-ci-white-muted mt-2">Log in</p>
        </div>

        {step === 'phone' ? (
          <div key="phone-step" className="bg-ci-black-soft border border-ci-black-border rounded-card p-6">
            <h2 className="text-ci-white font-semibold text-lg mb-1">Phone Number</h2>
            <p className="text-ci-white-muted text-sm mb-5">We will send an OTP to your number.</p>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-ci-gold text-sm font-medium mb-1.5">Phone</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-ci-black border border-r-0 border-ci-black-border rounded-l-xl text-ci-white-muted">+91</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 bg-ci-black border border-ci-black-border text-ci-white px-4 py-3 rounded-r-xl focus:border-ci-gold transition-colors"
                    placeholder="9800000001"
                    maxLength={10}
                  />
                </div>
              </div>
              {error && <p className="text-ci-error text-sm">{error}</p>}
              <Button type="submit" size="lg" loading={loading}>Send OTP</Button>
            </form>
          </div>
        ) : (
          <div key="otp-step" className="bg-ci-black-soft border border-ci-black-border rounded-card p-6">
            <button type="button" onClick={handleBack} className="flex items-center gap-1 text-ci-white-muted text-sm mb-4 hover:text-ci-white">
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-ci-white font-semibold text-lg mb-1">Verify OTP</h2>
            <p className="text-ci-white-muted text-sm mb-5">OTP sent to +91 {phone}</p>
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <OtpInput key={phone} value={otp} onChange={setOtp} />
              {error && <p className="text-ci-error text-sm text-center">{error}</p>}
              <Button type="submit" size="lg" loading={loading} disabled={otp.length !== 6}>Verify</Button>
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-ci-white-muted text-sm">OTP resend: <span className="text-ci-gold">{resendTimer}s</span></p>
                ) : (
                  <button type="button" onClick={resend} className="text-ci-gold text-sm hover:text-ci-gold-light">Resend OTP</button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
