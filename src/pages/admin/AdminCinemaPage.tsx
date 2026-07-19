import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Edit2, Loader2, MapPin, Plus, Search, Trash2, X } from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import type { Cinema } from '../../types/domain.types';
import { toast } from '../../components/ui/Toast';

// ─── Schema ──────────────────────────────────────────────
const cinemaSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên rạp'),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
});
type CinemaFormData = z.infer<typeof cinemaSchema>;

// ─── Modal ────────────────────────────────────────────────
const CinemaFormModal = ({
  isOpen, onClose, onSubmit, isSubmitting, initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Cinema>) => void;
  isSubmitting: boolean;
  initialData: Cinema | null;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CinemaFormData>({
    resolver: zodResolver(cinemaSchema) as any,
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData ? { ...initialData } : { isActive: true });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 fade-in-up">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            {initialData ? 'Sửa thông tin rạp' : 'Thêm rạp mới'}
          </h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div>
            <label className="cinema-label mb-2 block">Tên rạp *</label>
            <input {...register('name')} className="cinema-input" placeholder="CGV Vincom..." />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="cinema-label mb-2 block">Địa chỉ</label>
            <input {...register('address')} className="cinema-input" placeholder="Số 123, Đường ABC..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Thành phố</label>
              <input {...register('city')} className="cinema-input" placeholder="Hà Nội, TP.HCM..." />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Trạng thái</label>
              <select {...register('isActive', { setValueAs: (v) => v === 'true' || v === true })} className="cinema-input">
                <option value="true">Đang hoạt động</option>
                <option value="false">Tạm ngừng</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Vĩ độ (Latitude)</label>
              <input type="number" step="any" {...register('latitude')} className="cinema-input" placeholder="10.7769..." />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Kinh độ (Longitude)</label>
              <input type="number" step="any" {...register('longitude')} className="cinema-input" placeholder="106.7009..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-white/10">
            <button type="button" onClick={onClose} className="btn-ghost">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {initialData ? 'Lưu thay đổi' : 'Thêm rạp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────
const AdminCinemaPage = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cinemas', keyword, page],
    queryFn: () => cinemaApi.getAll({ keyword, page, size: 10 }).then(r => r.data.result),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Cinema>) => cinemaApi.create(data),
    onSuccess: () => { toast.success('Đã thêm rạp mới'); setIsModalOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-cinemas'] }); },
    onError: () => toast.error('Lỗi khi thêm rạp'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cinema> }) => cinemaApi.update(id, data),
    onSuccess: () => { toast.success('Đã cập nhật rạp'); setIsModalOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-cinemas'] }); },
    onError: () => toast.error('Lỗi khi cập nhật rạp'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cinemaApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa rạp'); queryClient.invalidateQueries({ queryKey: ['admin-cinemas'] }); },
    onError: () => toast.error('Không thể xóa rạp, rạp có thể đang có suất chiếu'),
  });

  const handleSubmit = (formData: Partial<Cinema>) => {
    if (selectedCinema) {
      updateMutation.mutate({ id: selectedCinema.id, data: formData });
      return;
    }

    createMutation.mutate(formData);
  };

  const cinemas: Cinema[] = data?.content ?? [];

  return (
    <>
      <Helmet><title>Quản lý Rạp — Admin Portal</title></Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý Rạp chiếu</h1>
            <p className="mt-1 text-sm cinema-muted">Thêm, sửa, xóa và quản lý trạng thái các rạp.</p>
          </div>
          <button className="btn-primary" onClick={() => { setSelectedCinema(null); setIsModalOpen(true); }}>
            <Plus size={16} /> Thêm rạp mới
          </button>
        </div>

        <div className="cinema-card mb-6 p-4">
          <div className="flex max-w-sm items-center gap-2 rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Tìm tên rạp..." value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(0); }}
              className="h-10 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none dark:text-white placeholder:text-slate-400" />
          </div>
        </div>

        <div className="cinema-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Tên rạp</th>
                  <th className="px-6 py-4">Thành phố</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-10 text-center"><Loader2 size={24} className="mx-auto animate-spin text-amber-500" /></td></tr>
                ) : cinemas.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center font-semibold text-slate-500">Không tìm thấy rạp nào.</td></tr>
                ) : cinemas.map((cinema) => (
                  <tr key={cinema.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-950 dark:text-white">{cinema.name}</p>
                          {cinema.address && <p className="mt-0.5 text-xs cinema-muted line-clamp-1">{cinema.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-neutral-400">
                        <MapPin size={13} />
                        {cinema.city || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cinema.isActive
                        ? <span className="badge-success">Hoạt động</span>
                        : <span className="badge-neutral">Tạm ngừng</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedCinema(cinema); setIsModalOpen(true); }}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => { if (window.confirm('Xóa rạp này?')) deleteMutation.mutate(cinema.id); }}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">Trang {page + 1} / {data?.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">Trước</button>
                <button disabled={page >= (data?.totalPages ?? 1) - 1} onClick={() => setPage(p => p + 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CinemaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialData={selectedCinema}
      />
    </>
  );
};

export default AdminCinemaPage;
