import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Building2, Calendar, CreditCard, DoorOpen, Film, Gift, LogOut, Moon, QrCode, ReceiptText, ShieldCheck, Sun, Users,
} from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuthStore, type UserInfo } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';
import BrandLogo from '../BrandLogo';

// ─── Nav items visible to Admin ──────────────────────────
const adminNavItems = [
  { to: '/admin/dashboard', label: 'Tổng quan',      icon: BarChart3,  permission: 'DASHBOARD_VIEW' },
  { to: '/admin/movies',    label: 'Phim chiếu rạp', icon: Film,       permission: 'MOVIE_CREATE' },
  { to: '/admin/cinemas',   label: 'Rạp chiếu',      icon: Building2,  permission: 'CINEMA_CREATE' },
  { to: '/admin/rooms',     label: 'Phòng & ghế',    icon: DoorOpen,   permission: 'ROOM_CREATE' },
  { to: '/admin/showtimes', label: 'Suất chiếu',     icon: Calendar,   permission: 'SHOWTIME_CREATE' },
  { to: '/admin/bookings',  label: 'Đơn đặt vé',     icon: ReceiptText, permission: 'BOOKING_VIEW_ALL' },
  { to: '/admin/payments',  label: 'Thanh toán',     icon: CreditCard, permission: 'PAYMENT_VIEW_ALL' },
  { to: '/admin/users',     label: 'Người dùng',     icon: Users,      permission: 'USER_VIEW' },
  { to: '/admin/promotions', label: 'Khuyến mãi',    icon: Gift,       permission: 'PROMOTION_CREATE' },
  { to: '/admin/audit-logs', label: 'Nhật ký',       icon: ShieldCheck, permission: 'AUDIT_VIEW' },
];

/**
 * AdminLayout — dùng cho /admin/* và /staff/*
 * Sidebar trên desktop, top-bar trên mobile.
 */
const AdminLayout = () => {
  const { user, token, refreshToken, logout, hasPermission } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try { if (token || refreshToken) await authApi.logout(token, refreshToken); } catch { /**/ }
    finally { logout(); }
  };

  const role = hasPermission('DASHBOARD_VIEW') ? 'Admin' : 'Staff';

  // Only show nav items user has permission for
  const visibleNavItems = adminNavItems.filter(item => hasPermission(item.permission));

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-neutral-950">
      {/* ── Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/8 dark:bg-neutral-900 lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-white/8">
          <div>
            <BrandLogo className="text-base leading-none" />
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-none mt-0.5 uppercase tracking-wider">
              {role} Portal
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          <p className="mb-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-neutral-600">
            Quản trị
          </p>
          {visibleNavItems.map(item => (
            <SidebarLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}

          {hasPermission('TICKET_CHECKIN') && (
            <>
              <p className="mb-1 mt-4 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-neutral-600">
                Nhân viên
              </p>
              <SidebarLink to="/staff/scanner" label="Soát vé QR" icon={QrCode} />
            </>
          )}

          <div className="!mt-4 border-t border-slate-100 pt-3 dark:border-white/8">
            <p className="mb-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-neutral-600">
              Điều hướng
            </p>
            <SidebarLink to="/" label="Trang khách hàng" icon={Film} />
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-3 dark:border-white/8">
          <div className="flex items-center gap-3 rounded-xl p-2.5">
            {user && <UserAvatar user={user} className="size-9 rounded-xl text-sm" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {user?.firstName || user?.username}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-neutral-500">{role}</p>
            </div>
          </div>
          <div className="mt-1 flex gap-1">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-neutral-500 dark:hover:bg-white/5 transition-all"
            >
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
            >
              <LogOut size={13} /> Thoát
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/8 dark:bg-neutral-900 lg:hidden">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="text-base" compact />
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">{role}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10">
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            {user && (
              <Link to="/profile">
                <UserAvatar user={user} className="size-8 rounded-lg text-xs" />
              </Link>
            )}
            <button onClick={handleLogout} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* ── Sub-component ── */
const UserAvatar = ({ user, className }: { user: UserInfo; className: string }) => {
  const initials = user.firstName
    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : user.username.substring(0, 2).toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.username}
        referrerPolicy="no-referrer"
        className={`${className} shrink-0 object-cover shadow-sm ring-1 ring-slate-200 dark:ring-white/10`}
      />
    );
  }

  return (
    <span className={`grid shrink-0 place-items-center bg-gradient-to-br from-amber-400 to-orange-400 font-black text-slate-950 ${className}`}>
      {initials}
    </span>
  );
};

const SidebarLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Film }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
        active
          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-white/8 dark:hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
};

export default AdminLayout;
