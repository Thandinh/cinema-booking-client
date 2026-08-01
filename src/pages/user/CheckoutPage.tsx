import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Percent,
  QrCode,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Ticket,
  XCircle,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import { paymentApi } from '../../api/paymentApi';
import { toast } from '../../components/ui/toastBus';
import { formatDateTime, formatMoney } from '../../utils/format';

type PaymentMethod = 'VNPAY' | 'MOMO' | 'SEPAY' | 'CREDIT_CARD';

type SePayQrPayload = {
  qrUrl: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: string;
  transferCode: string;
  transferContent: string;
  expiresAt?: string;
};

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  helper: string;
  enabled: boolean;
}[] = [
  { value: 'SEPAY', label: 'Quét QR ngân hàng', helper: 'Thanh toán nhanh bằng ứng dụng ngân hàng hoặc ví điện tử', enabled: true },
  { value: 'VNPAY', label: 'VNPay', helper: 'Thanh toán qua thẻ ATM, ngân hàng hoặc ví VNPay', enabled: true },
  { value: 'MOMO', label: 'Ví MoMo', helper: 'Sắp hỗ trợ', enabled: false },
  { value: 'CREDIT_CARD', label: 'Thẻ quốc tế', helper: 'Sắp hỗ trợ', enabled: false },
];

const CheckoutPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>('SEPAY');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [promotionCode, setPromotionCode] = useState('');
  const [sePayQr, setSePayQr] = useState<SePayQrPayload | null>(null);
  const paymentSummaryRef = useRef<HTMLElement | null>(null);

  const scrollPaymentSummaryToCenter = () => {
    window.requestAnimationFrame(() => {
      paymentSummaryRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    enabled: Boolean(bookingId),
    refetchInterval: query => {
      const currentBooking = query.state.data;
      return sePayQr && currentBooking?.status === 'PENDING' ? 3000 : false;
    },
    refetchIntervalInBackground: true,
  });

  const seatsLabel = useMemo(() => {
    const seats = booking?.bookingDetails ?? [];
    if (seats.length === 0) return 'Chưa có thông tin ghế';
    return seats.map(seat => `${seat.rowLabel}${seat.seatNumber}`).join(', ');
  }, [booking]);
  const bookingStatus = booking?.status;
  const bookingTotalPrice = booking?.totalPrice;
  const sePayAmount = sePayQr?.amount;

  useEffect(() => {
    setPromotionCode(booking?.promotionCode ?? '');
  }, [booking?.promotionCode]);

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

  useEffect(() => {
    if (!sePayQr || !bookingId || booking?.status !== 'SUCCESS') {
      return;
    }

    toast.success('Thanh toán đã được xác nhận.');
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    navigate(`/payment/result?bookingId=${bookingId}&status=SUCCESS`, { replace: true });
  }, [booking?.status, bookingId, navigate, queryClient, sePayQr]);

  useEffect(() => {
    if (!sePayQr) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById('sepay-qr-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [sePayQr]);

  useEffect(() => {
    if (!sePayAmount || bookingStatus !== 'PENDING' || bookingTotalPrice == null) {
      return;
    }

    const qrAmount = Number(sePayAmount);
    if (Number.isFinite(qrAmount) && qrAmount !== bookingTotalPrice) {
      setSePayQr(null);
    }
  }, [bookingStatus, bookingTotalPrice, sePayAmount]);

  const paymentExpired = booking?.status === 'EXPIRED' || remainingSeconds === 0;
  const paymentInstructionLocked = Boolean(sePayQr && booking?.status === 'PENDING');
  const canPay = Boolean(booking && booking.status === 'PENDING' && booking.totalPrice > 0 && !paymentExpired);
  const canEditPromotion = Boolean(booking && booking.status === 'PENDING' && !paymentExpired && !paymentInstructionLocked);

  const handlePaymentMethodChange = (nextMethod: PaymentMethod) => {
    setMethod(nextMethod);
    if (nextMethod !== 'SEPAY') {
      setSePayQr(null);
    }
  };

  const paymentMutation = useMutation({
    mutationFn: () => paymentApi.initiatePayment(bookingId!, method, booking?.totalPrice ?? 0),
    onSuccess: response => {
      const paymentUrl = response.data.result;
      if (paymentUrl && paymentUrl.startsWith('sepay://pay?')) {
        setSePayQr(parseSePayPayload(paymentUrl));
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
        return;
      }
      if (paymentUrl && /^https?:\/\//i.test(paymentUrl)) {
        window.location.assign(paymentUrl);
        return;
      }
      navigate(`/payment/result?bookingId=${bookingId}&status=PENDING`, { replace: true });
    },
    onError: (error: any) => {
      toast.error(resolvePaymentError(error?.response?.data?.message));
    },
  });

  const applyPromotionMutation = useMutation({
    mutationFn: () => bookingApi.applyPromotion(bookingId!, promotionCode.trim()),
    onSuccess: response => {
      const updatedBooking = response.data.result;
      toast.success(`Đã áp dụng mã ${updatedBooking.promotionCode}. Số tiền thanh toán đã được cập nhật.`);
      setSePayQr(null);
      queryClient.setQueryData(['booking', bookingId], updatedBooking);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      scrollPaymentSummaryToCenter();
    },
    onError: (error: any) => {
      toast.error(resolvePromotionError(error?.response?.data?.message));
    },
  });

  const refreshBookingMutation = useMutation({
    mutationFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    onSuccess: latestBooking => {
      queryClient.setQueryData(['booking', bookingId], latestBooking);
      if (latestBooking.status === 'SUCCESS') {
        toast.success('Thanh toán đã được xác nhận.');
        navigate(`/payment/result?bookingId=${bookingId}&status=SUCCESS`, { replace: true });
      } else {
        toast.info('Chưa ghi nhận thanh toán. Vui lòng kiểm tra lại sau vài giây.');
      }
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái thanh toán.');
    },
  });

  const removePromotionMutation = useMutation({
    mutationFn: () => bookingApi.removePromotion(bookingId!),
    onSuccess: response => {
      const updatedBooking = response.data.result;
      toast.success('Đã gỡ mã giảm giá');
      setPromotionCode('');
      setSePayQr(null);
      queryClient.setQueryData(['booking', bookingId], updatedBooking);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      scrollPaymentSummaryToCenter();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể gỡ mã giảm giá. Vui lòng thử lại.');
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
                      onClick={() => item.enabled && handlePaymentMethodChange(item.value)}
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

            {sePayQr && booking.status === 'PENDING' && (
              <div id="sepay-qr-section" className="scroll-mt-24">
                <SePayQrPanel
                  payload={sePayQr}
                  isRefreshing={refreshBookingMutation.isPending}
                  onCopy={(value) => {
                    navigator.clipboard?.writeText(value);
                    toast.success('Đã sao chép nội dung chuyển khoản');
                  }}
                  onRefresh={() => refreshBookingMutation.mutate()}
                />
              </div>
            )}
          </section>

          <aside ref={paymentSummaryRef} className="h-fit rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900 lg:sticky lg:top-24 lg:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <ReceiptText size={18} />
              </span>
              <div>
                <p className="font-black text-slate-950 dark:text-white">Tóm tắt thanh toán</p>
                <p className="text-[11px] font-semibold cinema-muted">Trạng thái: {booking.status}</p>
              </div>
            </div>

            <form
              className="mt-5 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10"
              onSubmit={(event) => {
                event.preventDefault();
                const code = promotionCode.trim();
                if (!code) {
                  toast.error('Vui lòng nhập mã giảm giá.');
                  return;
                }
                applyPromotionMutation.mutate();
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <Percent size={14} />
                  Mã giảm giá
                </span>
                {booking.promotionCode && (
                  <button
                    type="button"
                    disabled={!canEditPromotion || removePromotionMutation.isPending}
                    onClick={() => removePromotionMutation.mutate()}
                    className="text-xs font-black text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                  >
                    Gỡ mã
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={promotionCode}
                  onChange={(event) => setPromotionCode(event.target.value.toUpperCase())}
                  disabled={!canEditPromotion || applyPromotionMutation.isPending || removePromotionMutation.isPending}
                  className="cinema-input h-10 flex-1 bg-white text-sm font-black uppercase tracking-wide disabled:opacity-60 dark:bg-neutral-900"
                  placeholder="WELCOME10"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!canEditPromotion || applyPromotionMutation.isPending || !promotionCode.trim()}
                  className="btn-secondary h-10 px-3 text-xs disabled:opacity-50"
                >
                  {applyPromotionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Áp dụng'}
                </button>
              </div>
              {paymentInstructionLocked && (
                <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800 ring-1 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
                  Mã QR này áp dụng cho số tiền hiện tại. Bấm Đổi mã giảm giá để cập nhật ưu đãi và tạo mã QR mới.
                  <button
                    type="button"
                    className="mt-2 inline-flex font-black text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
                    onClick={() => {
                      setSePayQr(null);
                      toast.info('Đã bỏ mã QR hiện tại. Hãy cập nhật mã giảm giá rồi bấm thanh toán lại.');
                      scrollPaymentSummaryToCenter();
                    }}
                  >
                    Đổi mã giảm giá
                  </button>
                </div>
              )}
              {booking.promotionCode && (
                <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Đang áp dụng mã {booking.promotionCode}
                </p>
              )}
            </form>

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
              {booking.status === 'SUCCESS' ? 'Đã thanh toán' : `Thanh toán ${paymentMethodLabel(method)}`}
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

const parseSePayPayload = (value: string): SePayQrPayload => {
  const query = value.slice('sepay://pay?'.length);
  const params = new URLSearchParams(query);
  return {
    qrUrl: params.get('qrUrl') ?? '',
    bankCode: params.get('bankCode') ?? '',
    accountNumber: params.get('accountNumber') ?? '',
    accountName: params.get('accountName') ?? '',
    amount: params.get('amount') ?? '',
    transferCode: params.get('transferCode') ?? '',
    transferContent: params.get('transferContent') ?? '',
    expiresAt: params.get('expiresAt') ?? undefined,
  };
};

const paymentMethodLabel = (method: PaymentMethod) => {
  switch (method) {
    case 'MOMO':
      return 'MoMo';
    case 'SEPAY':
      return 'Quét QR ngân hàng';
    case 'VNPAY':
      return 'VNPay';
    default:
      return 'thẻ';
  }
};

const resolvePromotionError = (message?: string) => {
  switch (message) {
    case 'Promotion not found':
      return 'Mã giảm giá không tồn tại.';
    case 'Promotion is not active':
      return 'Mã giảm giá đang bị tắt.';
    case 'Promotion has expired':
      return 'Mã giảm giá đã hết hạn hoặc chưa đến thời gian áp dụng.';
    case 'Promotion usage limit reached':
      return 'Mã giảm giá đã hết lượt sử dụng.';
    case 'Order value does not meet minimum requirement':
      return 'Đơn hàng chưa đủ điều kiện áp dụng mã này.';
    case 'Booking payment window has expired':
      return 'Đơn giữ ghế đã hết hạn. Vui lòng chọn ghế lại.';
    case 'Booking has already been processed':
      return 'Chỉ có thể áp mã cho đơn đang chờ thanh toán.';
    default:
      return message || 'Không thể áp dụng mã giảm giá. Vui lòng thử lại.';
  }
};

const resolvePaymentError = (message?: string) => {
  switch (message) {
    case 'Payment method is disabled':
      return 'Phương thức thanh toán này đang tạm tắt.';
    case 'Booking payment window has expired':
      return 'Đơn giữ ghế đã hết hạn. Vui lòng chọn ghế lại.';
    case 'Booking has already been processed':
      return 'Đơn này đã được xử lý trước đó.';
    case 'Payment amount does not match booking total':
      return 'Số tiền thanh toán không khớp với đơn đặt vé.';
    case 'Payment provider error':
      return 'Cổng thanh toán đang gặp sự cố. Vui lòng thử lại sau.';
    default:
      return message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.';
  }
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

  if (method === 'SEPAY') {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm">
        <QrCode size={18} />
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

const SePayQrPanel = ({
  payload,
  isRefreshing,
  onCopy,
  onRefresh,
}: {
  payload: SePayQrPayload;
  isRefreshing: boolean;
  onCopy: (value: string) => void;
  onRefresh: () => void;
}) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
    <div className="border-b border-slate-100 px-4 py-3.5 dark:border-white/8 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            <QrCode size={13} /> Quét QR ngân hàng / ví điện tử
          </div>
          <h3 className="mt-2 text-base font-extrabold text-slate-950 sm:text-lg dark:text-white">Quét mã để thanh toán</h3>
        </div>
        <span className="w-fit rounded-md bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
          Đang chờ xác nhận
        </span>
      </div>
    </div>

    <div className="space-y-4 p-4 sm:p-5">
      <div className="mx-auto max-w-xs rounded-lg bg-slate-50 p-3.5 text-center ring-1 ring-slate-100 dark:bg-neutral-950 dark:ring-white/8">
        <div className="mx-auto grid size-44 place-items-center rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200 sm:size-52 dark:bg-white">
          {payload.qrUrl ? (
            <img src={payload.qrUrl} alt="QR thanh toán ngân hàng hoặc ví điện tử" className="size-full rounded-md object-contain" />
          ) : (
            <div className="grid size-full place-items-center rounded-md bg-slate-100 text-slate-400">
              <QrCode size={44} />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs font-semibold cinema-muted">Số tiền cần chuyển</p>
        <p className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl dark:text-white">
          {payload.amount ? formatMoney(Number(payload.amount)) : '-'}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium leading-relaxed cinema-muted">
          Sau khi chuyển khoản thành công, vé sẽ được xác nhận tự động trong vài giây.
        </p>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
          <PaymentDetailRow label="Ngân hàng" value={payload.bankCode || '-'} />
          <PaymentDetailRow label="Số tài khoản" value={payload.accountNumber || '-'} />
          <PaymentDetailRow label="Chủ tài khoản" value={payload.accountName || '-'} />
        </div>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-400/20 dark:bg-amber-400/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">Nội dung chuyển khoản</p>
              <p className="mt-2 break-all text-sm font-semibold leading-relaxed text-slate-950 dark:text-white">
                {payload.transferContent}
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary h-10 shrink-0 whitespace-nowrap px-3 text-xs"
              onClick={() => onCopy(payload.transferContent)}
            >
              <Copy size={14} /> Sao chép
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <button type="button" className="btn-primary w-full whitespace-nowrap lg:w-auto" disabled={isRefreshing} onClick={onRefresh}>
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Tôi đã chuyển khoản
          </button>
          <p className="text-xs font-medium leading-relaxed cinema-muted">
            Giữ nguyên số tiền và nội dung để hệ thống nhận diện đúng đơn vé.
          </p>
        </div>
      </div>
    </div>
  </div>
);
const PaymentDetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid gap-1 border-b border-slate-100 bg-white px-3.5 py-2.5 last:border-b-0 dark:border-white/8 dark:bg-neutral-950 lg:grid-cols-[135px_1fr] lg:gap-4">
    <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-neutral-400">{label}</p>
    <p className="break-words text-sm font-semibold text-slate-950 dark:text-white lg:text-right">{value}</p>
  </div>
);
const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-50 p-4 dark:bg-neutral-950">
    <p className="cinema-label">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

export default CheckoutPage;
