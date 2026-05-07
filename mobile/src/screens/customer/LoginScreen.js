import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import OtpInput from '../../components/ui/OtpInput';
import useOtp from '../../hooks/useOtp';
import useAuthStore from '../../store/authStore';
import { registerForPushNotificationsAsync } from '../../lib/notifications';

export default function CustomerLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const { step, loading, error, cooldown, sendOtp, verifyOtp, reset } = useOtp();
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSend() {
    if (phone.length !== 10) {
      Alert.alert('Invalid phone', 'Enter a 10-digit mobile number');
      return;
    }
    await sendOtp(phone);
  }

  async function handleVerify(otp) {
    const result = await verifyOtp(otp, 'customer');
    if (result.success) {
      await setAuth('customer', result);
      registerForPushNotificationsAsync('customer').catch(() => {});

    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          {step === 'phone' ? 'Enter your phone number to continue' : `OTP sent to +91 ${phone}`}
        </Text>

        {step === 'phone' ? (
          <>
            <Input
              label="Mobile Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="10-digit mobile number"
              error={error}
            />
            <Button title="Send OTP" onPress={handleSend} loading={loading} />
          </>
        ) : (
          <>
            <Text style={styles.otpLabel}>Enter 6-digit OTP</Text>
            <OtpInput length={6} onComplete={handleVerify} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.resendRow}>
              {cooldown > 0 ? (
                <Text style={styles.cooldown}>Resend in {cooldown}s</Text>
              ) : (
                <TouchableOpacity onPress={() => sendOtp(phone)}>
                  <Text style={styles.resend}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={reset}>
                <Text style={styles.change}>Change Number</Text>
              </TouchableOpacity>
            </View>
            <Button title="Verify OTP" onPress={() => {}} loading={loading} style={styles.verifyBtn} disabled />
          </>
        )}

        <Text style={styles.devHint}>Dev: OTP is 123456</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, flexGrow: 1 },
  back: { marginBottom: 32 },
  backText: { color: COLORS.gold, fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
  subtitle: { color: COLORS.whiteMuted, fontSize: 14, marginBottom: 32 },
  otpLabel: { color: COLORS.whiteMuted, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  error: { color: COLORS.error, fontSize: 13, marginTop: 12, textAlign: 'center' },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cooldown: { color: COLORS.whiteMuted, fontSize: 14 },
  resend: { color: COLORS.gold, fontSize: 14 },
  change: { color: COLORS.whiteMuted, fontSize: 14 },
  verifyBtn: { marginTop: 24 },
  devHint: { color: COLORS.blackBorder, fontSize: 11, textAlign: 'center', marginTop: 32 },
});
