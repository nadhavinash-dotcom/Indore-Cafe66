import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatISTDate } from '../../lib/timeUtils';

export default function CustomersTable() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50, ...(search && { search }), ...(area && { area }) });
      const res = await api.get(`/customer?${params}`);
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    const res = await api.get(`/customer/${id}`);
    setDetail(res.data);
  }

  useEffect(() => { load(); }, [search, area, page]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="font-playfair text-2xl text-ci-white font-bold">Customers</h1>
        <Card className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ci-white-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone..."
              className="w-full bg-ci-black border border-ci-black-border text-ci-white px-3 py-2 pl-9 rounded-xl text-sm focus:border-ci-gold" />
          </div>
          <input value={area} onChange={e => setArea(e.target.value)} placeholder="Filter by area..."
            className="bg-ci-black border border-ci-black-border text-ci-white px-3 py-2 rounded-xl text-sm focus:border-ci-gold" />
        </Card>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <Card>
            <p className="text-ci-white-muted text-sm mb-3">{total} customers</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ci-black-border">
                    {['Name', 'Phone', 'Area', 'Plan', 'Sub Status', 'Expiry'].map(h => (
                      <th key={h} className="text-ci-white-muted text-left py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-b border-ci-black-border/40 hover:bg-ci-black/30 cursor-pointer" onClick={() => { setSelected(c); loadDetail(c.id); }}>
                      <td className="py-2 pr-4 text-ci-white font-medium">{c.name}</td>
                      <td className="py-2 pr-4 text-ci-white-muted">{c.phone}</td>
                      <td className="py-2 pr-4 text-ci-gold text-xs">{c.area}</td>
                      <td className="py-2 pr-4 text-ci-white-muted text-xs">{c.plan_type || '—'}</td>
                      <td className="py-2 pr-4">{c.sub_status ? <Badge status={c.sub_status}>{c.sub_status}</Badge> : '—'}</td>
                      <td className="py-2 pr-4 text-ci-white-muted text-xs">{c.sub_end_date ? formatISTDate(c.sub_end_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.name || ''} size="lg">
        {!detail ? <Spinner className="mx-auto" /> : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-ci-white-muted">Phone</p><p className="text-ci-white">{detail.customer.phone}</p></div>
              <div><p className="text-ci-white-muted">Area</p><p className="text-ci-white">{detail.customer.area}</p></div>
              <div><p className="text-ci-white-muted">Address</p><p className="text-ci-white">{detail.customer.address_line1}</p></div>
              <div><p className="text-ci-white-muted">Preference</p><p className="text-ci-gold">{detail.customer.meal_preference}</p></div>
            </div>
            {detail.subscriptions.length > 0 && (
              <div>
                <h4 className="text-ci-white font-semibold mb-2">Subscriptions</h4>
                {detail.subscriptions.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-ci-black-border text-sm">
                    <span className="text-ci-white">{s.plan_type} — {s.meal_type}</span>
                    <Badge status={s.status}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
