import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const SECTIONS = ['Overview', 'Approvals', 'Users', 'Bookings', 'Reviews', 'Reports'];
const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#94a3b8'];

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/dashboard').then(({ data }) => setData(data)); }, []);
  if (!data) return <Loader />;

  const pie = data.bookingsByStatus.map((b) => ({ name: b.status, value: Number(b.count) }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Clients" value={data.stats.total_clients} icon="👥" />
        <StatCard label="Artisans" value={data.stats.total_artisans} icon="🛠" accent="blue" />
        <StatCard label="Pending" value={data.stats.pending_artisans} icon="⏳" accent="amber" />
        <StatCard label="Bookings" value={data.stats.total_bookings} icon="📋" />
        <StatCard label="Completed" value={data.stats.completed_bookings} icon="✅" accent="green" />
        <StatCard label="Revenue" value={`GHS ${Number(data.stats.revenue).toLocaleString()}`} icon="💰" accent="rose" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Bookings by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Recent bookings</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {data.recentBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span>{b.client_name} → {b.artisan_name} <span className="text-slate-400">({b.trade})</span></span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Approvals() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    api.get('/admin/artisans/pending').then(({ data }) => setList(data.artisans)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const approve = async (id) => {
    await api.patch(`/admin/artisans/${id}/approve`);
    toast.success('Artisan approved');
    load();
  };

  if (loading) return <Loader />;
  if (!list.length) return <div className="card p-10 text-center text-slate-500">No pending approvals 🎉</div>;

  return (
    <div className="space-y-3">
      {list.map((a) => (
        <div key={a.id} className="card flex items-center justify-between p-5">
          <div>
            <p className="font-semibold">{a.name} <span className="text-brand-700">· {a.trade}</span></p>
            <p className="text-sm text-slate-500">{a.location} · {a.experience} yrs · {a.phone}</p>
            <p className="text-xs text-slate-400">{a.email} · phone {a.is_phone_verified ? 'verified' : 'unverified'}</p>
          </div>
          <button className="btn-primary text-sm" onClick={() => approve(a.id)}>Approve</button>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const load = () => api.get('/admin/users', { params: { role: role || undefined } }).then(({ data }) => setUsers(data.users));
  useEffect(() => { load(); }, [role]); // eslint-disable-line

  const toggle = async (u) => {
    await api.patch(`/admin/users/${u.id}/active`, { is_active: !u.is_active });
    toast.success(u.is_active ? 'Account suspended' : 'Account reactivated');
    load();
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 p-4">
        <span className="text-sm font-medium">Filter:</span>
        <select className="input max-w-[160px]" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="artisan">Artisans</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-2 font-medium">{u.name}</td>
              <td className="px-4 py-2 text-slate-500">{u.email}</td>
              <td className="px-4 py-2 capitalize">{u.role}</td>
              <td className="px-4 py-2">{u.is_active ? <span className="text-green-600">Active</span> : <span className="text-rose-600">Suspended</span>}</td>
              <td className="px-4 py-2 text-right">
                {u.role !== 'admin' && (
                  <button onClick={() => toggle(u)} className="text-sm text-brand-700 hover:underline">
                    {u.is_active ? 'Suspend' : 'Reactivate'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bookings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/bookings').then(({ data }) => setList(data.bookings)).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">Client</th><th className="px-4 py-2">Artisan</th><th className="px-4 py-2">Trade</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-2">{b.id}</td>
              <td className="px-4 py-2">{b.client_name}</td>
              <td className="px-4 py-2">{b.artisan_name}</td>
              <td className="px-4 py-2">{b.trade}</td>
              <td className="px-4 py-2">{b.booking_date}</td>
              <td className="px-4 py-2">{b.amount ? `GHS ${b.amount}` : '—'}</td>
              <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Reviews() {
  const [list, setList] = useState([]);
  const load = () => api.get('/admin/reviews').then(({ data }) => setList(data.reviews));
  useEffect(() => { load(); }, []);

  const toggle = async (r) => {
    await api.patch(`/admin/reviews/${r.id}/hidden`, { is_hidden: !r.is_hidden });
    toast.success(r.is_hidden ? 'Review restored' : 'Review hidden');
    load();
  };

  return (
    <div className="space-y-3">
      {list.map((r) => (
        <div key={r.id} className={`card p-4 ${r.is_hidden ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm"><span className="font-medium">{r.client_name}</span> → {r.artisan_name} · {'★'.repeat(r.rating)}</p>
            <button onClick={() => toggle(r)} className="text-sm text-brand-700 hover:underline">
              {r.is_hidden ? 'Restore' : 'Hide'}
            </button>
          </div>
          {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/reports').then(({ data }) => setData(data)); }, []);
  if (!data) return <Loader />;

  const monthly = [...data.monthlyBookings].reverse().map((m) => ({ month: m.month, bookings: Number(m.bookings) }));

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="mb-4 font-semibold">Monthly bookings</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
            <Bar dataKey="bookings" fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Most booked artisans</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {data.topArtisans.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span>{a.name} <span className="text-slate-400">({a.trade})</span></span>
                <span className="font-semibold">{a.bookings} bookings</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Top trades</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {data.topTrades.map((t) => (
              <li key={t.trade} className="flex justify-between py-2"><span>{t.trade}</span><span className="font-semibold">{t.bookings}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [section, setSection] = useState('Overview');
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${section === s ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {section === 'Overview' && <Overview />}
        {section === 'Approvals' && <Approvals />}
        {section === 'Users' && <Users />}
        {section === 'Bookings' && <Bookings />}
        {section === 'Reviews' && <Reviews />}
        {section === 'Reports' && <Reports />}
      </div>
    </div>
  );
}
