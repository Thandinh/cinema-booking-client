import type { ElementType } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, LogOut, MapPin, Menu, Moon, Sun, Ticket, User, X } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';

const navItems = [
  { to: '/', label: 'Phim', icon: Film },
  { to: '/cinemas', label: 'Rạp chiếu', icon: MapPin },
];

const Navbar = () => {
  const { user, token, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (token) await authApi.logout(token);
    } catch {
      // Logout locally even when the backend session endpoint is unavailable.
    } finally {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-neutral-950/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-amber-300 shadow-sm dark:bg-amber-400 dark:text-slate-950">
              <Film size={21} />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight text-slate-950 dark:text-white">CinemaBooking</span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300 sm:block">Premium seats</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-full bg-slate-100 p-1 dark:bg-neutral-900 md:flex">
            {navItems.map(item => <NavLink key={item.to} {...item} />)}
            {user && <NavLink to="/my/bookings" label="Vé của tôi" icon={Ticket} />}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="grid size-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
              title={theme === 'light' ? 'Bật giao diện tối' : 'Bật giao diện sáng'}
              aria-label="Đổi giao diện"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200">
                    <User size={16} className="text-amber-500" />
                    <span className="max-w-28 truncate">{user.firstName || user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-100"
                  >
                    <LogOut size={16} />
                    Thoát
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-300">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(open => !open)}
              className="grid size-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-white/10 md:hidden"
              aria-label="Mở menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 py-3 dark:border-white/10 md:hidden">
            <div className="grid gap-2">
              {navItems.map(item => <MobileLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />)}
              {user && <MobileLink to="/my/bookings" label="Vé của tôi" icon={Ticket} onClick={() => setMobileOpen(false)} />}
              <div className="mt-2 flex gap-2">
                {user ? (
                  <button onClick={handleLogout} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    <LogOut size={16} /> Đăng xuất
                  </button>
                ) : (
                  <>
                    <Link onClick={() => setMobileOpen(false)} to="/login" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold dark:border-white/10">Đăng nhập</Link>
                    <Link onClick={() => setMobileOpen(false)} to="/register" className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-black text-slate-950">Đăng ký</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const NavLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: ElementType }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? 'bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white'
          : 'text-slate-600 hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
};

const MobileLink = ({ to, label, icon: Icon, onClick }: { to: string; label: string; icon: ElementType; onClick: () => void }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
        active
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300'
          : 'text-slate-700 dark:text-neutral-200'
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
};

export default Navbar;
