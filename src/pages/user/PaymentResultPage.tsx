import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, CheckCircle2, Clock, Home, ReceiptText, Ticket } from 'lucide-react';

const normalizeStatus = (value: string | null) => {
  if (!value) return 'PENDING';
  const upper = value.toUpperCase();
  if (upper === '00' || upper === 'SUCCESS' || upper === 'PAID') return 'SUCCESS';
  if (upper === 'FAILED' || upper === 'FAIL' || upper === 'CANCELLED') return 'FAILED';
  return upper;
};

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || params.get('vnp_TxnRef') || params.get('orderId');
  const status = normalizeStatus(params.get('status') || params.get('vnp_ResponseCode') || params.get('resultCode'));
  const isSuccess = status === 'SUCCESS';
  const isFailed = status === 'FAILED';

  const Icon = isSuccess ? CheckCircle2 : isFailed ? AlertTriangle : Clock;
  const tone = isSuccess
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
    : isFailed
      ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
      : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20';

  return (
    <>
      <Helmet>
        <title>Kết quả thanh toán - CinemaBooking</title>
      </Helmet>

      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
          <div className={`mx-auto grid size-20 place-items-center rounded-3xl ring-1 ${tone}`}>
            <Icon size={38} />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {isSuccess ? 'Thanh toán thành công' : isFailed ? 'Thanh toán chưa hoàn tất' : 'Đang chờ xác nhận'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 cinema-muted">
            {isSuccess
              ? 'Vé điện tử của bạn đã được ghi nhận. Bạn có thể xem lại trong mục Vé của tôi.'
              : isFailed
                ? 'Giao dịch không thành công hoặc đã bị hủy. Bạn có thể quay lại đơn đặt vé để thử lại.'
                : 'Hệ thống đang chờ cổng thanh toán xác nhận. Trạng thái sẽ được cập nhật trong Vé của tôi.'}
          </p>

          {bookingId && (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-slate-50 p-4 dark:bg-neutral-950">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">Mã booking</p>
              <p className="mt-2 font-black text-slate-950 dark:text-white">#{bookingId.slice(0, 12)}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={bookingId ? `/my/bookings/${bookingId}` : '/my/bookings'}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300"
            >
              <Ticket size={17} />
              Xem vé
            </Link>
            <Link
              to="/my/bookings"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
            >
              <ReceiptText size={17} />
              Vé của tôi
            </Link>
            <Link
              to="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
            >
              <Home size={17} />
              Trang chủ
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default PaymentResultPage;
