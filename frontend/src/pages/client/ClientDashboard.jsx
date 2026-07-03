import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import StarRating from '../../components/StarRating.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TABS = ['all', 'pending', 'accepted', 'completed', 'cancelled'];

function ReviewModal({ booking, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/reviews', { booking_id: booking.id, rating, comment });
      toast.success('Thanks for your review!');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Review {booking.artisan_name}</h3>
        <div className="mt-4"><StarRating value={rating} size="lg" onChange={setRating} /></div>
        <textarea rows={4} className="input mt-4" placeholder="How was the work?"
          value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Submit review'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [reviewing, setReviewing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/bookings/me')
      .then(({ data }) => setBookings(data.bookings))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const pay = async (id) => {
    try {
      const { data } = await api.post('/payments/initialize', { booking_id: id });
      window.location.href = data.authorization_url;
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);
  const counts = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Hi, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-sm text-slate-500">Track and manage your bookings.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total bookings" value={bookings.length} icon="📋" />
        <StatCard label="Pending" value={counts.pending} icon="⏳" accent="amber" />
        <StatCard label="Completed" value={counts.completed} icon="✅" accent="green" />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-500">No {tab !== 'all' ? tab : ''} bookings.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{b.artisan_name}</p>
                  <span className="text-sm text-brand-700">· {b.trade}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{b.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {b.booking_date}{b.booking_time ? ` · ${b.booking_time}` : ''} {b.amount ? `· GHS ${b.amount}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {b.status === 'pending' && (
                  <button className="btn-outline text-sm text-rose-600" onClick={() => cancel(b.id)}>Cancel</button>
                )}
                {b.status === 'accepted' && b.amount > 0 && (
                  <button className="btn-primary text-sm" onClick={() => pay(b.id)}>Pay GHS {b.amount}</button>
                )}
                {b.status === 'completed' && (
                  <button className="btn-outline text-sm" onClick={() => setReviewing(b)}>Leave review</button>
                )}
                {b.whatsapp && (
                  <a className="btn-ghost text-sm text-green-700" target="_blank" rel="noreferrer"
                     href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`}>WhatsApp</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(); }} />
      )}
    </div>
  );
}
