import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Loader from '../components/Loader.jsx';

export default function BookingPage() {
  const { artisanId } = useParams();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    service_id: '', booking_date: '', booking_time: '', description: '', address: '', amount: '',
  });

  useEffect(() => {
    api.get(`/artisans/${artisanId}`)
      .then(({ data }) => setArtisan(data.artisan))
      .catch(() => toast.error('Could not load artisan'))
      .finally(() => setLoading(false));
  }, [artisanId]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/bookings', {
        artisan_id: Number(artisanId),
        service_id: form.service_id ? Number(form.service_id) : null,
        booking_date: form.booking_date,
        booking_time: form.booking_time || null,
        description: form.description,
        address: form.address || null,
        amount: form.amount ? Number(form.amount) : null,
      });
      toast.success('Booking request sent! The artisan will respond soon.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!artisan) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Book {artisan.name}</h1>
        <p className="text-sm text-brand-700">{artisan.trade} · {artisan.location}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {artisan.services?.length > 0 && (
            <div>
              <label className="label">Service</label>
              <select className="input" value={form.service_id} onChange={set('service_id')}>
                <option value="">General request</option>
                {artisan.services.map((s) => (
                  <option key={s.id} value={s.id}>{s.service_name}{s.price ? ` — GHS ${s.price}` : ''}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input type="date" required className="input" value={form.booking_date} onChange={set('booking_date')} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={form.booking_time} onChange={set('booking_time')} />
            </div>
          </div>
          <div>
            <label className="label">Describe the job</label>
            <textarea required rows={4} className="input" placeholder="e.g. Need wiring for a 2-bedroom apartment"
              value={form.description} onChange={set('description')} />
          </div>
          <div>
            <label className="label">Address / landmark</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
          <div>
            <label className="label">Agreed amount (GHS, optional)</label>
            <input type="number" min={0} className="input" value={form.amount} onChange={set('amount')} />
          </div>
          <button disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending…' : 'Send booking request'}
          </button>
        </form>
      </div>
    </div>
  );
}
