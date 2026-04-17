import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { formatISTDate } from '../../lib/timeUtils';

const COLORS = ['#C9922A', '#E8B86D', '#7A5520'];

export default function Revenue() {
  const [period, setPeriod] = useState('day');
  const [data, setData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/revenue/summary?period=${period}`);
      setData(res.data.data || []);
      setTransactions(res.data.transactions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [period]);

  const totalRevenue = data.reduce((a, b) => a + (b.revenue || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-2xl text-ci-white font-bold">Revenue</h1>
          <div className="flex border border-ci-black-border rounded-xl overflow-hidden">
            {['day', 'week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-sm capitalize transition-colors ${period === p ? 'bg-ci-gold text-ci-black font-semibold' : 'text-ci-white-muted hover:text-ci-white'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <Card goldLeft>
          <p className="text-ci-white-muted text-sm">Total Revenue</p>
          <p className="text-4xl font-bold text-ci-gold">₹{totalRevenue.toFixed(0)}</p>
        </Card>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <>
            <Card>
              <h2 className="text-ci-white font-semibold mb-4">Revenue Chart</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                  <XAxis dataKey={period === 'day' ? 'date' : period === 'week' ? 'week' : 'month'}
                    tick={{ fill: '#A89880', fontSize: 10 }} tickFormatter={v => v?.slice(-5)} />
                  <YAxis tick={{ fill: '#A89880', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#F5F0E8' }}
                    formatter={v => [`₹${v}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#C9922A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h2 className="text-ci-white font-semibold mb-3">Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ci-black-border">
                      {['Customer', 'Plan', 'Amount', 'Payment ID', 'Date'].map(h => (
                        <th key={h} className="text-ci-white-muted text-left py-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} className="border-b border-ci-black-border/40">
                        <td className="py-2 pr-4 text-ci-white">{t.customer_name}</td>
                        <td className="py-2 pr-4 text-ci-white-muted text-xs">{t.plan_type} — {t.meal_type}</td>
                        <td className="py-2 pr-4 text-ci-gold font-semibold">₹{t.amount_paid}</td>
                        <td className="py-2 pr-4 text-ci-white-muted text-xs">{t.payment_id?.slice(0, 16)}...</td>
                        <td className="py-2 pr-4 text-ci-white-muted text-xs">{formatISTDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
