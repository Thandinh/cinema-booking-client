import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, CalendarDays, CheckCircle, Clock, CreditCard, Eye, MapPin, ReceiptText, Ticket, XCircle } from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import type { BookingResponse } from '../../types/domain.types';

type BookingStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | string;

type BookingListItem = BookingResponse & {
  status: BookingStatus;
  showtime?: {
    movieTitle?: string;
    startTime?: string;
    roomName?: string;
    cinemaName?: string;
  };
};

const STATUS_CONFIG = {
  SUCCESS: { label: 'Thành công', color: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle, bg: 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/20' },
  PENDING: { label: 'Chờ thanh toán', color: 'text-amber-700 dark:text-amber-300', icon: Clock, bg: 'bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/20' },
  FAILED: { label: 'Thất bại', color: 'text-red-700 dark:text-red-300', icon: XCircle, bg: 'bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/20' },
  CANCELLED: { label: 'Đã hủy', color: 'text-slate-600 dark:text-neutral-300', icon: AlertCircle, bg: 'bg-slate-100 ring-slate-200 dark:bg-white/5 dark:ring-white/10' },
};

const formatMoney = (value?: number) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;

const getMovieTitle = (booking: BookingListItem) => booking.showtime?.movieTitle ?? booking.movieTitle ?? 'Phim';
const getCinemaName = (booking: BookingListItem) => booking.showtime?.cinemaName ?? booking.cinemaName ?? 'Rạp chiếu';
const getRoomName = (booking: BookingListItem) => booking.showtime?.roomName ?? booking.roomName ?? 'Phòng';
const getStartTime = (booking: BookingListItem) => booking.showtime?.startTime ?? booking.startTime;

const MyBookingsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingApi.getMyBookings({ size: 20, sort: 'createdAt,desc' }).then(response => response.data.result),
  });

  const bookings = (data?.content ?? []) as BookingListItem[];

  return (
    <>
      <Helmet>
        <title>Vé của tôi - CinemaBooking</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <ReceiptText size={14} />
              Tài khoản
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">Vé của tôi</h1>
            <p className="mt-2 text-sm cinema-muted">Theo dõi booking, trạng thái thanh toán và mở vé điện tử khi cần check-in.</p>
          </div>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-100"
          >
            <Ticket size={17} />
            Đặt vé mới
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(item => <div key={item} className="h-40 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10" />)}
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <p className="font-black">Không thể tải lịch sử đặt vé</p>
            <p className="mt-2 text-sm">Vui lòng thử lại sau.</p>
          </div>
        )}

        {!isLoading && !isError && bookings.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
            <Ticket className="mx-auto text-slate-400" size={48} />
            <p className="mt-4 text-lg font-black text-slate-950 dark:text-white">Bạn chưa có vé nào</p>
            <p className="mt-2 text-sm cinema-muted">Chọn một bộ phim đang chiếu để bắt đầu đặt vé.</p>
            <Link to="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300">
              Xem phim đang chiếu
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map(booking => {
            const cfg = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.CANCELLED;
            const Icon = cfg.icon;
            const startTime = getStartTime(booking) ? new Date(getStartTime(booking)).toLocaleString('vi-VN') : 'Chưa có thời gian';

            return (
              <article key={booking.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-lg dark:bg-neutral-900 dark:ring-white/10">
                <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${cfg.bg} ${cfg.color}`}>
                        <Icon size={13} />
                        {cfg.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400">#{booking.id.slice(0, 8)}</span>
                    </div>

                    <h2 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                      {getMovieTitle(booking)}
                    </h2>

                    <div className="mt-4 grid gap-2 text-sm font-semibold cinema-muted sm:grid-cols-2">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={16} className="text-amber-500" />
                        {getCinemaName(booking)} - {getRoomName(booking)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={16} className="text-amber-500" />
                        {startTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-t border-slate-200 pt-4 dark:border-white/10 lg:items-end lg:border-t-0 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">Tổng tiền</p>
                      <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{formatMoney(booking.totalPrice)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {booking.status === 'PENDING' && (
                        <Link
                          to={`/checkout/${booking.id}`}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-xs font-black text-slate-950 transition hover:bg-amber-300"
                        >
                          <CreditCard size={14} />
                          Thanh toán
                        </Link>
                      )}
                      <Link
                        to={`/my/bookings/${booking.id}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
                      >
                        <Eye size={14} />
                        Xem vé
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MyBookingsPage;
