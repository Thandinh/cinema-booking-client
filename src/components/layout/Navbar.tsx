import type { ElementType } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Film,
  LogOut,
  MapPin,
  Menu,
  Moon,
  ScanLine,
  Sun,
  Ticket,
  X,
} from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';

const navItems = [
  { to: '/', label: 'Phim', icon: Film },
  { to: '/cinemas', label: 'Rạp chiếu', icon: MapPin },
];

const Navbar = () => {
  const { user, token, logout, hasPermission } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (token) await authApi.logout(token);
    } finally {
      logout();
    }
  };

  const isAdmin = hasPermission('DASHBOARD_VIEW');
  const isStaff = hasPermission('TICKET_CHECKIN');
  const initials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() ?? 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <Film size={17} strokeWidth={2.4} />
            </span>
            <span className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
              Cinema Booking
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(item => <NavItem key={item.to} {...item} />)}
            {user && <NavItem to="/my/bookings" label="Vé của tôi" icon={Ticket} />}
            {isStaff && <NavItem to="/staff/scanner" label="Soát vé" icon={ScanLine} />}
            {isAdmin && <NavItem to="/admin/dashboard" label="Tổng quan" icon={BarChart3} />}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="grid size-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Đổi giao diện"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-white/5"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-900 text-[11px] font-black text-white dark:bg-white dark:text-slate-950">
                      {initials}
                    </span>
                    <span className="max-w-24 truncate">{user.firstName || user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <LogOut size={15} />
                    <span className="hidden lg:inline">Thoát</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
                  >
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn-primary !h-9 !px-4">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(open => !open)}
              className="grid size-9 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10 md:hidden"
              aria-label="Mở menu"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-neutral-950 md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
            {navItems.map(item => (
              <MobileNavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
            ))}
            {user && <MobileNavItem to="/my/bookings" label="Vé của tôi" icon={Ticket} onClick={() => setMobileOpen(false)} />}
            {isStaff && <MobileNavItem to="/staff/scanner" label="Soát vé" icon={ScanLine} onClick={() => setMobileOpen(false)} />}
            {isAdmin && <MobileNavItem to="/admin/dashboard" label="Tổng quan" icon={BarChart3} onClick={() => setMobileOpen(false)} />}

            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-white/8">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-neutral-300"
                  >
                    <span className="grid size-6 place-items-center rounded-md bg-slate-900 text-[11px] font-black text-white dark:bg-white dark:text-slate-950">
                      {initials}
                    </span>
                    Hồ sơ
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  >
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-700 dark:border-white/10 dark:text-neutral-300"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg bg-slate-950 py-2.5 text-center text-sm font-black text-white dark:bg-white dark:text-slate-950"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: ElementType }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
        active
          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  );
};

const MobileNavItem = ({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: ElementType;
  onClick: () => void;
}) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
        active
          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
          : 'text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-white/5'
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
};

export default Navbar;
