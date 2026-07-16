import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle, CalendarDays, CheckCircle,
  Clock, CreditCard, Eye, MapPin, ReceiptText, Ticket, XCircle,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import type { BookingResponse } from '../../types/domain.types';
import { formatMoney, formatDateTime } from '../../utils/format';

type BookingStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | string;
type BookingItem = BookingResponse & {
  status: BookingStatus;
  showtime?: { movieTitle?: string; startTime?: string; roomName?: string; cinemaName?: string };
};

const STATUS_CONFIG = {
  SUCCESS:   { label: 'Thành công',     icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-500/10',  text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-500/20', bar: 'bg-emerald-500' },
  PENDING:   { label: 'Chờ thanh toán', icon: Clock,       bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-700 dark:text-amber-300',     ring: 'ring-amber-200 dark:ring-amber-500/20',   bar: 'bg-amber-400' },
  FAILED:    { label: 'Thất bại',       icon: XCircle,     bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-700 dark:text-red-300',         ring: 'ring-red-200 dark:ring-red-500/20',       bar: 'bg-red-500' },
  CANCELLED: { label: 'Đã hủy',         icon: AlertCircle, bg: 'bg-slate-100 dark:bg-white/5',         text: 'text-slate-600 dark:text-neutral-400',   ring: 'ring-slate-200 dark:ring-white/10',       bar: 'bg-slate-400' },
  EXPIRED:   { label: 'Hết hạn',        icon: Clock,       bg: 'bg-slate-100 dark:bg-white/5',         text: 'text-slate-600 dark:text-neutral-400',   ring: 'ring-slate-200 dark:ring-white/10',       bar: 'bg-slate-400' },
};

const getField = (b: BookingItem, key: 'movieTitle' | 'cinemaName' | 'roomName' | 'startTime') =>
  b.showtime?.[key as keyof typeof b.showtime] ?? (b as any)[key] ?? '—';

const MyBookingsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingApi.getMyBookings({ size: 20, sort: 'createdAt,desc' }).then(r => r.data.result),
  });

  const bookings = (data?.content ?? []) as BookingItem[];

  return (
    <>
      <Helmet>
        <title>Vé của tôi — cinemabooking.vn</title>
      </Helmet>

      <div className="page-container-md py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="badge-brand w-fit">
              <ReceiptText size={13} /> Tài khoản
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Vé của tôi
            </h1>
            <p className="mt-2 text-sm cinema-muted">
              Lịch sử đặt vé, trạng thái thanh toán và vé điện tử của bạn.
            </p>
          </div>
          <Link to="/" className="btn-secondary mt-1">
            <Ticket size={16} /> Đặt vé mới
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-36 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="cinema-card p-10 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-400" size={40} />
            <p className="font-black text-slate-950 dark:text-white">Không thể tải lịch sử đặt vé</p>
            <p className="mt-2 text-sm cinema-muted">Vui lòng thử lại sau.</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && bookings.length === 0 && (
          <div className="cinema-card py-16 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-400/10">
              <Ticket size={28} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg font-black text-slate-950 dark:text-white">Bạn chưa có vé nào</p>
            <p className="mt-2 text-sm cinema-muted">Chọn một bộ phim đang chiếu để bắt đầu đặt vé.</p>
            <Link to="/" className="btn-primary mt-6">
              Xem phim đang chiếu
            </Link>
          </div>
        )}

        {/* Booking list */}
        {!isLoading && !isError && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map(booking => {
              const cfg = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.CANCELLED;
              const Icon = cfg.icon;
              const movieTitle = getField(booking, 'movieTitle');
              const cinemaName = getField(booking, 'cinemaName');
              const roomName = getField(booking, 'roomName');
              const startTime = getField(booking, 'startTime');

              return (
                <article
                  key={booking.id}
                  className="cinema-card-hover group overflow-hidden"
                >
                  {/* Status bar */}
                  <div className={`h-1 w-full ${cfg.bar}`} />

                  <div className="p-5 lg:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left: info */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400 dark:text-neutral-600">
                            #{booking.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <h2 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                          {movieTitle}
                        </h2>

                        <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-500 dark:text-neutral-400 sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <MapPin size={15} className="shrink-0 text-amber-500" />
                            <span className="truncate">{cinemaName} · {roomName}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <CalendarDays size={15} className="shrink-0 text-amber-500" />
                            {startTime && startTime !== '—' ? formatDateTime(startTime) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Right: price + actions */}
                      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-white/8 lg:items-end lg:border-0 lg:pt-0">
                        <div className="lg:text-right">
                          <p className="cinema-label">Tổng tiền</p>
                          <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                            {formatMoney(booking.totalPrice)}
                          </p>
                          {booking.discountAmount > 0 && (
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Giảm {formatMoney(booking.discountAmount)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {booking.status === 'PENDING' && (
                            <Link
                              to={`/checkout/${booking.id}`}
                              className="btn-primary !h-9 !px-4 !text-xs"
                            >
                              <CreditCard size={13} /> Thanh toán
                            </Link>
                          )}
                          <Link
                            to={`/my/bookings/${booking.id}`}
                            className="btn-ghost !h-9 !px-4 !text-xs"
                          >
                            <Eye size={13} /> Xem vé
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyBookingsPage;
