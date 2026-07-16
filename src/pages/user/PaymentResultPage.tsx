import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, Home, QrCode, ReceiptText, Ticket } from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';

const normalizeStatus = (value: string | null) => {
  if (!value) return 'PENDING';
  const upper = value.toUpperCase();
  if (upper === '00' || upper === 'SUCCESS' || upper === 'PAID') return 'SUCCESS';
  if (upper === 'EXPIRED') return 'EXPIRED';
  if (upper === 'FAILED' || upper === 'FAIL' || upper === 'CANCELLED') return 'FAILED';
  return upper;
};

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || params.get('vnp_TxnRef') || params.get('orderId');
  const status = normalizeStatus(params.get('status') || params.get('vnp_ResponseCode') || params.get('resultCode'));

  const isSuccess = status === 'SUCCESS';
  const isFailed = status === 'FAILED';
  const isExpired = status === 'EXPIRED';

  const { data: booking } = useQuery({
    queryKey: ['payment-result-booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    enabled: Boolean(bookingId),
    refetchInterval: query => {
      if (!isSuccess) return false;
      const details = query.state.data?.bookingDetails ?? [];
      const allTicketsReady = details.length > 0 && details.every(detail => detail.ticketQrImage || detail.ticketQrCode);
      return allTicketsReady ? false : 1500;
    },
  });

  const ticketCount = booking?.bookingDetails?.filter(detail => detail.ticketQrCode || detail.ticketQrImage).length ?? 0;
  const Icon = isSuccess ? CheckCircle2 : (isFailed || isExpired) ? AlertTriangle : Clock;
  const tone = isSuccess
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
    : (isFailed || isExpired)
      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20'
      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';

  const title = isSuccess
    ? 'Thanh toán thành công'
    : isExpired
      ? 'Đơn giữ vé đã hết hạn'
    : isFailed
      ? 'Thanh toán không thành công'
      : 'Đang xác nhận thanh toán';

  const description = isSuccess
    ? 'Booking đã được xác nhận. Mỗi ghế có một vé điện tử và một mã QR check-in riêng.'
    : isExpired
      ? 'Thời gian giữ ghế đã kết thúc nên hệ thống đã nhả ghế về sơ đồ. Vui lòng đặt lại nếu bạn vẫn muốn xem suất này.'
    : isFailed
      ? 'Giao dịch bị hủy hoặc không được cổng thanh toán chấp nhận. Bạn có thể thử lại từ đơn đặt vé.'
      : 'Hệ thống đang chờ kết quả từ cổng thanh toán. Vui lòng kiểm tra lại lịch sử đặt vé sau ít phút.';

  return (
    <>
      <Helmet>
        <title>Kết quả thanh toán - Cinema Booking</title>
      </Helmet>

      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-2xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-8">
          <div className="flex items-start gap-4">
            <div className={`grid size-12 shrink-0 place-items-center rounded-lg border ${tone}`}>
              <Icon size={25} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
                Kết quả giao dịch
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-neutral-300">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-neutral-950">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Trạng thái" value={status} />
              <InfoRow label="Mã tham chiếu" value={bookingId ? `#${bookingId.slice(0, 8).toUpperCase()}` : 'Chưa có'} />
            </div>
          </div>

          {isSuccess && (
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <QrCode size={18} />
                </span>
                <div>
                  <p className="font-black text-slate-950 dark:text-white">
                    {ticketCount > 0 ? `${ticketCount} vé điện tử đã sẵn sàng` : 'Đang tạo vé điện tử'}
                  </p>
                  <p className="mt-1 text-sm font-semibold cinema-muted">
                    Vào chi tiết vé để xem QR riêng của từng ghế.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isSuccess ? (
              <Link
                to={bookingId ? `/my/bookings/${bookingId}` : '/my/bookings'}
                className="btn-primary"
              >
                <Ticket size={17} /> Xem vé
              </Link>
            ) : (isFailed || isExpired) && booking?.showtimeId ? (
              <Link to={`/seat-selection/${booking.showtimeId}`} className="btn-primary">
                Chọn ghế lại
              </Link>
            ) : null}

            <Link to="/my/bookings" className="btn-secondary">
              <ReceiptText size={17} /> Vé của tôi
            </Link>

            <Link to="/" className="btn-ghost">
              <Home size={17} /> Trang chủ
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
      {label}
    </p>
    <p className="mt-1 break-all text-sm font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

export default PaymentResultPage;
