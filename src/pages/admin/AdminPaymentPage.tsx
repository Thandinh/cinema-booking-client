import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  ReceiptText,
  Search,
  Ticket,
  User,
  XCircle,
} from 'lucide-react';
import { paymentApi, type PaymentResponse } from '../../api/paymentApi';
import { formatDateTime, formatMoney } from '../../utils/format';

type PaymentStatusFilter = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
type PaymentMethodFilter = 'ALL' | 'VNPAY' | 'MOMO' | 'CREDIT_CARD' | 'CASH';

const STATUS_OPTIONS: { value: PaymentStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'EXPIRED', label: 'Hết hạn' },
];

const METHOD_OPTIONS: { value: PaymentMethodFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả cổng' },
  { value: 'VNPAY', label: 'VNPay' },
  { value: 'MOMO', label: 'MoMo' },
  { value: 'CREDIT_CARD', label: 'Thẻ quốc tế' },
  { value: 'CASH', label: 'Tiền mặt' },
];

const STATUS_META = {
  PENDING: { label: 'Chờ thanh toán', icon: Clock, className: 'badge-warning' },
  SUCCESS: { label: 'Thành công', icon: CheckCircle2, className: 'badge-success' },
  FAILED: { label: 'Thất bại', icon: XCircle, className: 'badge-danger' },
  EXPIRED: { label: 'Hết hạn', icon: AlertCircle, className: 'badge-neutral' },
};

const METHOD_META: Record<string, { label: string; className: string }> = {
  VNPAY: { label: 'VNPay', className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20' },
  MOMO: { label: 'MoMo', className: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-500/20' },
  CREDIT_CARD: { label: 'Thẻ quốc tế', className: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10' },
  CASH: { label: 'Tiền mặt', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20' },
};

const AdminPaymentPage = () => {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<PaymentStatusFilter>('ALL');
  const [method, setMethod] = useState<PaymentMethodFilter>('ALL');
  const [keyword, setKeyword] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-payments', status, method, keyword, page],
    queryFn: () =>
      paymentApi.getAllPayments({
        status: status === 'ALL' ? undefined : status,
        method: method === 'ALL' ? undefined : method,
        keyword: keyword.trim() || undefined,
        page,
        size: 15,
        sort: 'createdAt,desc',
      }).then(response => response.data.result),
    placeholderData: previous => previous,
  });

  const payments = data?.content ?? [];

  return (
    <>
      <Helmet>
        <title>Giao dịch thanh toán - cinemabooking.vn</title>
      </Helmet>

      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <CreditCard size={14} />
              Payment ops
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Giao dịch thanh toán</h1>
            <p className="mt-1 text-sm cinema-muted">
              Theo dõi giao dịch VNPay, MoMo và trạng thái đối soát với đơn đặt vé.
            </p>
          </div>

          <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10">
            Tổng cộng <span className="font-black text-slate-950 dark:text-white">{data?.totalElements ?? 0}</span> giao dịch
          </div>
        </div>

        <section className="cinema-card overflow-hidden">
          <div className="space-y-4 border-b border-slate-100 p-5 dark:border-white/5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg bg-slate-100 px-4 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10 xl:max-w-lg">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Tìm mã giao dịch, mã đơn, user, email, tên phim..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={method}
                  onChange={(event) => {
                    setMethod(event.target.value as PaymentMethodFilter);
                    setPage(0);
                  }}
                  className="cinema-input h-11 min-w-[150px] py-0"
                >
                  {METHOD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatus(option.value);
                    setPage(0);
                  }}
                  className={`h-9 shrink-0 rounded-lg px-4 text-xs font-black transition-colors ${
                    status === option.value
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-5 py-4">Giao dịch</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Đơn / phim</th>
                  <th className="px-5 py-4">Cổng</th>
                  <th className="px-5 py-4 text-right">Số tiền</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold cinema-muted">
                        <Loader2 size={17} className="animate-spin text-amber-500" />
                        Đang tải giao dịch...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                        {(error as any)?.response?.data?.message || 'Không thể tải danh sách giao dịch'}
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-sm font-semibold cinema-muted">Chưa có giao dịch phù hợp bộ lọc.</p>
                    </td>
                  </tr>
                ) : (
                  payments.map(payment => (
                    <PaymentRow key={payment.id} payment={payment} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">
                Trang {page + 1} / {data?.totalPages} ({data?.totalElements} giao dịch)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(value => value - 1)}
                  className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  disabled={page >= (data?.totalPages ?? 1) - 1}
                  onClick={() => setPage(value => value + 1)}
                  className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

const PaymentRow = ({ payment }: { payment: PaymentResponse }) => {
  const statusMeta = STATUS_META[payment.status as keyof typeof STATUS_META] ?? STATUS_META.FAILED;
  const StatusIcon = statusMeta.icon;
  const methodMeta = METHOD_META[payment.method] ?? METHOD_META.CREDIT_CARD;

  return (
    <tr className="text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <ReceiptText size={17} />
          </span>
          <div className="min-w-0">
            <p className="break-all font-black text-slate-950 dark:text-white">
              {payment.transactionNo || 'Chưa có mã'}
            </p>
            <p className="mt-1 text-xs font-semibold cinema-muted">
              Payment #{payment.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <User size={15} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-950 dark:text-white">
              {payment.customerName || payment.customerUsername || 'Khách hàng'}
            </p>
            <p className="mt-1 truncate text-xs font-semibold cinema-muted">
              {payment.customerEmail || payment.customerUsername || 'Không có email'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <Ticket size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="font-black text-slate-950 dark:text-white">
              {payment.bookingCode || (payment.bookingId ? `#${payment.bookingId.slice(0, 8).toUpperCase()}` : 'Không có đơn')}
            </p>
            <p className="mt-1 max-w-[260px] truncate text-xs font-semibold cinema-muted">
              {payment.movieTitle || 'Chưa có phim'} · {payment.cinemaName || 'Chưa có rạp'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black ring-1 ${methodMeta.className}`}>
          {methodMeta.label}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <p className="font-black text-slate-950 dark:text-white">{formatMoney(payment.amount)}</p>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 ${statusMeta.className}`}>
          <StatusIcon size={12} />
          {statusMeta.label}
        </span>
        {payment.bookingStatus && (
          <p className="mt-1 text-[11px] font-semibold cinema-muted">Đơn: {payment.bookingStatus}</p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-slate-700 dark:text-neutral-300">
          {payment.paymentTime ? formatDateTime(payment.paymentTime) : 'Chưa thanh toán'}
        </p>
        {payment.showtimeStartTime && (
          <p className="mt-1 text-xs cinema-muted">Suất: {formatDateTime(payment.showtimeStartTime)}</p>
        )}
      </td>
    </tr>
  );
};

export default AdminPaymentPage;
