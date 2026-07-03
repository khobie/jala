import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Loader from '../components/Loader.jsx';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications')
      .then(({ data }) => setItems(data.notifications))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <button onClick={markAll} className="btn-ghost text-sm">Mark all read</button>
      </div>
      {items.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">No notifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className={`card p-4 ${n.is_read ? '' : 'border-l-4 border-l-brand-500'}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{n.title}</p>
                <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
