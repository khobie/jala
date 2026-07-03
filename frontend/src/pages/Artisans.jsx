import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import ArtisanCard from '../components/ArtisanCard.jsx';
import Loader from '../components/Loader.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';

export default function Artisans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trades, setTrades] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recMode, setRecMode] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, limit: 12 });

  const [filters, setFilters] = useState({
    trade: searchParams.get('trade') || '',
    location: searchParams.get('location') || '',
    minRating: searchParams.get('minRating') || '',
    availability: searchParams.get('availability') || '',
    sort: 'rating',
  });

  useEffect(() => {
    api.get('/artisans/trades').then(({ data }) => setTrades(data.trades)).catch(() => {});
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/search', { params: { ...filters, page } });
      setResults(data.results);
      setMeta({ total: data.total, limit: data.limit });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (!recMode) runSearch();
  }, [runSearch, recMode]);

  const recommend = () => {
    setRecMode(true);
    setLoading(true);
    const finish = (lat, lng) => {
      api
        .get('/search/recommend', { params: { trade: filters.trade || undefined, lat, lng } })
        .then(({ data }) => setResults(data.results))
        .catch((err) => toast.error(err.message))
        .finally(() => setLoading(false));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(pos.coords.latitude, pos.coords.longitude),
        () => finish(undefined, undefined),
        { timeout: 5000 }
      );
    } else {
      finish(undefined, undefined);
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setRecMode(false);
    setPage(1);
    const sp = {};
    Object.entries(filters).forEach(([k, v]) => v && (sp[k] = v));
    setSearchParams(sp);
    runSearch();
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Find Artisans' }]} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find an artisan</h1>
          <p className="text-sm text-slate-500">Verified professionals across the Koforidua Municipality.</p>
        </div>
        <button onClick={recommend} className="btn-outline self-start text-sm">
          ✨ Recommend for me
        </button>
      </div>

      <form onSubmit={applyFilters} className="card mt-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select className="input" value={filters.trade} onChange={set('trade')}>
          <option value="">All trades</option>
          {trades.map((t) => <option key={t.trade} value={t.trade}>{t.trade} ({t.count})</option>)}
        </select>
        <input className="input" placeholder="Location" value={filters.location} onChange={set('location')} />
        <select className="input" value={filters.minRating} onChange={set('minRating')}>
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
        </select>
        <select className="input" value={filters.availability} onChange={set('availability')}>
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
        </select>
        <button className="btn-primary">Apply filters</button>
      </form>

      {recMode && (
        <p className="mt-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">
          Showing personalized recommendations ranked by rating, distance, reliability and your booking history.
        </p>
      )}

      {loading ? (
        <Loader />
      ) : results.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-500">No artisans match your search.</div>
      ) : (
        <>
          {!recMode && (
            <p className="mt-6 text-sm text-slate-500">
              {meta.total} artisan{meta.total === 1 ? '' : 's'} found
            </p>
          )}
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => <ArtisanCard key={a.id} artisan={a} />)}
          </div>

          {!recMode && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                className="btn-outline text-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium ${
                    p === page ? 'bg-brand-700 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn-outline text-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
