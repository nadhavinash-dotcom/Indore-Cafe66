import { useState } from 'react';
import api from '../lib/api';

export default function useOtp() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  function startResendTimer() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  async function requestOtp(phoneNumber) {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { phone: phoneNumber });
      setPhone(phoneNumber);
      setStep('otp');
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'OTP bhejne mein problem hui.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(otp) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verify nahi ho saka.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  function resend() {
    if (resendTimer > 0) return;
    requestOtp(phone);
  }

  return { step, phone, loading, error, resendTimer, requestOtp, verifyOtp, resend, setError };
}
