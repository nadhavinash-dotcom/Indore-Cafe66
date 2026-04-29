import { useState, useEffect, useRef } from 'react';
import { Printer, RefreshCw, ChefHat, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { formatISTDate } from '../../lib/timeUtils';

export default function KitchenPrepList() {
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }));
  const [meal, setMeal] = useState('both');
  const [data, setData] = useState({ lunch: null, dinner: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const printRef = useRef();

  async function load() {
    setLoading(true);
    try {
      if (date === new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' })) {
        const res = await api.get('/admin/kitchen/today');
        setData({ lunch: res.data.lunch, dinner: res.data.dinner });
      } else {
        const [l, d] = await Promise.all([
          api.get(`/admin/kitchen/${date}/lunch`),
          api.get(`/admin/kitchen/${date}/dinner`),
        ]);
        setData({ lunch: l.data.exists ? l.data : null, dinner: d.data.exists ? d.data : null });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await api.post('/admin/kitchen/refresh', { date });
      await load();
      toast.success('Kitchen list updated!');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [date]);

  function handlePrint() { window.print(); }

  const mealsToShow = meal === 'both' ? ['lunch', 'dinner'] : [meal];
console.log(data)
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <h1 className="font-playfair text-2xl text-ci-white font-bold flex items-center gap-2">
            <ChefHat className="text-ci-gold" size={24} /> Kitchen Prep List
          </h1>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-ci-black border border-ci-black-border text-ci-white px-3 py-2 rounded-xl text-sm focus:border-ci-gold" />
            <div className="flex border border-ci-black-border rounded-xl overflow-hidden">
              {['lunch', 'dinner', 'both'].map(m => (
                <button key={m} onClick={() => setMeal(m)}
                  className={`px-3 py-2 text-sm capitalize transition-colors ${meal === m ? 'bg-ci-gold text-ci-black font-semibold' : 'text-ci-white-muted hover:text-ci-white'}`}>
                  {m}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
              <RefreshCw size={15} className="mr-1.5" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Printer size={15} className="mr-1.5" /> Print
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div ref={printRef} className="space-y-8">
            {/* Print header */}
            <div className="hidden print:block text-center mb-6">
              <h1 className="text-2xl font-bold">Cafe Indoor — Kitchen Prep List</h1>
              <p className="text-gray-600">{formatISTDate(date)}</p>
            </div>

            {mealsToShow.map(m => {
              const list = data[m];
              const mealData = list?.meal_data || {};
              const summary = mealData.summary || {};
              const orders = mealData.orders || [];
              const byArea = mealData.byArea || {};

              return (
                <div key={m}>
                  <h2 className="font-playfair text-xl text-ci-white font-bold capitalize mb-4 flex items-center gap-2">
                    {m === 'lunch' ? '☀️' : '🌙'} {m} — {formatISTDate(date)}
                  </h2>

                  {!list ? (
                    <Card><p className="text-ci-white-muted">No orders found.</p></Card>
                  ) : (
                    <>
                      {/* Summary Card */}
                      <Card goldLeft className="mb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-ci-white-muted text-sm">Total Tiffins</p>
                            <p className="text-4xl font-bold text-ci-gold">{summary.total || 0}</p>
                          </div>
                          {list.generated_at && (
                            <p className="text-ci-white-muted text-xs">Updated: {new Date(list.generated_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                          {[['Veg', summary.veg, 'text-ci-success'], ['Jain', summary.jain, 'text-ci-gold'], ['Special', summary.special, 'text-ci-white-muted']].map(([label, count, color]) => (
                            <div key={label} className="bg-ci-black rounded-xl p-3 text-center">
                              <p className={`text-2xl font-bold ${color}`}>{count || 0}</p>
                              <p className="text-ci-white-muted text-xs">{label}</p>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Area Breakdown */}
                      {Object.keys(byArea).length > 0 && (
                        <Card className="mb-4">
                          <h3 className="text-ci-white font-semibold mb-3 flex items-center gap-2"><MapPin size={16} className="text-ci-gold" /> By Area</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-ci-black-border">
                                  {['Area', 'Veg', 'Jain', 'Special', 'Total'].map(h => (
                                    <th key={h} className="text-ci-white-muted text-left py-2 pr-4">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(byArea).map(([area, counts]) => (
                                  <tr key={area} className="border-b border-ci-black-border/50">
                                    <td className="py-2 pr-4 text-ci-white font-medium">{area}</td>
                                    <td className="py-2 pr-4 text-ci-success">{counts.veg || 0}</td>
                                    <td className="py-2 pr-4 text-ci-gold">{counts.jain || 0}</td>
                                    <td className="py-2 pr-4 text-ci-white-muted">{counts.special || 0}</td>
                                    <td className="py-2 pr-4 text-ci-white font-bold">{counts.total || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      )}

                      {/* Delivery List */}
                      {orders.length > 0 && (
                        <Card>
                          <h3 className="text-ci-white font-semibold mb-3">Delivery List</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-ci-black-border">
                                  {['Sr', 'Customer', 'Area', 'Address', 'Preference', 'Notes', 'Status'].map(h => (
                                    <th key={h} className="text-ci-white-muted text-left py-2 pr-3">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map((order) => (
                                  <tr key={order.orderId} className="border-b border-ci-black-border/40 hover:bg-ci-black/50">
                                    <td className="py-2 pr-3 text-ci-white-muted">{order.sr}</td>
                                    <td className="py-2 pr-3 text-ci-white">{order.customerName}</td>
                                    <td className="py-2 pr-3 text-ci-gold text-xs">{order.area}</td>
                                    <td className="py-2 pr-3 text-ci-white-muted text-xs max-w-[150px] truncate">{order.address}</td>
                                    <td className="py-2 pr-3">
                                      <span className={`text-xs font-medium ${order.mealPreference === 'veg' ?  'text-ci-error' : 'text-ci-gold'}`}>
                                        {order.mealPreference}
                                      </span>
                                    </td>
                                    <td className="py-2 pr-3 text-ci-white-muted text-xs max-w-[100px] truncate">{order.notes || '—'}</td>
                                    {/* <td className="py-2 pr-3 text-ci-white-muted text-xs">{order.partnerName || '—'}</td> */}
                                    <td className="py-2 pr-3"><Badge status={order.status}>{order.status}</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
