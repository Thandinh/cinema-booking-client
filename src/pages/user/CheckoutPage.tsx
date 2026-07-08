import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ArrowLeft, Banknote, CheckCircle2, CreditCard, Loader2, QrCode, ReceiptText, ShieldCheck, Ticket } from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';

type PaymentMethod = 'VNPAY' | 'MOMO' | 'CREDIT_CARD';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; helper: string; icon: typeof CreditCard }[] = [
  { value: 'VNPAY', label: 'VNPay', helper: 'Chuyển sang cổng thanh toán VNPay', icon: Banknote },
  { value: 'MOMO', label: 'MoMo', helper: 'Thanh toán nhanh bằng ví MoMo', icon: QrCode },
  { value: 'CREDIT_CARD', label: 'Thẻ quốc tế', helper: 'Visa, Mastercard hoặc thẻ tín dụng', icon: CreditCard },
];

const formatMoney = (value?: number) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '--';

const CheckoutPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('VNPAY');

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    enabled: !!bookingId,
  });

  const seatsLabel = useMemo(() => {
    const seats = booking?.bookingDetails ?? [];
    if (seats.length === 0) return 'Chưa có thông tin ghế';
    return seats.map(seat => `${seat.rowLabel}${seat.seatNumber}`).join(', ');
  }, [booking]);

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
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải đơn đặt vé
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black">Không tìm thấy đơn đặt vé</p>
        <p className="mt-2 text-sm cinema-muted">Đơn này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link to="/" className="mt-6 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300">
          Về trang phim
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Thanh toán - CinemaBooking</title>
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/my/bookings" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-300">
          <ArrowLeft size={17} />
          Quay lại vé của tôi
        </Link>

        <div className="mb-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            <ShieldCheck size={14} />
            Checkout an toàn
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">Hoàn tất thanh toán</h1>
          <p className="mt-2 text-sm cinema-muted">Kiểm tra thông tin vé và chọn phương thức thanh toán phù hợp.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-5">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-white dark:text-slate-950">
                  <Ticket size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">Phim</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{booking.movieTitle}</h2>
                  <p className="mt-3 text-sm font-semibold cinema-muted">{booking.cinemaName} - {booking.roomName}</p>
                  <p className="mt-1 text-sm font-semibold cinema-muted">{formatDateTime(booking.startTime)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Ghế" value={seatsLabel} />
                <InfoBlock label="Mã booking" value={`#${booking.id.slice(0, 8)}`} />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Phương thức thanh toán</h2>
              <div className="mt-4 grid gap-3">
                {PAYMENT_METHODS.map(item => {
                  const Icon = item.icon;
                  const active = method === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setMethod(item.value)}
                      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-amber-300 bg-amber-50 ring-4 ring-amber-100 dark:border-amber-400/40 dark:bg-amber-400/10 dark:ring-amber-400/10'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-neutral-950 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className={`grid size-11 place-items-center rounded-xl ${active ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-600 dark:bg-neutral-900 dark:text-neutral-300'}`}>
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-black text-slate-950 dark:text-white">{item.label}</span>
                        <span className="mt-1 block text-sm cinema-muted">{item.helper}</span>
                      </span>
                      {active && <CheckCircle2 className="text-amber-600 dark:text-amber-300" size={20} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-white dark:text-slate-950">
                <ReceiptText size={20} />
              </span>
              <div>
                <p className="font-black text-slate-950 dark:text-white">Tóm tắt thanh toán</p>
                <p className="text-xs font-semibold cinema-muted">Booking đang chờ xử lý</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm font-semibold">
              <div className="flex justify-between gap-4 cinema-muted">
                <span>Tạm tính</span>
                <span>{formatMoney(booking.totalPrice + (booking.discountAmount ?? 0))}</span>
              </div>
              <div className="flex justify-between gap-4 cinema-muted">
                <span>Giảm giá</span>
                <span>-{formatMoney(booking.discountAmount)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-slate-950 dark:border-white/10 dark:text-white">
                <span>Tổng thanh toán</span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{formatMoney(booking.totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending || booking.totalPrice <= 0}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
              Thanh toán ngay
            </button>

            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 cinema-muted dark:bg-neutral-950">
              Sau khi thanh toán thành công, vé điện tử sẽ xuất hiện trong mục Vé của tôi.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-neutral-950">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

export default CheckoutPage;
