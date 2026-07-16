import { Link } from 'react-router-dom';
import { Film, MapPin, Ticket } from 'lucide-react';
import BrandLogo from '../BrandLogo';

const Footer = () => (
  <footer className="mt-16 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-neutral-950">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2">
            <BrandLogo className="text-lg" />
          </Link>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-neutral-400">
            Đặt vé xem phim, chọn ghế và quản lý vé điện tử trong tài khoản.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
              Khám phá
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { to: '/', label: 'Phim đang chiếu', icon: Film },
                { to: '/cinemas', label: 'Rạp chiếu', icon: MapPin },
                { to: '/my/bookings', label: 'Vé của tôi', icon: Ticket },
              ].map(item => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
              Tài khoản
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { to: '/login', label: 'Đăng nhập' },
                { to: '/register', label: 'Đăng ký' },
                { to: '/profile', label: 'Hồ sơ cá nhân' },
              ].map(item => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-5 dark:border-white/10">
        <p className="text-xs font-medium text-slate-400 dark:text-neutral-600">
          © {new Date().getFullYear()} cinemabooking.vn.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
