import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle, CalendarDays, CheckCircle2, Clock, Loader2,
  ReceiptText, Search, Ticket, User, XCircle,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { toast } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import type { BookingResponse } from '../../types/domain.types';
import { formatDateTime, formatMoney } from '../../utils/format';

type BookingStatus = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'SUCCESS', label: 'Đã thanh toán' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'EXPIRED', label: 'Hết hạn' },
];

const STATUS_META = {
  PENDING: { label: 'Chờ thanh toán', icon: Clock, className: 'badge-warning' },
  SUCCESS: { label: 'Đã thanh toán', icon: CheckCircle2, className: 'badge-success' },
  FAILED: { label: 'Thất bại', icon: XCircle, className: 'badge-danger' },
  CANCELLED: { label: 'Đã hủy', icon: AlertCircle, className: 'badge-neutral' },
  EXPIRED: { label: 'Hết hạn', icon: Clock, className: 'badge-neutral' },
};

const normalize = (value?: string) => (value ?? '').toLowerCase().trim();

const seatLabels = (booking: BookingResponse) =>
  booking.bookingDetails
    ?.map((detail) => `${detail.rowLabel}${detail.seatNumber}`)
    .join(', ') || '—';

const checkedInCount = (booking: BookingResponse) =>
  booking.bookingDetails?.filter((detail) => detail.ticketStatus === 'USED').length ?? 0;

const AdminBookingPage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<BookingStatus>('ALL');
  const [keyword, setKeyword] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-bookings', status, page],
    queryFn: () =>
      bookingApi.getAllBookings({
        status: status === 'ALL' ? undefined : status,
        page,
        size: 15,
        sort: 'createdAt,desc',
      }).then((res) => res.data.result),
    placeholderData: (prev) => prev,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingApi.cancelBooking(id),
    onSuccess: () => {
      toast.success('Đã hủy đơn đặt vé');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể hủy đơn đặt vé'),
  });

  const bookings = useMemo(() => {
    const items = (data?.content ?? []) as BookingResponse[];
    const q = normalize(keyword);
    if (!q) return items;

    return items.filter((booking) => {
      const haystack = [
        booking.id,
        booking.customerName,
        booking.customerUsername,
        booking.customerEmail,
        booking.movieTitle,
        booking.cinemaName,
        booking.roomName,
        seatLabels(booking),
      ].map(normalize).join(' ');

      return haystack.includes(q);
    });
  }, [data?.content, keyword]);

  const canCancelAll = hasPermission('BOOKING_CANCEL_ALL');

  return (
    <>
      <Helmet><title>Đơn đặt vé - Admin Portal</title></Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Đơn đặt vé</h1>
            <p className="mt-1 text-sm cinema-muted">
              Theo dõi đơn đặt vé, trạng thái thanh toán, ghế và lượt soát vé.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-72 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-neutral-900">
              <Search size={16} className="text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm mã đơn, khách, phim, ghế..."
                className="h-10 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => { setStatus(option.value); setPage(0); }}
              className={`h-9 shrink-0 rounded-lg px-4 text-xs font-black transition-colors ${
                status === option.value
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="cinema-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-5 py-4">Đơn hàng</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Suất chiếu</th>
                  <th className="px-5 py-4">Ghế / Vé</th>
                  <th className="px-5 py-4">Thanh toán</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 size={24} className="mx-auto animate-spin text-amber-500" />
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <AlertCircle className="mx-auto mb-2 text-red-400" size={34} />
                      <p className="font-black text-red-500">Không thể tải đơn đặt vé</p>
                      <p className="mt-1 text-xs cinema-muted">
                        {(error as any)?.response?.data?.message || 'Vui lòng kiểm tra backend và thử lại.'}
                      </p>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-semibold text-slate-500">
                      <ReceiptText className="mx-auto mb-2 text-slate-300" size={34} />
                      Không có đơn đặt vé phù hợp.
                    </td>
                  </tr>
                ) : bookings.map((booking) => {
                  const meta = STATUS_META[booking.status as keyof typeof STATUS_META] ?? STATUS_META.CANCELLED;
                  const StatusIcon = meta.icon;
                  const totalSeats = booking.bookingDetails?.length ?? 0;
                  const usedTickets = checkedInCount(booking);

                  return (
                    <tr key={booking.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-neutral-400">
                            <ReceiptText size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-black text-slate-950 dark:text-white">
                              #{booking.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs cinema-muted">{formatDateTime(booking.createdAt)}</p>
                            <span className={`mt-2 inline-flex items-center gap-1.5 ${meta.className}`}>
                              <StatusIcon size={12} />
                              {meta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                            <User size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-slate-950 dark:text-white">
                              {booking.customerName || booking.customerUsername || 'Khách hàng'}
                            </p>
                            <p className="mt-0.5 text-xs cinema-muted">@{booking.customerUsername || '—'}</p>
                            {booking.customerEmail && (
                              <p className="mt-0.5 max-w-48 truncate text-xs cinema-muted">{booking.customerEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-64 font-black text-slate-950 dark:text-white">{booking.movieTitle}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-neutral-300">
                          {booking.cinemaName} · {booking.roomName}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs cinema-muted">
                          <CalendarDays size={13} />
                          {formatDateTime(booking.startTime)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950 dark:text-white">
                          {seatLabels(booking)}
                        </p>
                        <p className="mt-1 text-xs cinema-muted">
                          {totalSeats} ghế · {usedTickets}/{totalSeats} vé đã soát
                        </p>
                        <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: totalSeats ? `${(usedTickets / totalSeats) * 100}%` : '0%' }}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                          {formatMoney(booking.totalPrice)}
                        </p>
                        {booking.discountAmount > 0 && (
                          <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Giảm {formatMoney(booking.discountAmount)}
                          </p>
                        )}
                        {booking.promotionCode && (
                          <p className="mt-1 text-xs cinema-muted">Mã: {booking.promotionCode}</p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {booking.status === 'PENDING' && canCancelAll ? (
                          <button
                            disabled={cancelMutation.isPending}
                            onClick={() => {
                              if (window.confirm('Hủy đơn đặt vé đang chờ thanh toán này?')) {
                                cancelMutation.mutate(booking.id);
                              }
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <XCircle size={13} />
                            Hủy đơn
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 dark:text-neutral-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">
                Trang {page + 1} / {data?.totalPages} ({data?.totalElements} đơn)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((value) => value - 1)}
                  className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  disabled={page >= (data?.totalPages ?? 1) - 1}
                  onClick={() => setPage((value) => value + 1)}
                  className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400">
          <Ticket size={15} className="mt-0.5 shrink-0 text-amber-500" />
          Đơn đã thanh toán sẽ sinh vé điện tử cho từng ghế. Nhân viên soát vé tiếp tục dùng màn hình QR để xác thực và cập nhật số vé đã soát.
        </div>
      </div>
    </>
  );
};

export default AdminBookingPage;
