import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const TRADES = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Welder', 'Mason', 'Tiler', 'AC Technician'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    trade: 'Electrician', experience: 1, location: '', bio: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role };
      const data = await register(payload);
      toast.success('Account created! Verify your phone to finish.');
      if (!data.user.is_phone_verified) {
        navigate('/verify-phone', { state: { devCode: data.devCode } });
      } else {
        navigate(role === 'artisan' ? '/artisan' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {['client', 'artisan'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-lg py-2 text-sm font-medium capitalize transition ${
                role === r ? 'bg-white text-brand-700 shadow' : 'text-slate-500'
              }`}
            >
              I'm a {r}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={set('name')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input required placeholder="0241234567" className="input" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} />
          </div>

          {role === 'artisan' && (
            <div className="space-y-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Trade</label>
                  <select className="input" value={form.trade} onChange={set('trade')}>
                    {TRADES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Years of experience</label>
                  <input type="number" min={0} className="input" value={form.experience} onChange={set('experience')} />
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <input required placeholder="Koforidua, Adweso" className="input" value={form.location} onChange={set('location')} />
              </div>
              <div>
                <label className="label">Short bio</label>
                <textarea rows={3} className="input" value={form.bio} onChange={set('bio')} />
              </div>
            </div>
          )}

          <button disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Create account'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
