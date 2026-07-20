import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Ticket,
  XCircle,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';
import { toast } from '../../components/ui/Toast';
import { formatDateTime, formatMoney } from '../../utils/format';

type PaymentMethod = 'VNPAY' | 'MOMO' | 'CREDIT_CARD';

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  helper: string;
  enabled: boolean;
}[] = [
  { value: 'VNPAY', label: 'VNPay', helper: 'Chuyển sang cổng thanh toán VNPay', enabled: true },
  { value: 'MOMO', label: 'Ví MoMo', helper: 'Sắp hỗ trợ', enabled: false },
  { value: 'CREDIT_CARD', label: 'Thẻ quốc tế', helper: 'Sắp hỗ trợ', enabled: false },
];

const CheckoutPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('VNPAY');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

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

  useEffect(() => {
    if (!booking?.paymentExpiresAt || booking.status !== 'PENDING') {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(booking.paymentExpiresAt!).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [booking?.paymentExpiresAt, booking?.status]);

  useEffect(() => {
    if (booking?.status === 'PENDING' && remainingSeconds === 0) {
      toast.error('Đã hết thời gian giữ vé. Vui lòng chọn ghế lại.');
      navigate(`/seat-selection/${booking.showtimeId}`, { replace: true });
    }
  }, [booking?.showtimeId, booking?.status, navigate, remainingSeconds]);

  const paymentExpired = booking?.status === 'EXPIRED' || remainingSeconds === 0;
  const canPay = Boolean(booking && booking.status === 'PENDING' && booking.totalPrice > 0 && !paymentExpired);

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
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancelBooking(bookingId!),
    onSuccess: () => {
      toast.success('Đã hủy đơn giữ ghế');
      navigate(`/seat-selection/${booking?.showtimeId}`, { replace: true });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể hủy đơn giữ ghế');
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
        <title>Thanh toán - cinemabooking.vn</title>
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
                          ? 'bg-white text-slate-950 ring-1 ring-amber-200 dark:bg-white'
                          : 'bg-white text-slate-500 dark:bg-neutral-900 dark:text-neutral-400'
                      }`}>
                        <PaymentMethodLogo method={item.value} />
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

            {booking.status === 'PENDING' && remainingSeconds !== null && (
              <div className={`mt-5 rounded-lg p-3 text-center ring-1 ${
                remainingSeconds <= 60
                  ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
                  : 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20'
              }`}>
                <p className="text-[11px] font-black uppercase tracking-[0.14em]">Thời gian giữ vé</p>
                <p className="mt-1 text-2xl font-black tabular-nums">{formatCountdown(remainingSeconds)}</p>
              </div>
            )}

            {booking.status === 'EXPIRED' && (
              <div className="mt-5 rounded-lg bg-red-50 p-3 text-center text-sm font-bold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                Đơn giữ ghế đã hết hạn. Vui lòng chọn ghế lại.
              </div>
            )}

            <button
              type="button"
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending || !canPay}
              className="btn-primary mt-6 w-full"
            >
              {paymentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {booking.status === 'SUCCESS' ? 'Đã thanh toán' : `Thanh toán ${method === 'MOMO' ? 'MoMo' : 'VNPay'}`}
            </button>

            {booking.status === 'PENDING' && (
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="btn-ghost mt-2 w-full text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:border-red-500/20 dark:hover:bg-red-500/10"
              >
                {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Hủy và chọn lại ghế
              </button>
            )}

            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-center text-[11px] font-semibold leading-relaxed cinema-muted dark:bg-neutral-950">
              Ghế chỉ được xác nhận sau khi cổng thanh toán trả về thành công.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
};

const formatCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const PaymentMethodLogo = ({ method }: { method: PaymentMethod }) => {
  if (method === 'VNPAY') {
    return (
      <span className="inline-flex h-7 w-9 items-center justify-center rounded-md bg-white text-[10px] font-black leading-none shadow-sm ring-1 ring-slate-200">
        <span className="text-[#005baa]">VN</span>
        <span className="text-[#e31e24]">Pay</span>
      </span>
    );
  }

  if (method === 'MOMO') {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#a50064] text-[8px] font-black leading-none text-white shadow-sm">
        MoMo
      </span>
    );
  }

  return <CreditCard size={20} />;
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-50 p-4 dark:bg-neutral-950">
    <p className="cinema-label">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

export default CheckoutPage;
