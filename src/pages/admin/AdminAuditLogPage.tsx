import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { auditLogApi, type AdminAuditLogResponse } from '../../api/auditLogApi';
import { formatDateTime } from '../../utils/format';

type ActionFilter = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'CHECK_IN';
type ResourceFilter =
  | 'ALL'
  | 'MOVIE'
  | 'CINEMA'
  | 'ROOM'
  | 'SEAT'
  | 'SHOWTIME'
  | 'BOOKING'
  | 'PAYMENT'
  | 'PROMOTION'
  | 'USER'
  | 'TICKET';
type ResultFilter = 'ALL' | 'SUCCESS' | 'FAILED';

const ACTION_OPTIONS: { value: ActionFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả thao tác' },
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'CANCEL', label: 'Hủy' },
  { value: 'CHECK_IN', label: 'Check-in' },
];

const RESOURCE_OPTIONS: { value: ResourceFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả module' },
  { value: 'MOVIE', label: 'Phim' },
  { value: 'CINEMA', label: 'Rạp' },
  { value: 'ROOM', label: 'Phòng' },
  { value: 'SEAT', label: 'Ghế' },
  { value: 'SHOWTIME', label: 'Suất chiếu' },
  { value: 'BOOKING', label: 'Đơn vé' },
  { value: 'PAYMENT', label: 'Thanh toán' },
  { value: 'PROMOTION', label: 'Khuyến mãi' },
  { value: 'USER', label: 'Người dùng' },
  { value: 'TICKET', label: 'Vé' },
];

const RESULT_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: 'ALL', label: 'Mọi kết quả' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Có lỗi' },
];

const ACTION_META: Record<string, { label: string; className: string }> = {
  CREATE: { label: 'Tạo mới', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20' },
  UPDATE: { label: 'Cập nhật', className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20' },
  DELETE: { label: 'Xóa', className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20' },
  CANCEL: { label: 'Hủy', className: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20' },
  CHECK_IN: { label: 'Check-in', className: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20' },
};

const AdminAuditLogPage = () => {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState<ActionFilter>('ALL');
  const [resource, setResource] = useState<ResourceFilter>('ALL');
  const [result, setResult] = useState<ResultFilter>('ALL');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-audit-logs', keyword, action, resource, result, page],
    queryFn: () =>
      auditLogApi.getAuditLogs({
        keyword: keyword.trim() || undefined,
        action: action === 'ALL' ? undefined : action,
        resource: resource === 'ALL' ? undefined : resource,
        success: result === 'ALL' ? undefined : result === 'SUCCESS',
        page,
        size: 18,
        sort: 'createdAt,desc',
      }).then(response => response.data.result),
    placeholderData: previous => previous,
  });

  const logs = data?.content ?? [];

  return (
    <>
      <Helmet>
        <title>Nhật ký hệ thống - cinemabooking.vn</title>
      </Helmet>

      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white ring-1 ring-slate-900 dark:bg-white dark:text-slate-950 dark:ring-white">
              <ShieldCheck size={14} />
              Audit trail
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Nhật ký hệ thống</h1>
            <p className="mt-1 text-sm cinema-muted">
              Theo dõi thao tác quản trị, check-in vé và các thay đổi nhạy cảm trong hệ thống.
            </p>
          </div>

          <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10">
            Tổng <span className="font-black text-slate-950 dark:text-white">{data?.totalElements ?? 0}</span> dòng log
          </div>
        </div>

        <section className="cinema-card overflow-hidden">
          <div className="space-y-4 border-b border-slate-100 p-5 dark:border-white/5">
            <div className="grid gap-3 xl:grid-cols-[1fr_190px_180px_150px]">
              <div className="flex h-11 min-w-0 items-center gap-3 rounded-lg bg-slate-100 px-4 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Tìm người thao tác, URL, IP hoặc mã tài nguyên..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </div>

              <FilterSelect value={action} onChange={(value) => { setAction(value as ActionFilter); setPage(0); }} options={ACTION_OPTIONS} />
              <FilterSelect value={resource} onChange={(value) => { setResource(value as ResourceFilter); setPage(0); }} options={RESOURCE_OPTIONS} />
              <FilterSelect value={result} onChange={(value) => { setResult(value as ResultFilter); setPage(0); }} options={RESULT_OPTIONS} />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold cinema-muted">
              <Filter size={14} />
              Audit log chỉ ghi các request thay đổi dữ liệu, không ghi thao tác xem danh sách.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4">Người thao tác</th>
                  <th className="px-5 py-4">Thao tác</th>
                  <th className="px-5 py-4">Tài nguyên</th>
                  <th className="px-5 py-4">Đường dẫn</th>
                  <th className="px-5 py-4">IP</th>
                  <th className="px-5 py-4">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold cinema-muted">
                        <Loader2 size={17} className="animate-spin text-amber-500" />
                        Đang tải nhật ký...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                        {(error as any)?.response?.data?.message || 'Không thể tải nhật ký hệ thống'}
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-sm font-semibold cinema-muted">Chưa có log phù hợp bộ lọc.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => <AuditLogRow key={log.id} log={log} />)
                )}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">
                Trang {page + 1} / {data?.totalPages} ({data?.totalElements} log)
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

const FilterSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="cinema-input h-11 py-0"
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

const AuditLogRow = ({ log }: { log: AdminAuditLogResponse }) => {
  const actionMeta = ACTION_META[log.action] ?? {
    label: log.action,
    className: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10',
  };
  const SuccessIcon = log.success ? CheckCircle2 : XCircle;

  return (
    <tr className="text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-neutral-300">
          <Clock3 size={15} className="text-slate-400" />
          {formatDateTime(log.createdAt)}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <UserRound size={15} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="truncate font-black text-slate-950 dark:text-white">
              {log.actorUsername || 'unknown'}
            </p>
            {log.actorId && (
              <p className="mt-1 text-xs font-semibold cinema-muted">
                #{log.actorId.slice(0, 8).toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ring-1 ${actionMeta.className}`}>
          <Activity size={12} />
          {actionMeta.label}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="font-black text-slate-950 dark:text-white">{log.resource}</p>
        {log.resourceId && (
          <p className="mt-1 break-all text-xs font-semibold cinema-muted">{log.resourceId}</p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[320px] truncate font-semibold text-slate-700 dark:text-neutral-300">
          {log.httpMethod} {log.requestPath}
        </p>
        {log.queryString && (
          <p className="mt-1 max-w-[320px] truncate text-xs cinema-muted">?{log.queryString}</p>
        )}
        {!log.success && log.errorMessage && (
          <p className="mt-2 inline-flex max-w-[320px] items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
            <AlertTriangle size={12} />
            <span className="truncate">{log.errorMessage}</span>
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-slate-700 dark:text-neutral-300">{log.ipAddress || '--'}</p>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ring-1 ${
          log.success
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
            : 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
        }`}>
          <SuccessIcon size={12} />
          {log.success ? 'Thành công' : `Lỗi ${log.statusCode ?? ''}`}
        </span>
      </td>
    </tr>
  );
};

export default AdminAuditLogPage;
