import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ban, Calendar, Loader2, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { movieApi } from '../../api/movieApi';
import { cinemaApi } from '../../api/cinemaApi';
import { userApi } from '../../api/userApi';
import type { ApiResponse, PageResult } from '../../types/api.types';
import type { Cinema, Showtime, Movie } from '../../types/domain.types';
import { toast } from '../../components/ui/toastBus';
import { formatDateTime, formatMoney, formatTime } from '../../utils/format';

type ShowtimeAdminFilters = {
  fromDate?: string;
  toDate?: string;
  city?: string;
  cinemaId?: string;
  roomId?: string;
  status?: string;
  keyword?: string;
};

const showtimeAdminApi = {
  getAll: (params?: ShowtimeAdminFilters & { page?: number; size?: number; sort?: string }) =>
    axiosClient.get<ApiResponse<PageResult<Showtime>>>('/api/v1/showtimes', { params }),
  create: (data: Record<string, unknown>) =>
    axiosClient.post<ApiResponse<Showtime>>('/api/v1/showtimes', data),
  update: (id: string, data: Record<string, unknown>) =>
    axiosClient.put<ApiResponse<Showtime>>(`/api/v1/showtimes/${id}`, data),
  cancel: (id: string, reason: string) =>
    axiosClient.post<ApiResponse<Showtime>>(`/api/v1/showtimes/${id}/cancel`, { reason }),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/api/v1/showtimes/${id}`),
};

const roomApi = {
  getByCinema: (cinemaId: string) =>
    axiosClient.get<ApiResponse<{ id: string; name: string }[]>>(`/api/v1/rooms/cinema/${cinemaId}`),
};

const getRoleName = (role: unknown) => {
  if (typeof role === 'string') return role;
  if (role && typeof role === 'object' && 'name' in role) return String((role as { name?: unknown }).name ?? '');
  return '';
};

const hasRole = (roles: unknown[] | undefined, roleName: string) =>
  (roles ?? []).some(role => getRoleName(role).toUpperCase() === roleName);

const toDateTimeLocalValue = (date: Date) => {
  const localOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - localOffsetMs).toISOString().slice(0, 16);
};

const toDateInputValue = (date: Date) => {
  const localOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - localOffsetMs).toISOString().slice(0, 10);
};

const todayDateInput = () => toDateInputValue(new Date());

const plusDaysDateInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};

const showtimeSchema = z.object({
  movieId: z.string().min(1, 'Chọn phim'),
  city: z.string().min(1, 'Chọn thành phố'),
  cinemaId: z.string().min(1, 'Chọn rạp'),
  roomId: z.string().min(1, 'Chọn phòng'),
  startTime: z.string().min(1, 'Chọn giờ bắt đầu'),
  endTime: z.string().min(1, 'Chọn giờ kết thúc'),
  basePrice: z.coerce.number().min(1000, 'Giá phải lớn hơn 1.000đ'),
});
type ShowtimeFormData = z.infer<typeof showtimeSchema>;
type CancelTarget = Pick<Showtime, 'id' | 'movieTitle' | 'cinemaName' | 'roomName' | 'startTime'>;

const ShowtimeFormModal = ({
  isOpen, onClose, onSubmit, isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) => {
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ShowtimeFormData>({
    resolver: zodResolver(showtimeSchema) as any,
  });

  const selectedMovieId = watch('movieId');
  const selectedCity = watch('city');
  const selectedCinemaId = watch('cinemaId');
  const selectedStartTime = watch('startTime');

  const { data: moviesData } = useQuery({
    queryKey: ['modal-movies'],
    queryFn: () => movieApi.getAll({ status: 'NOW_SHOWING', size: 100 }).then(r => r.data.result.content),
    enabled: isOpen,
  });

  const currentUserQuery = useQuery({
    queryKey: ['staff-check-in-profile'],
    queryFn: () => userApi.getMyProfile().then(r => r.data.result),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const currentUser = currentUserQuery.data;
  const isAdminAccount = hasRole(currentUser?.roles as unknown[] | undefined, 'ADMIN');
  const isStaffAccount = hasRole(currentUser?.roles as unknown[] | undefined, 'STAFF');

  const { data: allCinemasData, isLoading: isLoadingAllCinemas } = useQuery({
    queryKey: ['modal-cinemas-admin-all'],
    queryFn: () => cinemaApi.getMapData().then(r => r.data.result),
    enabled: isOpen && isAdminAccount,
    staleTime: 5 * 60 * 1000,
  });

  const scopedCinemas = useMemo<Cinema[]>(
    () => (isAdminAccount ? allCinemasData ?? [] : currentUser?.assignedCinemas ?? []),
    [allCinemasData, currentUser?.assignedCinemas, isAdminAccount],
  );

  const isLoadingCinemas = currentUserQuery.isLoading || (isAdminAccount && isLoadingAllCinemas);
  const hasNoStaffCinema = !currentUserQuery.isLoading && isStaffAccount && !isAdminAccount && scopedCinemas.length === 0;

  const cities = useMemo(() => {
    const values = scopedCinemas
      .map(cinema => cinema.city?.trim())
      .filter((city): city is string => Boolean(city));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [scopedCinemas]);

  const filteredCinemas = useMemo(() => {
    if (!selectedCity) return [];
    return scopedCinemas
      .filter(cinema => cinema.city === selectedCity)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [scopedCinemas, selectedCity]);

  const selectedMovieDuration = useMemo(() => {
    return (moviesData as Movie[] | undefined)?.find(movie => movie.id === selectedMovieId)?.duration ?? 0;
  }, [moviesData, selectedMovieId]);

  const { data: roomsData } = useQuery({
    queryKey: ['modal-rooms', selectedCinemaId],
    queryFn: () => roomApi.getByCinema(selectedCinemaId).then(r => r.data.result),
    enabled: !!selectedCinemaId,
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen || selectedCity || cities.length !== 1) return;
    setValue('city', cities[0], { shouldValidate: true });
  }, [cities, isOpen, selectedCity, setValue]);

  useEffect(() => {
    setValue('cinemaId', '');
    setValue('roomId', '');
  }, [selectedCity, setValue]);

  useEffect(() => {
    setValue('roomId', '');
  }, [selectedCinemaId, setValue]);

  useEffect(() => {
    if (!selectedStartTime || !selectedMovieDuration) {
      setValue('endTime', '', { shouldValidate: true });
      return;
    }

    const startDate = new Date(selectedStartTime);
    if (Number.isNaN(startDate.getTime())) return;

    const endDate = new Date(startDate.getTime() + selectedMovieDuration * 60_000);
    setValue('endTime', toDateTimeLocalValue(endDate), { shouldValidate: true });
  }, [selectedMovieDuration, selectedStartTime, setValue]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: ShowtimeFormData) => {
    const { city: _city, cinemaId: _cinemaId, ...rest } = data;
    const startDate = new Date(rest.startTime);
    const endDate = new Date(rest.endTime);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu. Hãy chọn lại giờ bắt đầu.');
      return;
    }

    onSubmit({
      ...rest,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 fade-in-up dark:bg-neutral-900 dark:ring-white/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Tạo suất chiếu mới</h2>
            {isStaffAccount && !isAdminAccount && (
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                Nhân viên chỉ tạo được suất chiếu trong các rạp được admin phân công.
              </p>
            )}
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6">
          {hasNoStaffCinema && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              Tài khoản nhân viên này chưa được gán rạp phụ trách, nên chưa thể tạo suất chiếu. Vui lòng liên hệ admin để gán rạp trước.
            </div>
          )}

          <div>
            <label className="cinema-label mb-2 block">Phim *</label>
            <select {...register('movieId')} className="cinema-input">
              <option value="">-- Chọn phim --</option>
              {(moviesData as Movie[] | undefined)?.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            {errors.movieId && <p className="mt-1 text-xs text-red-500">{errors.movieId.message}</p>}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="cinema-label mb-2 block">Thành phố *</label>
              <select {...register('city')} className="cinema-input" disabled={isLoadingCinemas || hasNoStaffCinema || scopedCinemas.length === 0}>
                <option value="">{isLoadingCinemas ? 'Đang tải rạp...' : '-- Chọn thành phố --'}</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <label className="cinema-label mb-2 block">Rạp *</label>
              <select {...register('cinemaId')} className="cinema-input" disabled={!selectedCity || hasNoStaffCinema}>
                <option value="">-- Chọn rạp --</option>
                {filteredCinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.cinemaId && <p className="mt-1 text-xs text-red-500">{errors.cinemaId.message}</p>}
            </div>
            <div>
              <label className="cinema-label mb-2 block">Phòng chiếu *</label>
              <select {...register('roomId')} className="cinema-input" disabled={!selectedCinemaId || hasNoStaffCinema}>
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
              <input
                type="datetime-local"
                {...register('endTime')}
                className="cinema-input bg-slate-50 text-slate-700 dark:bg-neutral-950 dark:text-neutral-200"
                readOnly
                tabIndex={-1}
              />
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                Tự tính theo thời lượng phim{selectedMovieDuration ? ` (${selectedMovieDuration} phút)` : ''}.
              </p>
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
            <button type="submit" disabled={isSubmitting || hasNoStaffCinema || isLoadingCinemas} className="btn-primary disabled:opacity-60">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Tạo suất chiếu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShowtimeCancelModal = ({
  showtime, onClose, onConfirm, isSubmitting,
}: {
  showtime: CancelTarget | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [showtime?.id]);

  if (!showtime) return null;

  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length > 0 && trimmedReason.length <= 500;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/10">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Hủy suất chiếu</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-neutral-400">
              Vé đã thanh toán sẽ được ghi nhận cần hoàn tiền thủ công và gửi email thông báo cho khách.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-neutral-950">
            <p className="font-black text-slate-950 dark:text-white">{showtime.movieTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-neutral-300">
              {showtime.cinemaName} - {showtime.roomName}
            </p>
            <p className="mt-1 text-sm cinema-muted">{formatDateTime(showtime.startTime)}</p>
          </div>

          <div>
            <label className="cinema-label mb-2 block">Lý do hủy *</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={500}
              className="cinema-input min-h-28 resize-y"
              placeholder="Ví dụ: Rạp bảo trì phòng chiếu, suất chiếu được hủy và khách sẽ được hỗ trợ hoàn tiền."
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold">
              <span className={trimmedReason ? 'text-slate-500 dark:text-neutral-400' : 'text-red-500'}>
                Lý do sẽ hiển thị trong email gửi cho khách.
              </span>
              <span className="text-slate-400">{reason.length}/500</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5 dark:border-white/10">
          <button type="button" onClick={onClose} className="btn-ghost">Đóng</button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onConfirm(trimmedReason)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            Xác nhận hủy suất
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminShowtimePage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [fromDate, setFromDate] = useState(() => todayDateInput());
  const [toDate, setToDate] = useState(() => plusDaysDateInput(7));
  const [city, setCity] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const currentUserQuery = useQuery({
    queryKey: ['admin-showtime-profile'],
    queryFn: () => userApi.getMyProfile().then(r => r.data.result),
    staleTime: 60_000,
  });

  const currentUser = currentUserQuery.data;
  const isAdminAccount = hasRole(currentUser?.roles as unknown[] | undefined, 'ADMIN');

  const { data: allCinemasData, isLoading: isLoadingAllCinemas } = useQuery({
    queryKey: ['admin-showtime-cinemas-filter'],
    queryFn: () => cinemaApi.getMapData().then(r => r.data.result),
    enabled: isAdminAccount,
    staleTime: 5 * 60 * 1000,
  });

  const scopedCinemas = useMemo<Cinema[]>(
    () => (isAdminAccount ? allCinemasData ?? [] : currentUser?.assignedCinemas ?? []),
    [allCinemasData, currentUser?.assignedCinemas, isAdminAccount],
  );

  const cities = useMemo(() => {
    const values = scopedCinemas
      .map(cinema => cinema.city?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [scopedCinemas]);

  const filterCinemas = useMemo(() => {
    const source = city ? scopedCinemas.filter(cinema => cinema.city === city) : scopedCinemas;
    return [...source].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [city, scopedCinemas]);

  const { data: filterRoomsData } = useQuery({
    queryKey: ['admin-showtime-filter-rooms', cinemaId],
    queryFn: () => roomApi.getByCinema(cinemaId).then(r => r.data.result),
    enabled: Boolean(cinemaId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(keywordInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    setPage(0);
  }, [fromDate, toDate, city, cinemaId, roomId, status, keyword]);

  useEffect(() => {
    setCinemaId('');
    setRoomId('');
  }, [city]);

  useEffect(() => {
    setRoomId('');
  }, [cinemaId]);

  const filterParams = useMemo<ShowtimeAdminFilters>(() => ({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    city: city || undefined,
    cinemaId: cinemaId || undefined,
    roomId: roomId || undefined,
    status: status || undefined,
    keyword: keyword || undefined,
  }), [cinemaId, city, fromDate, keyword, roomId, status, toDate]);

  const activeFilterCount = useMemo(
    () => Object.values(filterParams).filter(Boolean).length,
    [filterParams],
  );

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setCity('');
    setCinemaId('');
    setRoomId('');
    setStatus('');
    setKeywordInput('');
    setKeyword('');
    setPage(0);
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-showtimes', page, filterParams],
    queryFn: () => showtimeAdminApi.getAll({ ...filterParams, page, size: 15, sort: 'startTime,asc' }).then(r => r.data.result),
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => showtimeAdminApi.create(data),
    onSuccess: () => {
      toast.success('Đã tạo suất chiếu');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assigned-cinema-open-showtimes'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi khi tạo suất chiếu'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => showtimeAdminApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa suất chiếu');
      queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assigned-cinema-open-showtimes'] });
    },
    onError: () => toast.error('Không thể xóa, suất chiếu có thể đã có người đặt vé'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => showtimeAdminApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Đã hủy suất chiếu và ghi nhận các đơn cần xử lý');
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assigned-cinema-open-showtimes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (e: any) => {
      const message = String(e?.response?.data?.message ?? '');
      if (message.includes('checked-in')) {
        toast.error('Suất chiếu đã có vé check-in, cần xử lý sự cố thủ công.');
        return;
      }
      if (message.includes('Only upcoming or ongoing')) {
        toast.error('Chỉ có thể hủy suất sắp chiếu hoặc đang chiếu.');
        return;
      }
      toast.error(message || 'Không thể hủy suất chiếu. Vui lòng thử lại.');
    },
  });

  const showtimes: Showtime[] = (data as any)?.content ?? [];

  const statusBadge = (s: string) => {
    const baseClass = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1';
    if (s === 'UPCOMING') {
      return (
        <span className={`${baseClass} bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-400/25`}>
          Sắp chiếu
        </span>
      );
    }
    if (s === 'ONGOING') {
      return (
        <span className={`${baseClass} bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/25`}>
          Đang chiếu
        </span>
      );
    }
    if (s === 'ENDED') {
      return (
        <span className={`${baseClass} bg-slate-100 text-slate-700 ring-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-white/15`}>
          Đã kết thúc
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className={`${baseClass} bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400/25`}>
          Đã hủy
        </span>
      );
    }
    return <span className={`${baseClass} bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/25`}>{s}</span>;
  };

  return (
    <>
      <Helmet><title>Quản lý suất chiếu | cinemabooking.vn</title></Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý suất chiếu</h1>
            <p className="mt-1 text-sm cinema-muted">Lên lịch và quản lý các suất chiếu phim.</p>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Tạo suất chiếu
          </button>
        </div>

        <div className="cinema-card mb-5 p-4">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-400">
                Bộ lọc suất chiếu
              </h2>
              <p className="mt-1 text-xs font-semibold cinema-muted">
                Lọc theo ngày, rạp, phòng, trạng thái hoặc tên phim để vận hành nhanh hơn.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setFromDate(todayDateInput());
                  setToDate(todayDateInput());
                }}
                className="btn-ghost !h-9 !px-3 !text-xs"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromDate(todayDateInput());
                  setToDate(plusDaysDateInput(7));
                }}
                className="btn-ghost !h-9 !px-3 !text-xs"
              >
                7 ngày tới
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-secondary !h-9 !px-3 !text-xs"
              >
                <RotateCcw size={13} />
                Đặt lại{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.1fr_1.1fr_1fr_1.3fr_1.3fr_1.2fr_1.6fr]">
            <div>
              <label className="cinema-label mb-2 block">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="cinema-input"
              />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="cinema-input"
              />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Trạng thái</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="cinema-input">
                <option value="">Tất cả</option>
                <option value="UPCOMING">Sắp chiếu</option>
                <option value="ONGOING">Đang chiếu</option>
                <option value="ENDED">Đã kết thúc</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="cinema-label mb-2 block">Thành phố</label>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="cinema-input"
                disabled={currentUserQuery.isLoading || (isAdminAccount && isLoadingAllCinemas)}
              >
                <option value="">Tất cả thành phố</option>
                {cities.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="cinema-label mb-2 block">Rạp</label>
              <select
                value={cinemaId}
                onChange={(event) => setCinemaId(event.target.value)}
                className="cinema-input"
                disabled={currentUserQuery.isLoading || filterCinemas.length === 0}
              >
                <option value="">Tất cả rạp</option>
                {filterCinemas.map(cinema => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
              </select>
            </div>
            <div>
              <label className="cinema-label mb-2 block">Phòng</label>
              <select
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                className="cinema-input"
                disabled={!cinemaId}
              >
                <option value="">Tất cả phòng</option>
                {(filterRoomsData ?? []).map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
              </select>
            </div>
            <div>
              <label className="cinema-label mb-2 block">Tìm phim</label>
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  className="cinema-input pl-9"
                  placeholder="Nhập tên phim..."
                />
              </div>
            </div>
          </div>
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
                  <th className="px-6 py-4 text-right">Thao tác</th>
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
                    <td className="max-w-[200px] px-6 py-4 font-black text-slate-950 dark:text-white">
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
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {(st.status === 'UPCOMING' || st.status === 'ONGOING') && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget({
                              id: st.id,
                              movieTitle: st.movieTitle,
                              cinemaName: st.cinemaName,
                              roomName: st.roomName,
                              startTime: st.startTime,
                            })}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-black text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                          >
                            <Ban size={14} />
                            Hủy suất
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { if (window.confirm('Xóa suất chiếu này? Chỉ dùng khi suất chưa có đơn đặt vé.')) deleteMutation.mutate(st.id); }}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          title="Xóa dữ liệu suất chiếu chưa phát sinh booking"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

      <ShowtimeCancelModal
        showtime={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={(reason) => {
          if (!cancelTarget) return;
          cancelMutation.mutate({ id: cancelTarget.id, reason });
        }}
        isSubmitting={cancelMutation.isPending}
      />
    </>
  );
};

export default AdminShowtimePage;
