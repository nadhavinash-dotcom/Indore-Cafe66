import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      await setAuth('admin', data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <Text style={styles.icon}>⚙️</Text>
        </View>
        <Text style={styles.title}>Admin Portal</Text>
        <Text style={styles.subtitle}>Cafe Indori Management</Text>

        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="admin@cafeindoori.com" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" error={error} />

        <Button title="Login" onPress={handleLogin} loading={loading} />
        <Text style={styles.devHint}>Dev: admin@cafeindori.com / Admin@123</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, flexGrow: 1 },
  back: { marginBottom: 24 },
  backText: { color: COLORS.gold, fontSize: 15 },
  iconRow: { alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 6, textAlign: 'center' },
  subtitle: { color: COLORS.whiteMuted, fontSize: 14, marginBottom: 32, textAlign: 'center' },
  devHint: { color: COLORS.blackBorder, fontSize: 11, textAlign: 'center', marginTop: 24 },
});
