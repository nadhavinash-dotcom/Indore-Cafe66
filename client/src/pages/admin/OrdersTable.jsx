import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatISTDate, formatISTTime } from '../../lib/timeUtils';

export default function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }), status: '', area: '' });
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/orders?${params}`);
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filters, page]);

  const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="font-playfair text-2xl text-ci-white font-bold">All Orders</h1>

        {/* Filters */}
        <Card className="flex flex-wrap gap-3">
          <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })}
            className="bg-ci-black border border-ci-black-border text-ci-white px-3 py-2 rounded-xl text-sm focus:border-ci-gold" />
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="bg-ci-black border border-ci-black-border text-ci-white px-3 py-2 rounded-xl text-sm">
            <option value="">All Status</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={filters.area} onChange={e => setFilters({ ...filters, area: e.target.value })}
            placeholder="Filter by area..." className="bg-ci-black border border-ci-black-border text-ci-white px-3 py-2 rounded-xl text-sm focus:border-ci-gold" />
          <Button variant="secondary" size="sm" onClick={() => setFilters({ date: '', status: '', area: '' })}>Clear</Button>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-ci-white-muted text-sm">{total} orders found</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ci-black-border">
                    {['ID', 'Customer', 'Area', 'Meal', 'Date', 'Status', 'Partner'].map(h => (
                      <th key={h} className="text-ci-white-muted text-left py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-ci-black-border/40 hover:bg-ci-black/30">
                      <td className="py-2 pr-4 text-ci-white-muted">#{order.id}</td>
                      <td className="py-2 pr-4">
                        <p className="text-ci-white font-medium">{order.customer_name}</p>
                        <p className="text-ci-white-muted text-xs">{order.phone}</p>
                      </td>
                      <td className="py-2 pr-4 text-ci-gold text-xs">{order.area}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-semibold ${order.meal_type === 'lunch' ? 'text-ci-gold' : 'text-ci-gold-light'}`}>{order.meal_type}</span>
                        <span className="text-ci-white-muted text-xs ml-1">({order.meal_preference})</span>
                      </td>
                      <td className="py-2 pr-4 text-ci-white-muted text-xs">{formatISTDate(order.delivery_date)}</td>
                      <td className="py-2 pr-4"><Badge status={order.status}>{order.status}</Badge></td>
                      <td className="py-2 pr-4 text-ci-white-muted text-xs">{order.partner_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 50 && (
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <span className="text-ci-white-muted text-sm self-center">Page {page}</span>
                <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < 50}>Next</Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
