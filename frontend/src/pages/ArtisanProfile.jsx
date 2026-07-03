import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client.js';
import Loader from '../components/Loader.jsx';
import StarRating from '../components/StarRating.jsx';
import Avatar from '../components/Avatar.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function whatsappLink(number, name) {
  const clean = String(number || '').replace(/\D/g, '');
  const text = encodeURIComponent(`Hello ${name || ''}, I found you on Artisan Koforidua and would like to discuss a job.`);
  return `https://wa.me/${clean}?text=${text}`;
}

export default function ArtisanProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api
      .get(`/artisans/${id}`)
      .then(({ data }) => setArtisan(data.artisan))
      .catch(() => setArtisan(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!artisan) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-500">Artisan not found.</div>;

  const mapSrc = artisan.latitude && artisan.longitude
    ? `https://www.google.com/maps?q=${artisan.latitude},${artisan.longitude}&z=14&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(artisan.location)}&z=13&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Find Artisans', to: '/artisans' }, { label: artisan.name }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar src={artisan.avatar_url} name={artisan.name} size={88} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{artisan.name}</h1>
                  {artisan.is_phone_verified ? (
                    <span className="badge bg-green-100 text-green-700">✓ Verified</span>
                  ) : null}
                </div>
                <p className="font-medium text-brand-700">{artisan.trade}</p>
                <div className="mt-1"><StarRating value={artisan.rating} count={artisan.rating_count} /></div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>📍 {artisan.location}</span>
                  <span>🛠 {artisan.experience} yrs experience</span>
                  <span>✅ {artisan.jobs_completed} jobs completed</span>
                  {artisan.hourly_rate && <span>💰 GHS {artisan.hourly_rate}/hr</span>}
                </div>
              </div>
            </div>
            {artisan.bio && <p className="mt-4 text-slate-600">{artisan.bio}</p>}
          </div>

          {/* Services */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-slate-900">Services</h2>
            {artisan.services?.length ? (
              <ul className="divide-y divide-slate-100">
                {artisan.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-800">{s.service_name}</p>
                      {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                    </div>
                    {s.price && <span className="font-semibold text-slate-700">GHS {s.price}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No services listed yet.</p>
            )}
          </div>

          {/* Portfolio */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-slate-900">Portfolio gallery</h2>
            {artisan.portfolio?.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {artisan.portfolio.map((p) => (
                  <button key={p.id} onClick={() => setLightbox(p.image_url)} className="group relative overflow-hidden rounded-xl">
                    <img src={p.image_url} alt={p.caption || 'work'} className="h-32 w-full object-cover transition group-hover:scale-105" />
                    {p.kind && p.kind !== 'general' && (
                      <span className={`badge absolute left-1 top-1 capitalize ${p.kind === 'before' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {p.kind}
                      </span>
                    )}
                    {p.caption && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-left text-xs text-white">
                        {p.caption}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No portfolio images yet.</p>
            )}
          </div>

          {/* Reviews */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-slate-900">Reviews ({artisan.reviews?.length || 0})</h2>
            {artisan.reviews?.length ? (
              <ul className="space-y-4">
                {artisan.reviews.map((r) => (
                  <li key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <Avatar src={r.avatar_url} name={r.client_name} size={32} />
                      <span className="font-medium text-slate-800">{r.client_name}</span>
                      <StarRating value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card sticky top-20 p-6">
            <span className={`badge ${artisan.availability === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {artisan.availability}
            </span>
            {user?.role === 'client' || !user ? (
              <Link to={`/book/${artisan.id}`} className="btn-primary mt-4 w-full">Book this artisan</Link>
            ) : null}
            {artisan.whatsapp && (
              <a href={whatsappLink(artisan.whatsapp, artisan.name)} target="_blank" rel="noreferrer"
                 className="btn-outline mt-3 w-full text-green-700">
                💬 Chat on WhatsApp
              </a>
            )}
            <a href={`tel:${artisan.phone}`} className="btn-ghost mt-2 w-full">📞 {artisan.phone}</a>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <iframe title="map" src={mapSrc} className="h-44 w-full" loading="lazy" />
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="work" className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
