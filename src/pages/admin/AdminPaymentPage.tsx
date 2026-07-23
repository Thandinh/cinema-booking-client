import { useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileWarning,
  History,
  Loader2,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  User,
  XCircle,
} from 'lucide-react';
import {
  paymentApi,
  type PaymentEventResponse,
  type PaymentEventType,
  type PaymentReconciliationIssueResponse,
  type PaymentResponse,
} from '../../api/paymentApi';
import { formatDateTime, formatMoney } from '../../utils/format';

type PaymentStatusFilter = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
type PaymentMethodFilter = 'ALL' | 'VNPAY' | 'MOMO' | 'CREDIT_CARD' | 'CASH';
type AdminPaymentTab = 'transactions' | 'reconciliation' | 'events';
type EventSuccessFilter = 'ALL' | 'true' | 'false';

type TabOption = {
  value: AdminPaymentTab;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

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

const ADMIN_PAYMENT_TABS: TabOption[] = [
  {
    value: 'transactions',
    label: 'Giao dịch',
    description: 'Danh sách payment theo cổng, trạng thái và khách hàng.',
    icon: ReceiptText,
  },
  {
    value: 'reconciliation',
    label: 'Đối soát',
    description: 'Phát hiện lệch trạng thái giữa booking, payment và vé.',
    icon: ShieldCheck,
  },
  {
    value: 'events',
    label: 'Nhật ký',
    description: 'Audit trail callback, lỗi chữ ký, retry và thay đổi trạng thái.',
    icon: History,
  },
];

const EVENT_TYPE_OPTIONS: PaymentEventType[] = [
  'PAYMENT_INITIATED',
  'PAYMENT_REUSED',
  'PAYMENT_URL_CREATED',
  'VNPAY_CALLBACK_RECEIVED',
  'VNPAY_CALLBACK_INVALID_SIGNATURE',
  'VNPAY_AMOUNT_MISMATCH',
  'MOMO_CALLBACK_RECEIVED',
  'MOMO_CALLBACK_INVALID_SIGNATURE',
  'MOMO_AMOUNT_MISMATCH',
  'PAYMENT_ALREADY_PROCESSED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'PAYMENT_EXPIRED',
  'PAYMENT_PROVIDER_ERROR',
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
  const [activeTab, setActiveTab] = useState<AdminPaymentTab>('transactions');
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<PaymentStatusFilter>('ALL');
  const [method, setMethod] = useState<PaymentMethodFilter>('ALL');
  const [keyword, setKeyword] = useState('');

  const paymentsQuery = useQuery({
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
    enabled: activeTab === 'transactions',
    placeholderData: previous => previous,
  });

  const data = paymentsQuery.data;
  const payments = data?.content ?? [];

  return (
    <>
      <Helmet>
        <title>Vận hành thanh toán - cinemabooking.vn</title>
      </Helmet>

      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <CreditCard size={14} />
              Payment ops
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Vận hành thanh toán</h1>
            <p className="mt-1 text-sm cinema-muted">
              Theo dõi giao dịch VNPay, MoMo, nhật ký callback và trạng thái đối soát với đơn đặt vé.
            </p>
          </div>

          <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10">
            Tổng cộng <span className="font-black text-slate-950 dark:text-white">{data?.totalElements ?? 0}</span> giao dịch
          </div>
        </div>

        <div className="mb-5 grid gap-3 xl:grid-cols-3">
          {ADMIN_PAYMENT_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-lg p-4 text-left ring-1 transition-colors ${
                  isActive
                    ? 'bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-slate-950 dark:ring-white'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 place-items-center rounded-lg ${isActive ? 'bg-white/15 dark:bg-slate-950/10' : 'bg-slate-100 dark:bg-neutral-950'}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-black">{tab.label}</p>
                    <p className={`mt-1 text-xs font-semibold ${isActive ? 'text-white/70 dark:text-slate-500' : 'cinema-muted'}`}>
                      {tab.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {activeTab === 'transactions' && (
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

                  <button
                    type="button"
                    onClick={() => paymentsQuery.refetch()}
                    className="btn-ghost !h-11 !px-4"
                    disabled={paymentsQuery.isFetching}
                  >
                    <RefreshCw size={16} className={paymentsQuery.isFetching ? 'animate-spin' : ''} />
                    Làm mới
                  </button>
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

            <PaymentTable
              payments={payments}
              isLoading={paymentsQuery.isLoading}
              isError={paymentsQuery.isError}
              error={paymentsQuery.error}
            />

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
        )}

        {activeTab === 'reconciliation' && <PaymentReconciliationPanel />}
        {activeTab === 'events' && <PaymentEventsPanel />}
      </div>
    </>
  );
};

const PaymentTable = ({
  payments,
  isLoading,
  isError,
  error,
}: {
  payments: PaymentResponse[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) => (
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
                {getQueryErrorMessage(error, 'Không thể tải danh sách giao dịch')}
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
);

const PaymentReconciliationPanel = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['payment-reconciliation'],
    queryFn: () => paymentApi.getReconciliationIssues(100).then(response => response.data.result),
  });

  const issues = data ?? [];
  const hasCriticalIssue = issues.some(issue => ['CRITICAL', 'HIGH'].includes(issue.severity));

  return (
    <section className="cinema-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-white/5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
            <ShieldCheck size={20} className="text-emerald-500" />
            Đối soát payment
          </h2>
          <p className="mt-1 text-sm cinema-muted">
            Kiểm tra các lệch trạng thái có thể ảnh hưởng doanh thu, giữ ghế hoặc sinh vé.
          </p>
        </div>
        <button type="button" onClick={() => refetch()} className="btn-primary !h-10 !px-4" disabled={isFetching}>
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="p-5">
        {isLoading ? (
          <LoadingState label="Đang đối soát payment..." />
        ) : isError ? (
          <ErrorState message={getQueryErrorMessage(error, 'Không thể tải dữ liệu đối soát')} />
        ) : issues.length === 0 ? (
          <div className="rounded-lg bg-emerald-50 p-5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-black">Chưa phát hiện lệch đối soát.</p>
                <p className="mt-1 text-emerald-700/80 dark:text-emerald-200/80">Booking, payment và ticket đang khớp theo các rule hiện tại.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-lg p-4 text-sm font-semibold ring-1 ${
              hasCriticalIssue
                ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
                : 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20'
            }`}
            >
              Có {issues.length} vấn đề cần kiểm tra. Ưu tiên xử lý lỗi CRITICAL/HIGH trước khi đóng ca.
            </div>
            {issues.map(issue => (
              <ReconciliationIssueCard key={`${issue.issueType}-${issue.bookingId ?? issue.paymentId ?? issue.transactionNo}`} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const PaymentEventsPanel = () => {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [eventType, setEventType] = useState<'ALL' | PaymentEventType>('ALL');
  const [success, setSuccess] = useState<EventSuccessFilter>('ALL');

  const eventsQuery = useQuery({
    queryKey: ['payment-events', keyword, eventType, success, page],
    queryFn: () =>
      paymentApi.getPaymentEvents({
        keyword: keyword.trim() || undefined,
        eventType: eventType === 'ALL' ? undefined : eventType,
        success: success === 'ALL' ? undefined : success === 'true',
        page,
        size: 12,
        sort: 'createdAt,desc',
      }).then(response => response.data.result),
    placeholderData: previous => previous,
  });

  const data = eventsQuery.data;
  const events = data?.content ?? [];

  return (
    <section className="cinema-card overflow-hidden">
      <div className="space-y-4 border-b border-slate-100 p-5 dark:border-white/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
              <History size={20} className="text-amber-500" />
              Nhật ký payment
            </h2>
            <p className="mt-1 text-sm cinema-muted">Theo dõi vòng đời giao dịch và callback từ cổng thanh toán.</p>
          </div>

          <button type="button" onClick={() => eventsQuery.refetch()} className="btn-ghost !h-10 !px-4" disabled={eventsQuery.isFetching}>
            <RefreshCw size={16} className={eventsQuery.isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_220px_160px]">
          <div className="flex h-11 min-w-0 items-center gap-3 rounded-lg bg-slate-100 px-4 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(0);
              }}
              placeholder="Tìm giao dịch, booking, message..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          <select
            value={eventType}
            onChange={(event) => {
              setEventType(event.target.value as 'ALL' | PaymentEventType);
              setPage(0);
            }}
            className="cinema-input h-11 py-0"
          >
            <option value="ALL">Tất cả sự kiện</option>
            {EVENT_TYPE_OPTIONS.map(type => (
              <option key={type} value={type}>{formatEventType(type)}</option>
            ))}
          </select>

          <select
            value={success}
            onChange={(event) => {
              setSuccess(event.target.value as EventSuccessFilter);
              setPage(0);
            }}
            className="cinema-input h-11 py-0"
          >
            <option value="ALL">Tất cả kết quả</option>
            <option value="true">Thành công</option>
            <option value="false">Có lỗi</option>
          </select>
        </div>
      </div>

      <div className="p-5">
        {eventsQuery.isLoading ? (
          <LoadingState label="Đang tải nhật ký payment..." />
        ) : eventsQuery.isError ? (
          <ErrorState message={getQueryErrorMessage(eventsQuery.error, 'Không thể tải nhật ký payment')} />
        ) : events.length === 0 ? (
          <EmptyState label="Chưa có nhật ký payment phù hợp bộ lọc." />
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <PaymentEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-white/5">
          <span className="text-sm font-semibold text-slate-500">
            Trang {page + 1} / {data?.totalPages} ({data?.totalElements} sự kiện)
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
              Payment #{shortId(payment.id)}
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
              {payment.bookingCode || (payment.bookingId ? `#${shortId(payment.bookingId)}` : 'Không có đơn')}
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

const ReconciliationIssueCard = ({ issue }: { issue: PaymentReconciliationIssueResponse }) => (
  <article className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={issue.severity} />
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-neutral-300">
            {issue.issueType}
          </span>
          {issue.transactionNo && <MethodPill label={issue.transactionNo} />}
        </div>
        <p className="mt-3 text-sm font-bold text-slate-950 dark:text-white">{issue.message}</p>
        <div className="mt-3 grid gap-2 text-xs font-semibold cinema-muted md:grid-cols-2 xl:grid-cols-4">
          <span>Booking: {issue.bookingId ? shortId(issue.bookingId) : '-'}</span>
          <span>Payment: {issue.paymentId ? shortId(issue.paymentId) : '-'}</span>
          <span>Booking status: {issue.bookingStatus || '-'}</span>
          <span>Payment status: {issue.paymentStatus || '-'}</span>
        </div>
      </div>
      <p className="shrink-0 text-xs font-semibold cinema-muted">
        {issue.createdAt ? formatDateTime(issue.createdAt) : 'Chưa có thời gian'}
      </p>
    </div>
  </article>
);

const PaymentEventCard = ({ event }: { event: PaymentEventResponse }) => {
  const isSuccess = event.success !== false;
  const hasPayload = event.payload && Object.keys(event.payload).length > 0;

  return (
    <article className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ring-1 ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
                : 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
            }`}
            >
              {isSuccess ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {isSuccess ? 'OK' : 'Cần kiểm tra'}
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-neutral-300">
              {formatEventType(event.eventType)}
            </span>
            {event.method && <MethodPill label={event.method} />}
            {event.transactionNo && <MethodPill label={event.transactionNo} />}
          </div>

          <p className="mt-3 text-sm font-bold text-slate-950 dark:text-white">
            {event.message || 'Không có ghi chú'}
          </p>

          <div className="mt-3 grid gap-2 text-xs font-semibold cinema-muted md:grid-cols-2 xl:grid-cols-4">
            <span>Booking: {event.bookingId ? shortId(event.bookingId) : '-'}</span>
            <span>Payment: {event.paymentId ? shortId(event.paymentId) : '-'}</span>
            <span>Payment: {formatTransition(event.paymentStatusBefore, event.paymentStatusAfter)}</span>
            <span>Booking: {formatTransition(event.bookingStatusBefore, event.bookingStatusAfter)}</span>
          </div>

          {hasPayload && (
            <details className="mt-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-neutral-900">
              <summary className="cursor-pointer font-black text-slate-700 dark:text-neutral-300">Payload từ cổng thanh toán</summary>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-slate-600 dark:text-neutral-400">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </details>
          )}
        </div>

        <p className="shrink-0 text-xs font-semibold cinema-muted">
          {event.createdAt ? formatDateTime(event.createdAt) : 'Chưa có thời gian'}
        </p>
      </div>
    </article>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const meta = severity === 'CRITICAL' || severity === 'HIGH'
    ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
    : severity === 'MEDIUM'
      ? 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20'
      : 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ring-1 ${meta}`}>
      <FileWarning size={12} />
      {severity}
    </span>
  );
};

const MethodPill = ({ label }: { label: string }) => (
  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10">
    {label}
  </span>
);

const LoadingState = ({ label }: { label: string }) => (
  <div className="py-16 text-center">
    <div className="inline-flex items-center gap-2 text-sm font-semibold cinema-muted">
      <Loader2 size={17} className="animate-spin text-amber-500" />
      {label}
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
    {message}
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="py-16 text-center">
    <div className="inline-flex items-center gap-2 text-sm font-semibold cinema-muted">
      <Activity size={17} className="text-slate-400" />
      {label}
    </div>
  </div>
);

const getQueryErrorMessage = (error: unknown, fallback: string) => {
  const maybeAxiosError = error as { response?: { data?: { message?: string } } };
  return maybeAxiosError.response?.data?.message || fallback;
};

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

const formatTransition = (before?: string, after?: string) => {
  if (!before && !after) return '-';
  if (!before) return after ?? '-';
  if (!after || before === after) return before;
  return `${before} → ${after}`;
};

const formatEventType = (value: string) => value
  .split('_')
  .map(part => part.charAt(0) + part.slice(1).toLowerCase())
  .join(' ');

export default AdminPaymentPage;
