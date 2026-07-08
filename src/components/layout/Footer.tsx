import { Link } from 'react-router-dom';
import { Film, MapPin, ShieldCheck, Ticket } from 'lucide-react';

const Footer = () => (
  <footer className="mt-16 border-t border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-neutral-950/80">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 text-lg font-black tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-amber-300 dark:bg-amber-400 dark:text-slate-950">
              <Film size={19} />
            </span>
            CinemaBooking
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 cinema-muted">
            Nền tảng đặt vé phim với lịch chiếu, sơ đồ ghế và quản lý vé trong một luồng rõ ràng.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-neutral-500">Điều hướng</h3>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-700 dark:text-neutral-300">
            <Link to="/" className="inline-flex items-center gap-2 transition hover:text-amber-600 dark:hover:text-amber-300">
              <Ticket size={16} /> Phim đang chiếu
            </Link>
            <Link to="/cinemas" className="inline-flex items-center gap-2 transition hover:text-amber-600 dark:hover:text-amber-300">
              <MapPin size={16} /> Rạp chiếu
            </Link>
            <Link to="/my/bookings" className="inline-flex items-center gap-2 transition hover:text-amber-600 dark:hover:text-amber-300">
              <ShieldCheck size={16} /> Vé của tôi
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
          <p className="text-sm font-black">Hỗ trợ đặt vé</p>
          <p className="mt-2 text-sm text-white/70 dark:text-slate-600">
            Kiểm tra lịch chiếu, chọn ghế và theo dõi trạng thái thanh toán ngay trong tài khoản.
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-white/10 dark:text-neutral-500">
        © {new Date().getFullYear()} CinemaBooking. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
