import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useOtp from '../../hooks/useOtp';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import OtpInput from '../../components/shared/OtpInput';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { setPartner } = useAuthStore();
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
    const result = await verifyOtp(otp, 'partner');
    if (result) {
      setPartner(result.user, result.token);
      toast.success(`Welcome, ${result.user.name}!`);
      navigate('/partner/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-ci-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-ci-gold/20 border border-ci-gold flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🛵</span>
          </div>
          <h1 className="font-playfair text-3xl text-ci-gold font-bold">Partner Login</h1>
          <p className="text-ci-white-muted mt-1">Delivery Partner Portal</p>
        </div>

        {step === 'phone' ? (
          <div key="phone-step" className="bg-ci-black-soft border border-ci-black-border rounded-card p-6">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-ci-gold text-sm font-medium mb-1.5">Phone Number</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-ci-black border border-r-0 border-ci-black-border rounded-l-xl text-ci-white-muted">+91</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 bg-ci-black border border-ci-black-border text-ci-white px-4 py-3 rounded-r-xl focus:border-ci-gold"
                    placeholder="9800000001"
                    maxLength={10}
                  />
                </div>
                <p className="text-ci-white-muted text-xs mt-1">Test: 9800000001 - 9800000005</p>
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
            <p className="text-ci-white-muted text-sm mb-5">OTP sent to +91 {phone}</p>
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <OtpInput key={phone} value={otp} onChange={setOtp} />
              {error && <p className="text-ci-error text-sm text-center">{error}</p>}
              <Button type="submit" size="lg" loading={loading} disabled={otp.length !== 6}>Verify</Button>
              {resendTimer > 0 ? (
                <p className="text-center text-ci-white-muted text-sm">Resend: <span className="text-ci-gold">{resendTimer}s</span></p>
              ) : (
                <button type="button" onClick={resend} className="block w-full text-center text-ci-gold text-sm">Resend OTP</button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
