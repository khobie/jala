import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', code: '', newPassword: '' });
  const [devCode, setDevCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      if (data.devCode) setDevCode(data.devCode);
      toast.success('If the account exists, a reset code was sent by SMS.');
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', form);
      toast.success('Password reset! You can log in now.');
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>

        {step === 1 && (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <p className="text-sm text-slate-500">Enter your email and we'll send a reset code to your phone.</p>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={set('email')} />
            </div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Sending…' : 'Send reset code'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={reset} className="mt-6 space-y-4">
            {devCode && (
              <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm">
                <span className="text-brand-700">Development mode — your code is </span>
                <button type="button" onClick={() => setForm((f) => ({ ...f, code: devCode }))}
                  className="font-mono text-lg font-bold tracking-widest text-brand-800 underline" title="Click to fill">
                  {devCode}
                </button>
              </div>
            )}
            <div>
              <label className="label">Reset code (SMS)</label>
              <input required className="input tracking-widest" value={form.code} onChange={set('code')} />
            </div>
            <div>
              <label className="label">New password</label>
              <input type="password" minLength={6} required className="input" value={form.newPassword} onChange={set('newPassword')} />
            </div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Resetting…' : 'Reset password'}</button>
          </form>
        )}

        {step === 3 && (
          <div className="mt-6 text-center">
            <p className="text-slate-600">Your password has been reset.</p>
            <Link to="/login" className="btn-primary mt-4 inline-flex">Go to login</Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
