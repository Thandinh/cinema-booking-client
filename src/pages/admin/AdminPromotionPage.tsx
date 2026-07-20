import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Gift,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  promotionApi,
  type DiscountType,
  type PromotionAdminStatus,
  type PromotionRequest,
  type PromotionResponse,
} from '../../api/promotionApi';
import { formatDateTime, formatMoney } from '../../utils/format';

type PromotionFormState = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  isActive: boolean;
};

const STATUS_OPTIONS: { value: PromotionAdminStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'AVAILABLE', label: 'Đang áp dụng' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'EXPIRED', label: 'Đã hết hạn' },
  { value: 'INACTIVE', label: 'Đã tắt' },
  { value: 'EXHAUSTED', label: 'Hết lượt' },
];

const emptyForm: PromotionFormState = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '10',
  maxDiscountAmount: '',
  minOrderValue: '0',
  startDate: toDateTimeLocal(new Date()),
  endDate: toDateTimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  usageLimit: '',
  isActive: true,
};

const AdminPromotionPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<PromotionAdminStatus>('ALL');
  const [editingPromotion, setEditingPromotion] = useState<PromotionResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PromotionFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-promotions', status, keyword, page],
    queryFn: () =>
      promotionApi.getPromotions({
        status,
        keyword: keyword.trim() || undefined,
        page,
        size: 12,
        sort: 'createdAt,desc',
      }).then(response => response.data.result),
    placeholderData: previous => previous,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: PromotionRequest) =>
      editingPromotion
        ? promotionApi.updatePromotion(editingPromotion.id, payload)
        : promotionApi.createPromotion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      closeModal();
    },
    onError: (mutationError: any) => {
      setFormError(mutationError?.response?.data?.message || 'Không thể lưu khuyến mãi. Vui lòng kiểm tra lại dữ liệu.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionApi.deletePromotion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }),
  });

  const promotions = data?.content ?? [];

  const activePromotionCount = promotions.filter(item => resolvePromotionState(item).key === 'AVAILABLE').length;
  const inactivePromotionCount = promotions.filter(item => !item.isActive).length;

  const openCreateModal = () => {
    setEditingPromotion(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (promotion: PromotionResponse) => {
    setEditingPromotion(promotion);
    setForm({
      code: promotion.code,
      description: promotion.description ?? '',
      discountType: promotion.discountType,
      discountValue: String(promotion.discountValue ?? ''),
      maxDiscountAmount: promotion.maxDiscountAmount == null ? '' : String(promotion.maxDiscountAmount),
      minOrderValue: promotion.minOrderValue == null ? '0' : String(promotion.minOrderValue),
      startDate: toDateTimeLocal(new Date(promotion.startDate)),
      endDate: toDateTimeLocal(new Date(promotion.endDate)),
      usageLimit: promotion.usageLimit == null ? '' : String(promotion.usageLimit),
      isActive: promotion.isActive,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
    setFormError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    const payload = buildPayload(form, Boolean(editingPromotion));
    const validationError = validatePayload(payload);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    saveMutation.mutate(payload);
  };

  const handleDelete = (promotion: PromotionResponse) => {
    const ok = window.confirm(`Xóa mã khuyến mãi ${promotion.code}? Mã sẽ không còn áp dụng cho đơn mới.`);
    if (ok) {
      deleteMutation.mutate(promotion.id);
    }
  };

  return (
    <>
      <Helmet>
        <title>Khuyến mãi - cinemabooking.vn</title>
      </Helmet>

      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <Gift size={14} />
              Promotion ops
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Khuyến mãi</h1>
            <p className="mt-1 text-sm cinema-muted">
              Quản lý mã giảm giá, giới hạn lượt dùng và thời gian áp dụng cho đơn đặt vé.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10">
              Đang áp dụng <span className="font-black text-emerald-600">{activePromotionCount}</span>
            </div>
            <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10">
              Đã tắt <span className="font-black text-slate-950 dark:text-white">{inactivePromotionCount}</span>
            </div>
            <button type="button" onClick={openCreateModal} className="btn-primary h-11 px-4">
              <Plus size={16} />
              Thêm mã
            </button>
          </div>
        </div>

        <section className="cinema-card overflow-hidden">
          <div className="space-y-4 border-b border-slate-100 p-5 dark:border-white/5">
            <div className="flex h-11 min-w-0 items-center gap-3 rounded-lg bg-slate-100 px-4 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10 lg:max-w-xl">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(0);
                }}
                placeholder="Tìm mã hoặc mô tả khuyến mãi..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              />
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
            <table className="w-full min-w-[1120px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-5 py-4">Mã</th>
                  <th className="px-5 py-4">Giảm giá</th>
                  <th className="px-5 py-4">Điều kiện</th>
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4">Lượt dùng</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold cinema-muted">
                        <Loader2 size={17} className="animate-spin text-amber-500" />
                        Đang tải khuyến mãi...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                        {(error as any)?.response?.data?.message || 'Không thể tải danh sách khuyến mãi'}
                      </div>
                    </td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-sm font-semibold cinema-muted">Chưa có mã khuyến mãi phù hợp bộ lọc.</p>
                    </td>
                  </tr>
                ) : (
                  promotions.map(promotion => (
                    <PromotionRow
                      key={promotion.id}
                      promotion={promotion}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      deleting={deleteMutation.isPending}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">
                Trang {page + 1} / {data?.totalPages} ({data?.totalElements} mã)
              </span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(value => value - 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">
                  Trước
                </button>
                <button disabled={page >= (data?.totalPages ?? 1) - 1} onClick={() => setPage(value => value + 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/8">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  {editingPromotion ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi'}
                </h2>
                <p className="mt-0.5 text-xs font-semibold cinema-muted">
                  Mã có thể để trống để hệ thống tự sinh.
                </p>
              </div>
              <button type="button" onClick={closeModal} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Mã khuyến mãi">
                  <input
                    value={form.code}
                    onChange={(event) => setForm(value => ({ ...value, code: event.target.value.toUpperCase() }))}
                    className="cinema-input"
                    placeholder="WELCOME10"
                    disabled={Boolean(editingPromotion)}
                  />
                </Field>

                <Field label="Trạng thái">
                  <label className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm(value => ({ ...value, isActive: event.target.checked }))}
                      className="size-4 accent-amber-500"
                    />
                    Đang bật
                  </label>
                </Field>
              </div>

              <Field label="Mô tả">
                <input
                  value={form.description}
                  onChange={(event) => setForm(value => ({ ...value, description: event.target.value }))}
                  className="cinema-input"
                  placeholder="Giảm 10% cho đơn đầu tiên"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Loại giảm">
                  <select
                    value={form.discountType}
                    onChange={(event) => setForm(value => ({ ...value, discountType: event.target.value as DiscountType, maxDiscountAmount: event.target.value === 'FIXED' ? '' : value.maxDiscountAmount }))}
                    className="cinema-input"
                  >
                    <option value="PERCENT">Phần trăm</option>
                    <option value="FIXED">Tiền cố định</option>
                  </select>
                </Field>

                <Field label={form.discountType === 'PERCENT' ? 'Giá trị (%)' : 'Giá trị (VNĐ)'}>
                  <input
                    type="number"
                    min="0"
                    value={form.discountValue}
                    onChange={(event) => setForm(value => ({ ...value, discountValue: event.target.value }))}
                    className="cinema-input"
                    required
                  />
                </Field>

                <Field label="Giảm tối đa">
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscountAmount}
                    onChange={(event) => setForm(value => ({ ...value, maxDiscountAmount: event.target.value }))}
                    className="cinema-input"
                    placeholder="Không giới hạn"
                    disabled={form.discountType === 'FIXED'}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Đơn tối thiểu">
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderValue}
                    onChange={(event) => setForm(value => ({ ...value, minOrderValue: event.target.value }))}
                    className="cinema-input"
                  />
                </Field>

                <Field label="Giới hạn lượt dùng">
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={(event) => setForm(value => ({ ...value, usageLimit: event.target.value }))}
                    className="cinema-input"
                    placeholder="Không giới hạn"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Bắt đầu">
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(event) => setForm(value => ({ ...value, startDate: event.target.value }))}
                    className="cinema-input"
                    required
                  />
                </Field>

                <Field label="Kết thúc">
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(event) => setForm(value => ({ ...value, endDate: event.target.value }))}
                    className="cinema-input"
                    required
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-white/8">
              <button type="button" onClick={closeModal} className="btn-ghost h-10 px-4">
                Hủy
              </button>
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary h-10 px-4 disabled:opacity-60">
                {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                {editingPromotion ? 'Lưu thay đổi' : 'Tạo mã'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const PromotionRow = ({
  promotion,
  onEdit,
  onDelete,
  deleting,
}: {
  promotion: PromotionResponse;
  onEdit: (promotion: PromotionResponse) => void;
  onDelete: (promotion: PromotionResponse) => void;
  deleting: boolean;
}) => {
  const state = resolvePromotionState(promotion);
  const StateIcon = state.icon;
  const usagePercent = promotion.usageLimit
    ? Math.min(100, Math.round((promotion.usedCount / promotion.usageLimit) * 100))
    : 0;

  return (
    <tr className="text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            <Gift size={17} />
          </span>
          <div className="min-w-0">
            <p className="font-black tracking-wide text-slate-950 dark:text-white">{promotion.code}</p>
            <p className="mt-1 max-w-[260px] truncate text-xs font-semibold cinema-muted">
              {promotion.description || 'Không có mô tả'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-black text-slate-950 dark:text-white">
          {promotion.discountType === 'PERCENT'
            ? `${promotion.discountValue}%`
            : formatMoney(promotion.discountValue)}
        </p>
        {promotion.maxDiscountAmount != null && (
          <p className="mt-1 text-xs font-semibold cinema-muted">Tối đa {formatMoney(promotion.maxDiscountAmount)}</p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-slate-700 dark:text-neutral-300">
          Từ {formatMoney(promotion.minOrderValue ?? 0)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-slate-700 dark:text-neutral-300">{formatDateTime(promotion.startDate)}</p>
        <p className="mt-1 text-xs font-semibold cinema-muted">đến {formatDateTime(promotion.endDate)}</p>
      </td>

      <td className="px-5 py-4">
        <p className="font-black text-slate-950 dark:text-white">
          {promotion.usedCount}{promotion.usageLimit ? ` / ${promotion.usageLimit}` : ' / ∞'}
        </p>
        {promotion.usageLimit ? (
          <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <span className="block h-full rounded-full bg-amber-500" style={{ width: `${usagePercent}%` }} />
          </div>
        ) : (
          <p className="mt-1 text-xs font-semibold cinema-muted">Không giới hạn</p>
        )}
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ring-1 ${state.className}`}>
          <StateIcon size={12} />
          {state.label}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onEdit(promotion)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" title="Sửa">
            <Edit3 size={16} />
          </button>
          <button type="button" disabled={deleting} onClick={() => onDelete(promotion)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-300" title="Xóa">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-500">
      {label}
    </span>
    {children}
  </label>
);

function resolvePromotionState(promotion: PromotionResponse) {
  const now = Date.now();
  const start = new Date(promotion.startDate).getTime();
  const end = new Date(promotion.endDate).getTime();
  const exhausted = promotion.usageLimit != null && promotion.usedCount >= promotion.usageLimit;

  if (!promotion.isActive) {
    return { key: 'INACTIVE', label: 'Đã tắt', icon: XCircle, className: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10' };
  }
  if (exhausted) {
    return { key: 'EXHAUSTED', label: 'Hết lượt', icon: AlertCircle, className: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20' };
  }
  if (start > now) {
    return { key: 'UPCOMING', label: 'Sắp diễn ra', icon: Clock, className: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20' };
  }
  if (end < now) {
    return { key: 'EXPIRED', label: 'Đã hết hạn', icon: XCircle, className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20' };
  }
  return { key: 'AVAILABLE', label: 'Đang áp dụng', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20' };
}

function buildPayload(form: PromotionFormState, isUpdate: boolean): PromotionRequest {
  return {
    code: isUpdate ? undefined : form.code.trim() || undefined,
    description: form.description.trim() || undefined,
    discountType: form.discountType,
    discountValue: toNumber(form.discountValue),
    maxDiscountAmount: form.discountType === 'FIXED' ? null : toOptionalNumber(form.maxDiscountAmount),
    minOrderValue: toOptionalNumber(form.minOrderValue) ?? 0,
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    usageLimit: toOptionalNumber(form.usageLimit),
    isActive: form.isActive,
  };
}

function validatePayload(payload: PromotionRequest): string {
  if (payload.discountValue == null || payload.discountValue < 0) {
    return 'Giá trị giảm giá không hợp lệ.';
  }
  if (payload.discountType === 'PERCENT' && payload.discountValue > 100) {
    return 'Giảm theo phần trăm không được vượt quá 100%.';
  }
  if (new Date(payload.endDate).getTime() <= new Date(payload.startDate).getTime()) {
    return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
  }
  if (payload.usageLimit != null && payload.usageLimit < 0) {
    return 'Giới hạn lượt dùng không hợp lệ.';
  }
  return '';
}

function toNumber(value: string): number {
  return Number(value || 0);
}

function toOptionalNumber(value: string): number | null {
  if (value == null || value.trim() === '') return null;
  return Number(value);
}

function toDateTimeLocal(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default AdminPromotionPage;
