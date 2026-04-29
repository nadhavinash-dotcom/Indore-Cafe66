import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';

export default function KitchenScreen() {
  const [lists, setLists] = useState({ lunch: null, dinner: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(null);

  async function loadKitchen() {
    try {
      const { data } = await api.get('/admin/kitchen/today');
      setLists({ lunch: data.lunch, dinner: data.dinner });
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadKitchen(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadKitchen();
    setRefreshing(false);
  }

  async function generateList(mealType) {
    Alert.alert(
      'Regenerate List',
      `Re-generate ${mealType} prep list for today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGenerating(mealType);
            try {
              await api.post('/admin/kitchen/refresh', { mealType });
              await loadKitchen();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed');
            } finally {
              setGenerating(null);
            }
          },
        },
      ]
    );
  }

  if (loading) return <Spinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        <Text style={styles.title}>Kitchen Prep List</Text>

        {['lunch', 'dinner'].map((meal) => {
          const list = lists[meal];
          const summary = list ? JSON.parse(list.meal_data || '{}').summary : null;
          const byArea = list ? JSON.parse(list.meal_data || '{}').byArea || {} : {};
          return (
            <View key={meal} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>{meal === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</Text>
                <Button
                  title="↺ Refresh"
                  variant="secondary"
                  onPress={() => generateList(meal)}
                  loading={generating === meal}
                  style={styles.refreshBtn}
                  textStyle={styles.refreshBtnText}
                />
              </View>

              {summary ? (
                <>
                  <View style={styles.summaryRow}>
                    {[
                      { label: 'Total', value: summary.total, color: COLORS.gold },
                      { label: 'Veg', value: summary.veg, color: COLORS.success },
                      { label: 'Jain', value: summary.jain, color: COLORS.warning },
                    ].map((item) => (
                      <Card key={item.label} style={styles.summaryCard}>
                        <Text style={[styles.summaryNum, { color: item.color }]}>{item.value || 0}</Text>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                      </Card>
                    ))}
                  </View>

                  <Text style={styles.areaTitle}>By Area</Text>
                  {Object.entries(byArea).map(([area, counts]) => (
                    <Card key={area} style={styles.areaCard}>
                      <View style={styles.areaRow}>
                        <Text style={styles.areaName}>{area}</Text>
                        <Text style={styles.areaCount}>{counts.total || 0} tiffins</Text>
                      </View>
                      <Text style={styles.areaBreakdown}>
                        V:{counts.veg || 0} · NV:{counts.nonveg || 0} · J:{counts.jain || 0}
                      </Text>
                    </Card>
                  ))}
                </>
              ) : (
                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No prep list yet. Tap ↺ to generate.</Text>
                </Card>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 20 },
  mealSection: { marginBottom: 28 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  refreshBtn: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  refreshBtnText: { fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 10, padding: 8 },
  summaryNum: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { color: COLORS.whiteMuted, fontSize: 11, marginTop: 2 },
  areaTitle: { fontSize: 14, fontWeight: '700', color: COLORS.whiteMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  areaCard: { marginBottom: 8 },
  areaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  areaName: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  areaCount: { color: COLORS.gold, fontSize: 14, fontWeight: '600' },
  areaBreakdown: { color: COLORS.whiteMuted, fontSize: 12, marginTop: 4 },
  emptyCard: { alignItems: 'center' },
  emptyText: { color: COLORS.whiteMuted, fontSize: 14 },
});
