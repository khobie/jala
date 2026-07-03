import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifyPhone() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(location.state?.devCode || null);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    try {
      const { data } = await api.post('/auth/phone/send-otp');
      if (data.devCode) setDevCode(data.devCode);
      toast.success('A new code was sent to your phone.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/phone/verify', { code });
      await refresh();
      toast.success('Phone verified!');
      navigate(user?.role === 'artisan' ? '/artisan' : '/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Verify your phone</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit code to <span className="font-medium">{user?.phone}</span>.
        </p>

        {devCode && (
          <div className="mt-4 rounded-lg border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm">
            <span className="text-brand-700">Development mode — your code is </span>
            <button
              type="button"
              onClick={() => setCode(devCode)}
              className="font-mono text-lg font-bold tracking-widest text-brand-800 underline"
              title="Click to fill"
            >
              {devCode}
            </button>
          </div>
        )}

        <form onSubmit={verify} className="mt-6 space-y-4">
          <input
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input text-center text-2xl tracking-[0.5em]"
            placeholder="••••••"
          />
          <button disabled={loading} className="btn-primary w-full">{loading ? 'Verifying…' : 'Verify'}</button>
        </form>
        <button onClick={resend} className="mt-4 text-sm text-brand-700 hover:underline">Resend code</button>
      </div>
    </div>
  );
}
