import { Link } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import Avatar from './Avatar.jsx';

const availabilityStyles = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-amber-100 text-amber-700',
  offline: 'bg-slate-100 text-slate-500',
};

export default function ArtisanCard({ artisan }) {
  return (
    <Link
      to={`/artisans/${artisan.id}`}
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar src={artisan.avatar_url} name={artisan.name} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-900">{artisan.name}</h3>
            {typeof artisan.match_score === 'number' && (
              <span className="badge bg-brand-50 text-brand-700">{artisan.match_score}% match</span>
            )}
          </div>
          <p className="text-sm font-medium text-brand-700">{artisan.trade}</p>
          <StarRating value={artisan.rating} count={artisan.rating_count} />
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-slate-500">{artisan.bio || 'Skilled artisan ready to help.'}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
          {artisan.location}
        </span>
        {artisan.distance_km != null && <span>· {artisan.distance_km} km away</span>}
        <span className={`badge ${availabilityStyles[artisan.availability] || ''}`}>{artisan.availability}</span>
        {artisan.hourly_rate && <span className="ml-auto font-semibold text-slate-700">GHS {artisan.hourly_rate}/hr</span>}
      </div>
    </Link>
  );
}
