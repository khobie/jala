import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import Loader from '../components/Loader.jsx';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) {
      setStatus('failed');
      return;
    }
    api.get(`/payments/verify/${reference}`)
      .then(({ data }) => setStatus(data.status === 'success' ? 'success' : 'failed'))
      .catch(() => setStatus('failed'));
  }, [params]);

  if (status === 'verifying') return <Loader label="Verifying your payment…" />;

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="card p-10">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          {status === 'success' ? '✓' : '✕'}
        </div>
        <h1 className="mt-4 text-xl font-bold">
          {status === 'success' ? 'Payment successful' : 'Payment not completed'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {status === 'success'
            ? 'Your payment has been recorded. Thank you!'
            : 'We could not confirm your payment. If you were charged, contact support.'}
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  );
}
