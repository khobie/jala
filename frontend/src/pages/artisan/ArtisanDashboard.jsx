import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatCard from '../../components/StatCard.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext.jsx';

const SECTIONS = ['Bookings', 'Earnings', 'Profile', 'Services', 'Portfolio'];

/* ---------- Bookings ---------- */
function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/bookings/artisan')
      .then(({ data }) => setBookings(data.bookings))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const update = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Booking ${status}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader />;
  if (!bookings.length) return <div className="card p-10 text-center text-slate-500">No bookings yet.</div>;

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{b.client_name}</p>
              <StatusBadge status={b.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{b.description}</p>
            <p className="mt-1 text-xs text-slate-400">
              {b.booking_date}{b.booking_time ? ` · ${b.booking_time}` : ''} · {b.client_phone} {b.amount ? `· GHS ${b.amount}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {b.status === 'pending' && (
              <>
                <button className="btn-primary text-sm" onClick={() => update(b.id, 'accepted')}>Accept</button>
                <button className="btn-outline text-sm text-rose-600" onClick={() => update(b.id, 'rejected')}>Reject</button>
              </>
            )}
            {b.status === 'accepted' && (
              <button className="btn-primary text-sm" onClick={() => update(b.id, 'completed')}>Mark complete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Earnings ---------- */
function Earnings() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/artisans/me/earnings').then(({ data }) => setData(data)).catch(() => {});
  }, []);
  if (!data) return <Loader />;

  const chart = [...data.monthly].reverse().map((m) => ({ month: m.month, earnings: Number(m.earnings) }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total jobs" value={data.stats.total_jobs} icon="📋" />
        <StatCard label="Completed" value={data.stats.completed_jobs || 0} icon="✅" accent="green" />
        <StatCard label="Total earnings" value={`GHS ${Number(data.stats.total_earnings).toLocaleString()}`} icon="💰" accent="amber" />
        <StatCard label="Rating" value={Number(data.rating).toFixed(1)} icon="⭐" accent="blue" />
      </div>
      <div className="card p-5">
        <h3 className="mb-4 font-semibold">Monthly earnings (GHS)</h3>
        {chart.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="earnings" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500">No completed jobs yet.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Profile ---------- */
function Profile({ onSaved }) {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/artisans/me/profile').then(({ data }) => setProfile(data.artisan));
  }, []);

  if (!profile) return <Loader />;

  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/artisans/me/profile', {
        trade: profile.trade, experience: Number(profile.experience), location: profile.location,
        bio: profile.bio, hourly_rate: profile.hourly_rate ? Number(profile.hourly_rate) : null,
        availability: profile.availability, whatsapp: profile.whatsapp,
        latitude: profile.latitude, longitude: profile.longitude,
      });
      toast.success('Profile updated');
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post('/artisans/me/avatar', fd);
      toast.success('Avatar updated');
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <div>
        <label className="label">Profile photo</label>
        <input type="file" accept="image/*" onChange={uploadAvatar} className="text-sm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Trade</label><input className="input" value={profile.trade} onChange={set('trade')} /></div>
        <div><label className="label">Experience (years)</label><input type="number" className="input" value={profile.experience} onChange={set('experience')} /></div>
        <div><label className="label">Location</label><input className="input" value={profile.location} onChange={set('location')} /></div>
        <div><label className="label">Hourly rate (GHS)</label><input type="number" className="input" value={profile.hourly_rate || ''} onChange={set('hourly_rate')} /></div>
        <div><label className="label">WhatsApp number</label><input className="input" value={profile.whatsapp || ''} onChange={set('whatsapp')} placeholder="233541234567" /></div>
        <div>
          <label className="label">Availability</label>
          <select className="input" value={profile.availability} onChange={set('availability')}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div><label className="label">Latitude</label><input className="input" value={profile.latitude || ''} onChange={set('latitude')} /></div>
        <div><label className="label">Longitude</label><input className="input" value={profile.longitude || ''} onChange={set('longitude')} /></div>
      </div>
      <div><label className="label">Bio</label><textarea rows={4} className="input" value={profile.bio || ''} onChange={set('bio')} /></div>
      {!profile.is_approved && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Your profile is pending admin approval. It won't appear in search until approved.
        </p>
      )}
      <button disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}

/* ---------- Services ---------- */
function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ service_name: '', description: '', price: '' });

  const load = () => api.get('/artisans/me/profile').then(({ data }) => setServices(data.artisan.services || []));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post('/artisans/me/services', {
        service_name: form.service_name, description: form.description,
        price: form.price ? Number(form.price) : null,
      });
      setForm({ service_name: '', description: '', price: '' });
      toast.success('Service added');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    await api.delete(`/artisans/me/services/${id}`);
    load();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={add} className="card space-y-3 p-6">
        <h3 className="font-semibold">Add a service</h3>
        <input className="input" placeholder="Service name" required value={form.service_name}
          onChange={(e) => setForm({ ...form, service_name: e.target.value })} />
        <textarea className="input" rows={2} placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" placeholder="Price (GHS)" value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <button className="btn-primary">Add service</button>
      </form>
      <div className="card p-6">
        <h3 className="mb-3 font-semibold">Your services</h3>
        {services.length ? (
          <ul className="divide-y divide-slate-100">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{s.service_name}</p>
                  <p className="text-sm text-slate-500">{s.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.price && <span className="font-semibold">GHS {s.price}</span>}
                  <button onClick={() => remove(s.id)} className="text-sm text-rose-600 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-500">No services yet.</p>}
      </div>
    </div>
  );
}

/* ---------- Portfolio ---------- */
const KIND_BADGE = {
  before: 'bg-amber-100 text-amber-700',
  after: 'bg-green-100 text-green-700',
  general: 'bg-slate-100 text-slate-600',
};

function Portfolio() {
  const [images, setImages] = useState([]);
  const [kind, setKind] = useState('general');
  const [caption, setCaption] = useState('');
  const load = () => api.get('/artisans/me/profile').then(({ data }) => setImages(data.artisan.portfolio || []));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('kind', kind);
    if (caption) fd.append('caption', caption);
    try {
      await api.post('/artisans/me/portfolio', fd);
      toast.success('Image added');
      setCaption('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const remove = async (id) => {
    await api.delete(`/artisans/me/portfolio/${id}`);
    load();
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="font-semibold">Portfolio gallery</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label mb-1 text-xs">Category</label>
            <select className="input py-1.5 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="general">General</option>
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>
          </div>
          <input className="input py-1.5 text-sm" placeholder="Caption (optional)" value={caption}
            onChange={(e) => setCaption(e.target.value)} />
          <label className="btn-outline cursor-pointer text-sm">
            Upload image
            <input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
        </div>
      </div>
      {images.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl">
              <img src={img.image_url} alt={img.caption || ''} className="h-32 w-full object-cover" />
              {img.kind && img.kind !== 'general' && (
                <span className={`badge absolute left-1 top-1 capitalize ${KIND_BADGE[img.kind]}`}>{img.kind}</span>
              )}
              <button onClick={() => remove(img.id)}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-2 py-1 text-xs text-white group-hover:block">
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">No images yet. Show off your best work!</p>}
    </div>
  );
}

export default function ArtisanDashboard() {
  const { user, refresh } = useAuth();
  const [section, setSection] = useState('Bookings');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Artisan dashboard</h1>
      <p className="text-sm text-slate-500">Welcome, {user?.name}.</p>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${section === s ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {section === 'Bookings' && <Bookings />}
        {section === 'Earnings' && <Earnings />}
        {section === 'Profile' && <Profile onSaved={refresh} />}
        {section === 'Services' && <Services />}
        {section === 'Portfolio' && <Portfolio />}
      </div>
    </div>
  );
}
