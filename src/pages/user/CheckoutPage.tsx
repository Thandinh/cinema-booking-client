import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';
import { formatDateTime, formatMoney } from '../../utils/format';

type PaymentMethod = 'VNPAY' | 'MOMO' | 'CREDIT_CARD';

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  helper: string;
  icon: typeof CreditCard;
  enabled: boolean;
}[] = [
  { value: 'VNPAY', label: 'VNPay', helper: 'Chuyển sang cổng thanh toán VNPay', icon: Banknote, enabled: true },
  { value: 'MOMO', label: 'Ví MoMo', helper: 'Sắp hỗ trợ', icon: QrCode, enabled: false },
  { value: 'CREDIT_CARD', label: 'Thẻ quốc tế', helper: 'Sắp hỗ trợ', icon: CreditCard, enabled: false },
];

const CheckoutPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('VNPAY');

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    enabled: Boolean(bookingId),
  });

  const seatsLabel = useMemo(() => {
    const seats = booking?.bookingDetails ?? [];
    if (seats.length === 0) return 'Chưa có thông tin ghế';
    return seats.map(seat => `${seat.rowLabel}${seat.seatNumber}`).join(', ');
  }, [booking]);

  const canPay = Boolean(booking && booking.status === 'PENDING' && booking.totalPrice > 0);

  const paymentMutation = useMutation({
    mutationFn: () => paymentApi.initiatePayment(bookingId!, method, booking?.totalPrice ?? 0),
    onSuccess: response => {
      const paymentUrl = response.data.result;
      if (paymentUrl && /^https?:\/\//i.test(paymentUrl)) {
        window.location.assign(paymentUrl);
        return;
      }
      navigate(`/payment/result?bookingId=${bookingId}&status=PENDING`, { replace: true });
    },
    onError: () => {
      navigate(`/payment/result?bookingId=${bookingId}&status=FAILED`, { replace: true });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải đơn đặt vé...
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="page-container py-24 text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-lg bg-slate-100 dark:bg-neutral-800">
          <AlertCircle size={28} className="text-slate-400" />
        </div>
        <p className="text-lg font-black dark:text-white">Không tìm thấy đơn đặt vé</p>
        <p className="mt-2 text-sm cinema-muted">Đơn này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link to="/" className="btn-secondary mt-6">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Thanh toán - CinemaBooking</title>
      </Helmet>

      <div className="page-container-md py-8">
        <Link
          to="/my/bookings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400"
        >
          <ArrowLeft size={16} /> Vé của tôi
        </Link>

        <div className="mb-8">
          <div className="badge-brand w-fit">
            <ShieldCheck size={14} /> Thanh toán bảo mật
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Hoàn tất thanh toán
          </h1>
          <p className="mt-2 text-sm cinema-muted">
            Kiểm tra thông tin vé trước khi chuyển sang cổng thanh toán.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Ticket size={22} />
                </span>
                <div className="min-w-0">
                  <p className="cinema-label">Phim chiếu rạp</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    {booking.movieTitle}
                  </h2>
                  <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-neutral-300">
                    {booking.cinemaName} - <span className="text-amber-600 dark:text-amber-400">{booking.roomName}</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold cinema-muted">{formatDateTime(booking.startTime)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Ghế đã chọn" value={seatsLabel} />
                <InfoBlock label="Mã booking" value={`#${booking.id.slice(0, 8).toUpperCase()}`} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900 sm:p-6">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Phương thức thanh toán</h2>
              <div className="mt-4 grid gap-3">
                {PAYMENT_METHODS.map(item => {
                  const Icon = item.icon;
                  const active = method === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => item.enabled && setMethod(item.value)}
                      disabled={!item.enabled}
                      className={`group flex items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                        active
                          ? 'border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10'
                          : item.enabled
                            ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-neutral-950 dark:hover:bg-white/5'
                            : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-white/10 dark:bg-neutral-950'
                      }`}
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-lg transition-colors ${
                        active
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white text-slate-500 dark:bg-neutral-900 dark:text-neutral-400'
                      }`}>
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-black text-slate-950 dark:text-white">{item.label}</span>
                        <span className="mt-1 block text-[13px] font-medium cinema-muted">{item.helper}</span>
                      </span>
                      {active && <CheckCircle2 className="shrink-0 text-amber-600 dark:text-amber-400" size={20} />}
                      {!item.enabled && (
                        <span className="shrink-0 rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-black text-slate-600 dark:bg-white/10 dark:text-neutral-300">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900 lg:sticky lg:top-24 lg:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <ReceiptText size={18} />
              </span>
              <div>
                <p className="font-black text-slate-950 dark:text-white">Tóm tắt thanh toán</p>
                <p className="text-[11px] font-semibold cinema-muted">Trạng thái: {booking.status}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm font-semibold">
              <div className="flex items-center justify-between gap-4 cinema-muted">
                <span>Tạm tính</span>
                <span>{formatMoney(booking.totalPrice + (booking.discountAmount ?? 0))}</span>
              </div>
              {(booking.discountAmount ?? 0) > 0 && (
                <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                  <span>Giảm giá</span>
                  <span>-{formatMoney(booking.discountAmount)}</span>
                </div>
              )}
              <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-white/8">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">Tổng thanh toán</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {formatMoney(booking.totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending || !canPay}
              className="btn-primary mt-6 w-full"
            >
              {paymentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {booking.status === 'SUCCESS' ? 'Đã thanh toán' : 'Thanh toán VNPay'}
            </button>

            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-center text-[11px] font-semibold leading-relaxed cinema-muted dark:bg-neutral-950">
              Ghế chỉ được xác nhận sau khi cổng thanh toán trả về thành công.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-50 p-4 dark:bg-neutral-950">
    <p className="cinema-label">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

export default CheckoutPage;
