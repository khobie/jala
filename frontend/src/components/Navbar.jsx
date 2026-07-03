import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import Avatar from './Avatar.jsx';

function dashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'artisan') return '/artisan';
  return '/dashboard';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (active) setUnread(data.unread);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">A</span>
          <span>Artisan<span className="text-brand-700">Koforidua</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/artisans" className={({ isActive }) => `btn-ghost text-sm ${isActive ? 'text-brand-700' : ''}`}>
            Find Artisans
          </NavLink>
          {user && (
            <NavLink to={dashboardPath(user.role)} className="btn-ghost text-sm">
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="btn-ghost px-2 md:hidden"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          {user ? (
            <>
              <Link to="/notifications" className="relative btn-ghost px-2" title="Notifications">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100">
                  <Avatar src={user.avatar_url} name={user.name} size={34} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg" onMouseLeave={() => setMenuOpen(false)}>
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs capitalize text-slate-500">{user.role}</p>
                    </div>
                    <Link to={dashboardPath(user.role)} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Log in</Link>
              <Link to="/register" className="btn-primary text-sm">Get started</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          <NavLink to="/artisans" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
            Find Artisans
          </NavLink>
          {user ? (
            <>
              <NavLink to={dashboardPath(user.role)} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
                Dashboard
              </NavLink>
              <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Log in</NavLink>
              <NavLink to="/register" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-50">Get started</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
