import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Loader2, Plus, Trash2, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { movieApi } from '../../api/movieApi';
import { cinemaApi } from '../../api/cinemaApi';
import type { ApiResponse, PageResult } from '../../types/api.types';
import type { Showtime, Movie } from '../../types/domain.types';
import { toast } from '../../components/ui/Toast';
import { formatDateTime, formatMoney, formatTime } from '../../utils/format';

// ─── API ──────────────────────────────────────────────────
const showtimeAdminApi = {
  getAll: (params?: { page?: number; size?: number; sort?: string }) =>
    axiosClient.get<ApiResponse<PageResult<Showtime>>>('/api/v1/showtimes', { params }),
  create: (data: Record<string, unknown>) =>
    axiosClient.post<ApiResponse<Showtime>>('/api/v1/showtimes', data),
  update: (id: string, data: Record<string, unknown>) =>
    axiosClient.put<ApiResponse<Showtime>>(`/api/v1/showtimes/${id}`, data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/api/v1/showtimes/${id}`),
};

// ─── Helper: fetch rooms by cinema ────────────────────────
const roomApi = {
  getByCinema: (cinemaId: string) =>
    axiosClient.get<ApiResponse<{ id: string; name: string }[]>>(`/api/v1/rooms/cinema/${cinemaId}`),
};

// ─── Schema ──────────────────────────────────────────────
const showtimeSchema = z.object({
  movieId: z.string().min(1, 'Chọn phim'),
  cinemaId: z.string().min(1, 'Chọn rạp'),
  roomId: z.string().min(1, 'Chọn phòng'),
  startTime: z.string().min(1, 'Chọn giờ bắt đầu'),
  endTime: z.string().min(1, 'Chọn giờ kết thúc'),
  basePrice: z.coerce.number().min(1000, 'Giá phải lớn hơn 1.000đ'),
});
type ShowtimeFormData = z.infer<typeof showtimeSchema>;

// ─── Modal ────────────────────────────────────────────────
const ShowtimeFormModal = ({
  isOpen, onClose, onSubmit, isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ShowtimeFormData>({
    resolver: zodResolver(showtimeSchema) as any,
  });

  const selectedCinemaId = watch('cinemaId');

  // Fetch data for selects
  const { data: moviesData } = useQuery({
    queryKey: ['modal-movies'],
    queryFn: () => movieApi.getAll({ status: 'NOW_SHOWING', size: 100 }).then(r => r.data.result.content),
    enabled: isOpen,
  });

  const { data: cinemasData } = useQuery({
    queryKey: ['modal-cinemas'],
    queryFn: () => cinemaApi.getMapData().then(r => r.data.result),
    enabled: isOpen,
  });

  const { data: roomsData } = useQuery({
    queryKey: ['modal-rooms', selectedCinemaId],
    queryFn: () => roomApi.getByCinema(selectedCinemaId).then(r => r.data.result),
    enabled: !!selectedCinemaId,
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: ShowtimeFormData) => {
    const { cinemaId: _, ...rest } = data;
    onSubmit({
      ...rest,
      startTime: new Date(rest.startTime).toISOString(),
      endTime: new Date(rest.endTime).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 fade-in-up max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Tạo suất chiếu mới</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6">
          <div>
            <label className="cinema-label mb-2 block">Phim *</label>
            <select {...register('movieId')} className="cinema-input">
              <option value="">-- Chọn phim --</option>
              {(moviesData as Movie[] | undefined)?.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            {errors.movieId && <p className="mt-1 text-xs text-red-500">{errors.movieId.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Rạp *</label>
              <select {...register('cinemaId')} className="cinema-input">
                <option value="">-- Chọn rạp --</option>
                {cinemasData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.cinemaId && <p className="mt-1 text-xs text-red-500">{errors.cinemaId.message}</p>}
            </div>
            <div>
              <label className="cinema-label mb-2 block">Phòng chiếu *</label>
              <select {...register('roomId')} className="cinema-input" disabled={!selectedCinemaId}>
                <option value="">-- Chọn phòng --</option>
                {(roomsData as { id: string; name: string }[] | undefined)?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.roomId && <p className="mt-1 text-xs text-red-500">{errors.roomId.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Giờ bắt đầu *</label>
              <input type="datetime-local" {...register('startTime')} className="cinema-input" />
              {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="cinema-label mb-2 block">Giờ kết thúc *</label>
              <input type="datetime-local" {...register('endTime')} className="cinema-input" />
              {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>}
            </div>
          </div>

          <div>
            <label className="cinema-label mb-2 block">Giá vé cơ bản (VNĐ) *</label>
            <input type="number" step="1000" {...register('basePrice')} className="cinema-input" placeholder="90000" />
            {errors.basePrice && <p className="mt-1 text-xs text-red-500">{errors.basePrice.message}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-white/10">
            <button type="button" onClick={onClose} className="btn-ghost">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Tạo suất chiếu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────
const AdminShowtimePage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-showtimes', page],
    queryFn: () => showtimeAdminApi.getAll({ page, size: 15, sort: 'startTime,asc' }).then(r => r.data.result),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => showtimeAdminApi.create(data),
    onSuccess: () => { toast.success('Đã tạo suất chiếu'); setIsModalOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi khi tạo suất chiếu'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => showtimeAdminApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa suất chiếu'); queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] }); },
    onError: () => toast.error('Không thể xóa, suất chiếu có thể đã có người đặt vé'),
  });

  const showtimes: Showtime[] = (data as any)?.content ?? [];

  const statusBadge = (s: string) => {
    if (s === 'UPCOMING') return <span className="badge-brand">Sắp chiếu</span>;
    if (s === 'ONGOING')  return <span className="badge-success">Đang chiếu</span>;
    if (s === 'ENDED')    return <span className="badge-neutral">Đã kết thúc</span>;
    return <span className="badge-warning">{s}</span>;
  };

  return (
    <>
      <Helmet><title>Quản lý Suất chiếu — Admin Portal</title></Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý Suất chiếu</h1>
            <p className="mt-1 text-sm cinema-muted">Lên lịch và quản lý các suất chiếu phim.</p>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Tạo suất chiếu
          </button>
        </div>

        <div className="cinema-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Phim</th>
                  <th className="px-6 py-4">Rạp / Phòng</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Giá vé</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 size={24} className="mx-auto animate-spin text-amber-500" /></td></tr>
                ) : isError ? (
                  <tr><td colSpan={6} className="py-10 text-center font-semibold text-red-500">
                    Không thể tải danh sách suất chiếu.
                    <p className="mt-1 text-xs text-slate-500 dark:text-neutral-500">
                      {(error as any)?.response?.data?.message || 'Vui lòng kiểm tra backend và thử tải lại trang.'}
                    </p>
                  </td></tr>
                ) : showtimes.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center font-semibold text-slate-500">
                    <Calendar className="mx-auto mb-2 text-slate-300" size={32} />
                    Chưa có suất chiếu nào.
                  </td></tr>
                ) : showtimes.map((st) => (
                  <tr key={st.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 font-black text-slate-950 dark:text-white max-w-[200px]">
                      <p className="line-clamp-1">{st.movieTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700 dark:text-neutral-300">{st.cinemaName}</p>
                      <p className="mt-0.5 text-xs cinema-muted">{st.roomName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700 dark:text-neutral-300">{formatDateTime(st.startTime)}</p>
                      <p className="mt-0.5 text-xs cinema-muted">→ {formatTime(st.endTime)}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">
                      {formatMoney(st.basePrice ?? 0)}
                    </td>
                    <td className="px-6 py-4">{statusBadge(st.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { if (window.confirm('Xóa suất chiếu này?')) deleteMutation.mutate(st.id); }}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data as any)?.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">Trang {page + 1} / {(data as any).totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">Trước</button>
                <button disabled={page >= (data as any).totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShowtimeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(d) => createMutation.mutate(d)}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
};

export default AdminShowtimePage;
