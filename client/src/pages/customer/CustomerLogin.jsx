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
  const { step, phone, loading, error, resendTimer, requestOtp, verifyOtp, resend } = useOtp();
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    if (phoneInput.length !== 10) { toast.error('10 digit phone number daalein'); return; }
    await requestOtp(phoneInput);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('6 digit OTP daalein'); return; }
    const result = await verifyOtp(otp);
    if (result) {
      if (result.role === 'partner') {
        setPartner(result.user, result.token);
        toast.success(`Namaste, ${result.user.name}!`);
        navigate('/partner/dashboard');
      } else {
        setCustomer(result.user, result.token);
        toast.success(`Namaste, ${result.user.name}!`);
        navigate(result.user.hasAddress ? '/customer/dashboard' : '/customer/address');
      }
    }
  }

  return (
    <div className="min-h-screen bg-ci-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-4xl text-ci-gold font-bold">Cafe Indoori</h1>
          <p className="text-ci-white-muted mt-2">Login Karein</p>
        </div>

        {step === 'phone' ? (
          <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-6">
            <h2 className="text-ci-white font-semibold text-lg mb-1">Phone Number</h2>
            <p className="text-ci-white-muted text-sm mb-5">Aapke number pe OTP aayega</p>
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
              <Button type="submit" size="lg" loading={loading}>OTP Bhejo</Button>
            </form>
          </div>
        ) : (
          <div className="bg-ci-black-soft border border-ci-black-border rounded-card p-6">
            <button onClick={() => window.location.reload()} className="flex items-center gap-1 text-ci-white-muted text-sm mb-4 hover:text-ci-white">
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-ci-white font-semibold text-lg mb-1">OTP Verify Karein</h2>
            <p className="text-ci-white-muted text-sm mb-5">+91 {phone} pe OTP bheja gaya</p>
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <OtpInput value={otp} onChange={setOtp} />
              {error && <p className="text-ci-error text-sm text-center">{error}</p>}
              <Button type="submit" size="lg" loading={loading} disabled={otp.length !== 6}>Verify Karein</Button>
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-ci-white-muted text-sm">OTP resend: <span className="text-ci-gold">{resendTimer}s</span></p>
                ) : (
                  <button type="button" onClick={resend} className="text-ci-gold text-sm hover:text-ci-gold-light">OTP Dobara Bhejo</button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
