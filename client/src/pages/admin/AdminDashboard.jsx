import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Truck, TrendingUp, AlertCircle, ChefHat, CheckCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { formatISTDate } from '../../lib/timeUtils';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [kitchen, setKitchen] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [statsRes, kitchenRes, revRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/kitchen/today'),
        api.get('/admin/revenue/summary?period=day'),
      ]);
      setStats(statsRes.data);
      setKitchen(kitchenRes.data);
      setRevenue(revRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <AdminLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></AdminLayout>;

  const metricCards = [
    { label: 'Active Subscribers', value: stats?.activeSubscribers, icon: Users, color: 'text-ci-gold' },
    { label: 'Trial Subscribers', value: stats?.trialSubscribers, icon: Users, color: 'text-ci-gold-light' },
    { label: "Today's Orders", value: stats?.todayOrders, icon: ShoppingBag, color: 'text-ci-gold' },
    { label: 'Delivered Today', value: stats?.todayDelivered, icon: CheckCircle, color: 'text-ci-success' },
    { label: 'Revenue Today', value: `₹${(stats?.revenueToday || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-ci-gold' },
    { label: 'Revenue This Month', value: `₹${(stats?.revenueMonth || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-ci-gold-light' },
    { label: 'Open Tickets', value: stats?.openTickets, icon: AlertCircle, color: stats?.openTickets > 0 ? 'text-ci-error' : 'text-ci-white-muted' },
    { label: 'Partners On Duty', value: stats?.partnersOnDuty, icon: Truck, color: 'text-ci-gold' },
  ];

  const PIE_COLORS = ['#C9922A', '#E8B86D', '#7A5520', '#A89880'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-2xl text-ci-white font-bold">Dashboard</h1>
          <button onClick={load} className="text-ci-gold hover:text-ci-gold-light">
            {/* <RefreshCw size={18} /> */}
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCards.map((card) => (
            <Card key={card.label} className="flex flex-col gap-1">
              <card.icon size={18} className={card.color} />
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-ci-white-muted text-xs">{card.label}</p>
            </Card>
          ))}
        </div>

        {/* Kitchen Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ci-white font-semibold flex items-center gap-2"><ChefHat size={18} className="text-ci-gold" /> Kitchen Prep Today</h2>
            <Link to="/admin/kitchen" className="text-ci-gold text-sm hover:text-ci-gold-light">Full List →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['lunch', 'dinner'].map((meal) => {
              const k = kitchen?.[meal];
              return (
                <Card key={meal} goldLeft>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-ci-white font-semibold capitalize">{meal}</h3>
                    {k?.generated_at && <span className="text-ci-white-muted text-xs">Last: {new Date(k.generated_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  {k ? (
                    <>
                      <p className="text-3xl font-bold text-ci-gold mb-2">{k.total_count}</p>
                      <div className="space-y-1">
                        {[['Veg', k.veg_count, 'bg-ci-success'], ['Non-Veg', k.nonveg_count, 'bg-ci-error'], ['Jain', k.jain_count, 'bg-ci-gold'], ['Special', k.special_count, 'bg-ci-white-muted']].map(([label, count, color]) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-ci-white-muted text-xs w-16">{label}</span>
                            <div className="flex-1 bg-ci-black-border rounded-full h-1.5">
                              <div className={`${color} h-1.5 rounded-full`} style={{ width: `${k.total_count ? (count / k.total_count) * 100 : 0}%` }} />
                            </div>
                            <span className="text-ci-white text-xs w-6 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-ci-white-muted text-sm">The list has not been generated yet.</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Revenue Chart */}
        {revenue.length > 0 && (
          <Card>
            <h2 className="text-ci-white font-semibold mb-4">Revenue (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenue.slice(-14)}>
                <XAxis dataKey="date" tick={{ fill: '#A89880', fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fill: '#A89880', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#F5F0E8' }} formatter={v => [`₹${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#C9922A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
