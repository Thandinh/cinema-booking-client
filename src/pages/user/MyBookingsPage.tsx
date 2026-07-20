import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle, CalendarDays, CheckCircle,
  Clock, CreditCard, Eye, MapPin, ReceiptText, RotateCcw, Ticket, XCircle,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import type { BookingResponse } from '../../types/domain.types';
import { formatMoney, formatDateTime } from '../../utils/format';

type BookingStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | string;
type BookingTab = 'VALID_TICKETS' | 'ALL_ORDERS';
type BookingItem = BookingResponse & {
  status: BookingStatus;
  showtime?: { movieTitle?: string; startTime?: string; roomName?: string; cinemaName?: string };
};

const TABS: Array<{ id: BookingTab; label: string; description: string; status?: 'SUCCESS' }> = [
  {
    id: 'VALID_TICKETS',
    label: 'Vé hợp lệ',
    description: 'Các vé đã thanh toán, sẵn sàng dùng QR để vào rạp.',
    status: 'SUCCESS',
  },
  {
    id: 'ALL_ORDERS',
    label: 'Đơn đã đặt',
    description: 'Theo dõi đơn chờ thanh toán, thất bại, hết hạn hoặc đã hủy.',
  },
];

const STATUS_CONFIG = {
  SUCCESS:   { label: 'Đã thanh toán',  icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-500/10',  text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-500/20', bar: 'bg-emerald-500' },
  PENDING:   { label: 'Chờ thanh toán', icon: Clock,       bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-700 dark:text-amber-300',     ring: 'ring-amber-200 dark:ring-amber-500/20',   bar: 'bg-amber-400' },
  FAILED:    { label: 'Thất bại',       icon: XCircle,     bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-700 dark:text-red-300',         ring: 'ring-red-200 dark:ring-red-500/20',       bar: 'bg-red-500' },
  CANCELLED: { label: 'Đã hủy',         icon: AlertCircle, bg: 'bg-slate-100 dark:bg-white/5',         text: 'text-slate-600 dark:text-neutral-400',   ring: 'ring-slate-200 dark:ring-white/10',       bar: 'bg-slate-400' },
  EXPIRED:   { label: 'Hết hạn',        icon: Clock,       bg: 'bg-slate-100 dark:bg-white/5',         text: 'text-slate-600 dark:text-neutral-400',   ring: 'ring-slate-200 dark:ring-white/10',       bar: 'bg-slate-400' },
};

const getField = (b: BookingItem, key: 'movieTitle' | 'cinemaName' | 'roomName' | 'startTime') =>
  b.showtime?.[key as keyof typeof b.showtime] ?? (b as any)[key] ?? '—';

const getSeatLabels = (booking: BookingItem) =>
  booking.bookingDetails?.length
    ? booking.bookingDetails.map(detail => `${detail.rowLabel}${detail.seatNumber}`).join(', ')
    : '—';

const getCheckedInLabel = (booking: BookingItem) => {
  const details = booking.bookingDetails ?? [];
  if (booking.status !== 'SUCCESS' || details.length === 0) return '';
  const used = details.filter(detail => detail.ticketStatus === 'USED').length;
  return ` · ${used}/${details.length} vé đã soát`;
};

const isFutureShowtime = (startTime?: string) => {
  if (!startTime) return false;
  const value = new Date(startTime).getTime();
  return Number.isFinite(value) && value > Date.now();
};

const getPaymentRemainingSeconds = (booking: BookingItem, nowMs: number) => {
  if (booking.status !== 'PENDING' || !booking.paymentExpiresAt) return null;
  const expiresAt = new Date(booking.paymentExpiresAt).getTime();
  if (!Number.isFinite(expiresAt)) return null;
  return Math.max(0, Math.floor((expiresAt - nowMs) / 1000));
};

const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState<BookingTab>('VALID_TICKETS');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const selectedTab = useMemo(() => TABS.find(tab => tab.id === activeTab) ?? TABS[0], [activeTab]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings', selectedTab.status ?? 'ALL'],
    queryFn: () => bookingApi.getMyBookings({
      status: selectedTab.status,
      size: 20,
      sort: 'createdAt,desc',
    }).then(r => r.data.result),
  });

  const bookings = useMemo(() => (data?.content ?? []) as BookingItem[], [data?.content]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const pendingExpiries = bookings
      .filter(booking => booking.status === 'PENDING' && booking.paymentExpiresAt)
      .map(booking => new Date(booking.paymentExpiresAt!).getTime())
      .filter(Number.isFinite);

    if (pendingExpiries.length === 0) return;

    const nextExpiry = Math.min(...pendingExpiries);
    const delay = Math.max(0, nextExpiry - Date.now()) + 500;
    const timer = window.setTimeout(() => void refetch(), delay);
    return () => window.clearTimeout(timer);
  }, [bookings, refetch]);

  return (
    <>
      <Helmet>
        <title>Vé của tôi — cinemabooking.vn</title>
      </Helmet>

      <div className="page-container-md py-6">
        {/* Page header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="badge-brand w-fit">
              <ReceiptText size={13} /> Tài khoản
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
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

        <div className="mb-5 grid gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-white/5 sm:grid-cols-2">
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10'
                    : 'hover:bg-white/60 dark:hover:bg-white/5'
                }`}
              >
                <span className={`block text-sm font-black ${isActive ? 'text-slate-950 dark:text-white' : 'cinema-muted'}`}>
                  {tab.label}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-5 cinema-muted">
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
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
            <p className="text-lg font-black text-slate-950 dark:text-white">
              {activeTab === 'VALID_TICKETS' ? 'Bạn chưa có vé hợp lệ' : 'Bạn chưa có đơn đặt vé nào'}
            </p>
            <p className="mt-2 text-sm cinema-muted">Chọn một bộ phim đang chiếu để bắt đầu đặt vé.</p>
            <Link to="/" className="btn-primary mt-6">
              Xem phim đang chiếu
            </Link>
          </div>
        )}

        {/* Booking list */}
        {!isLoading && !isError && bookings.length > 0 && (
          <div className="space-y-3">
            {bookings.map(booking => {
              const cfg = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.CANCELLED;
              const Icon = cfg.icon;
              const movieTitle = getField(booking, 'movieTitle');
              const cinemaName = getField(booking, 'cinemaName');
              const roomName = getField(booking, 'roomName');
              const startTime = getField(booking, 'startTime');
              const canViewTicket = booking.status === 'SUCCESS';
              const remainingSeconds = getPaymentRemainingSeconds(booking, nowMs);
              const pendingExpired = booking.status === 'PENDING' && remainingSeconds === 0;
              const canPay = booking.status === 'PENDING' && !pendingExpired;
              const isRetryableStatus = ['FAILED', 'EXPIRED', 'CANCELLED'].includes(booking.status);
              const canRetry = (isRetryableStatus || pendingExpired) && isFutureShowtime(booking.startTime);
              const showtimePassed = (isRetryableStatus || pendingExpired) && !canRetry;

              return (
                <article
                  key={booking.id}
                  className="cinema-card-hover group overflow-hidden"
                >
                  {/* Status bar */}
                  <div className={`h-1 w-full ${cfg.bar}`} />

                  <div className="p-4 lg:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left: info */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400 dark:text-neutral-600">
                            #{booking.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <h2 className="line-clamp-1 text-base font-black tracking-tight text-slate-950 sm:text-lg dark:text-white">
                          {movieTitle}
                        </h2>

                        <div className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <MapPin size={15} className="shrink-0 text-amber-500" />
                            <span className="truncate">{cinemaName} · {roomName}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <CalendarDays size={15} className="shrink-0 text-amber-500" />
                            {startTime && startTime !== '—' ? formatDateTime(startTime) : '—'}
                          </span>
                          <span className="flex items-center gap-2 sm:col-span-2">
                            <Ticket size={15} className="shrink-0 text-amber-500" />
                            <span className="truncate">
                              Ghế {getSeatLabels(booking)}{getCheckedInLabel(booking)}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Right: price + actions */}
                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-white/8 lg:min-w-48 lg:items-end lg:border-0 lg:pt-0">
                        <div className="lg:text-right">
                          <p className="cinema-label">Tổng tiền</p>
                          <p className="mt-0.5 text-xl font-black text-amber-600 dark:text-amber-400">
                            {formatMoney(booking.totalPrice)}
                          </p>
                          {booking.discountAmount > 0 && (
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Giảm {formatMoney(booking.discountAmount)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {canPay && (
                            <Link
                              to={`/checkout/${booking.id}`}
                              className="btn-primary !h-9 !px-4 !text-xs"
                            >
                              <CreditCard size={13} /> Thanh toán
                            </Link>
                          )}
                          {canRetry && (
                            <Link
                              to={`/seat-selection/${booking.showtimeId}`}
                              className="btn-secondary !h-9 !px-4 !text-xs"
                            >
                              <RotateCcw size={13} /> Chọn lại ghế
                            </Link>
                          )}
                          {showtimePassed && (
                            <span className="inline-flex h-9 items-center rounded-lg bg-slate-100 px-4 text-xs font-black text-slate-500 dark:bg-white/5 dark:text-neutral-400">
                              Suất chiếu đã qua
                            </span>
                          )}
                          <Link
                            to={`/my/bookings/${booking.id}`}
                            className={`${canViewTicket ? 'btn-ghost' : 'btn-secondary'} !h-9 !px-4 !text-xs`}
                          >
                            <Eye size={13} /> {canViewTicket ? 'Xem vé' : 'Chi tiết'}
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
