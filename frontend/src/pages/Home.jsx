import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import ArtisanCard from '../components/ArtisanCard.jsx';

const POPULAR_TRADES = [
  { name: 'Electrician', icon: '⚡' },
  { name: 'Plumber', icon: '🔧' },
  { name: 'Carpenter', icon: '🪚' },
  { name: 'Painter', icon: '🎨' },
  { name: 'Welder', icon: '🔥' },
  { name: 'Mason', icon: '🧱' },
];

export default function Home() {
  const navigate = useNavigate();
  const [trade, setTrade] = useState('');
  const [location, setLocation] = useState('');
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api
      .get('/search', { params: { sort: 'rating', limit: 6 } })
      .then(({ data }) => setFeatured(data.results))
      .catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (trade) params.set('trade', trade);
    if (location) params.set('location', location);
    navigate(`/artisans?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <span className="badge bg-white/15 text-white">Koforidua Municipality</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Find trusted artisans, book in minutes.
            </h1>
            <p className="mt-4 text-lg text-brand-50">
              Plumbers, electricians, carpenters and more — verified, rated and ready to help with your next job.
            </p>

            <form onSubmit={search} className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:flex-row">
              <select value={trade} onChange={(e) => setTrade(e.target.value)} className="input text-slate-800 sm:flex-1">
                <option value="">All trades</option>
                {POPULAR_TRADES.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location e.g. Adweso"
                className="input text-slate-800 sm:flex-1"
              />
              <button type="submit" className="btn-primary sm:px-8">Search</button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold text-slate-900">Browse by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {POPULAR_TRADES.map((t) => (
            <Link
              key={t.name}
              to={`/artisans?trade=${encodeURIComponent(t.name)}`}
              className="card flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow"
            >
              <span className="text-3xl">{t.icon}</span>
              <span className="text-sm font-medium text-slate-700">{t.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-xl font-bold text-slate-900">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: '1', t: 'Search', d: 'Filter by trade, location, rating and availability.' },
              { n: '2', t: 'Book', d: 'Pick a date and describe your job. The artisan confirms.' },
              { n: '3', t: 'Pay & Review', d: 'Pay securely with Mobile Money and rate the work.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">{s.n}</div>
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Top-rated artisans</h2>
          <Link to="/artisans" className="text-sm font-medium text-brand-700 hover:underline">View all →</Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-slate-500">No artisans yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <ArtisanCard key={a.id} artisan={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
