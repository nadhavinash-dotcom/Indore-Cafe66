import { useState, useRef } from 'react';
import api from '../lib/api';

export default function useOtp() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  function startCooldown() {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function sendOtp(phoneNumber) {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/otp/send', { phone: phoneNumber });
      setPhone(phoneNumber);
      setStep('otp');
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (cooldown > 0) return;
    await sendOtp(phone);
  }

  async function verifyOtp(otp, role = 'customer') {
    setError('');
    setLoading(true);
    try {
      const endpoint = role === 'partner' ? '/auth/partner/verify-otp' : '/auth/otp/verify';
      const { data } = await api.post(endpoint, { phone, otp });
      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhone('');
    setStep('phone');
    setError('');
    setCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }

  return { phone, step, loading, error, cooldown, sendOtp, resendOtp, verifyOtp, reset };
}
