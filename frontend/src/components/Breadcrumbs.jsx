import { Link } from 'react-router-dom';

/**
 * items: [{ label, to? }]  — the last item is rendered as the current page.
 */
export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-brand-700">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-slate-300">/</span>
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="hover:text-brand-700">{item.label}</Link>
          ) : (
            <span className="font-medium text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
