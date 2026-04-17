import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import { formatRelativeTime } from '../../lib/timeUtils';

const PRIORITY_VARIANT = { high: 'error', medium: 'warning', low: 'default' };

export default function SupportScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadTickets() {
    try {
      const { data } = await api.get('/support/admin');
      setTickets(data.tickets || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTickets(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  }

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        ListHeaderComponent={<Text style={styles.title}>Support Tickets ({tickets.length})</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No open tickets 🎉</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
              <Badge
                label={item.priority}
                variant={PRIORITY_VARIANT[item.priority] || 'default'}
              />
            </View>
            <Text style={styles.customer}>{item.customer_name} · {item.phone}</Text>
            <View style={styles.footer}>
              <Badge label={item.status} variant={item.status === 'open' ? 'warning' : 'success'} />
              <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  list: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 20 },
  empty: { color: COLORS.whiteMuted, textAlign: 'center', marginTop: 40 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  subject: { fontSize: 14, fontWeight: '700', color: COLORS.white, flex: 1, marginRight: 8 },
  customer: { color: COLORS.whiteMuted, fontSize: 13, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: COLORS.whiteMuted, fontSize: 12 },
});
