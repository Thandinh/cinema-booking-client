import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Clapperboard, Loader2, MapPin, QrCode, Ticket } from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';

const formatMoney = (value?: number) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '--';

const TicketDetailPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải vé
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black">Không tìm thấy vé</p>
        <p className="mt-2 text-sm cinema-muted">Vé này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link to="/my/bookings" className="mt-6 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300">
          Về Vé của tôi
        </Link>
      </div>
    );
  }

  const seats = booking.bookingDetails ?? [];
  const seatsLabel = seats.length > 0
    ? seats.map(seat => `${seat.rowLabel}${seat.seatNumber}`).join(', ')
    : 'Chưa có thông tin ghế';
  const qrPayload = booking.secureToken || booking.id;

  return (
    <>
      <Helmet>
        <title>{booking.movieTitle} - Vé điện tử</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/my/bookings" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-300">
          <ArrowLeft size={17} />
          Quay lại Vé của tôi
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
            <div className="bg-slate-950 p-6 text-white dark:bg-white dark:text-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300 dark:text-amber-700">CinemaBooking</p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight">{booking.movieTitle}</h1>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-black text-emerald-200 ring-1 ring-emerald-300/20 dark:bg-emerald-100 dark:text-emerald-700 dark:ring-emerald-200">
                  <CheckCircle2 size={14} />
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <TicketInfo icon={MapPin} label="Rạp chiếu" value={`${booking.cinemaName} - ${booking.roomName}`} />
              <TicketInfo icon={CalendarDays} label="Suất chiếu" value={formatDateTime(booking.startTime)} />
              <TicketInfo icon={Ticket} label="Ghế" value={seatsLabel} />
              <TicketInfo icon={Clapperboard} label="Mã booking" value={`#${booking.id.slice(0, 12)}`} />
            </div>

            <div className="border-t border-dashed border-slate-300 p-6 dark:border-white/15">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">Tổng tiền</p>
                  <p className="mt-1 text-3xl font-black text-amber-700 dark:text-amber-300">{formatMoney(booking.totalPrice)}</p>
                </div>
                {booking.status === 'PENDING' && (
                  <Link to={`/checkout/${booking.id}`} className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300">
                    Thanh toán tiếp
                  </Link>
                )}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 lg:sticky lg:top-24">
            <div className="mx-auto grid size-44 place-items-center rounded-3xl bg-slate-50 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
              <QrCode size={112} className="text-slate-950 dark:text-white" />
            </div>
            <p className="mt-5 text-sm font-black text-slate-950 dark:text-white">Mã check-in</p>
            <p className="mt-2 break-all rounded-2xl bg-slate-50 p-3 text-xs font-semibold cinema-muted dark:bg-neutral-950">
              {qrPayload}
            </p>
            <p className="mt-4 text-xs font-semibold leading-5 cinema-muted">
              Xuất trình mã này tại quầy hoặc cổng soát vé. Khi backend có QR image, phần này có thể đổi sang QR thật từ secure token.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
};

const TicketInfo = ({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-neutral-950">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-amber-300 dark:ring-white/10">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">{label}</p>
        <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default TicketDetailPage;
