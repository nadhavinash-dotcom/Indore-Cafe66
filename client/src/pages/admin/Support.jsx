import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatISTDateTime } from '../../lib/timeUtils';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');

  async function load() {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/support/admin/tickets${params}`); 
            console.log(params,res)
     
      setTickets(res.data.tickets);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    const res = await api.get(`/support/admin/tickets/${id}`);
    setDetail(res.data);
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/admin/tickets/${selected.id}/reply`, { content: reply });
      setReply('');
      await loadDetail(selected.id);
      toast.success('Reply sent');
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status) {
    await api.put(`/support/admin/tickets/${selected.id}/status`, { status });
    load();
    setSelected(null);
    setDetail(null);
    toast.success('Status updated');
  }

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="font-playfair text-2xl text-ci-white font-bold">Support Tickets</h1>

        <div className="flex gap-2">
          {['open', 'in_progress', 'resolved', 'closed', ''].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${statusFilter === s ? 'bg-ci-gold text-ci-black font-semibold' : 'text-ci-white-muted border border-ci-black-border hover:border-ci-gold'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <div className="space-y-2">
            {tickets.map(t => (
              <Card key={t.id}
                className={`cursor-pointer ${t.priority === 'high' ? 'border-l-4 border-l-ci-error' : ''}`}
                onClick={() => { setSelected(t); loadDetail(t.id); }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-ci-white-muted text-xs">#{t.id}</span>
                      <Badge status={t.status}>{t.status}</Badge>
                      {t.priority === 'high' && <Badge variant="error">HIGH</Badge>}
                    </div>
                    <p className="text-ci-white font-medium">{t.subject}</p>
                    <p className="text-ci-white-muted text-xs mt-0.5">{t.customer_name} · {t.category}</p>
                  </div>
                  <p className="text-ci-white-muted text-xs flex-shrink-0">{formatISTDateTime(t.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.subject || ''} size="lg">
        {!detail ? <Spinner className="mx-auto" /> : (
          <div className="space-y-4 max-h-[65vh] flex flex-col">
            <div className="flex gap-2">
              {['in_progress', 'resolved', 'closed'].map(s => (
                <Button key={s} variant="secondary" size="sm" onClick={() => updateStatus(s)}>{s}</Button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {detail.messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.sender_type === 'agent' ? 'bg-ci-gold text-ci-black' : 'bg-ci-black border border-ci-black-border text-ci-white'}`}>
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs mt-1 opacity-60">{m.sender_name} · {formatISTDateTime(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply likhein..."
                className="flex-1 input-field" onKeyDown={e => { if (e.key === 'Enter') sendReply(); }} />
              <Button onClick={sendReply} loading={sending} className="px-4"><Send size={16} /></Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
