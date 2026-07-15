import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X } from 'lucide-react';
import type { Movie } from '../../types/domain.types';

// ── Validation schema ──────────────────────────────────────
// Backend MovieCreationRequest yêu cầu: title, duration (NotNull), releaseDate (NotNull), status (NotNull)
// Backend MovieUpdateRequest: tất cả optional
const movieSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tên phim'),
  description: z.string().optional(),
  // duration bắt buộc khi tạo mới, optional khi sửa — xử lý ở handleSubmit
  duration: z.coerce.number().min(1, 'Thời lượng phải > 0').optional(),
  genre: z.string().optional(),
  // input[type=date] trả về "YYYY-MM-DD" — đúng định dạng LocalDate của backend
  releaseDate: z.string().optional(),
  posterUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  status: z.enum(['NOW_SHOWING', 'COMING_SOON', 'ENDED']),
  director: z.string().optional(),
  actors: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  ageRating: z.string().optional(),
  ratingImdb: z.coerce.number().min(0).max(10).optional(),
});

type MovieFormData = z.infer<typeof movieSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Nhận dữ liệu đã được clean — sẵn sàng gửi lên backend */
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
  initialData?: Movie | null;
}

// ── Helpers ────────────────────────────────────────────────
/** Xóa các field rỗng khỏi object trước khi gửi lên backend */
function cleanPayload(data: MovieFormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === null || value === undefined) continue;
    result[key] = value;
  }
  return result;
}

const MovieFormModal = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }: Props) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema) as any,
    defaultValues: { status: 'COMING_SOON' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Backend trả releaseDate dạng "2024-05-01" hoặc "2024-05-01T00:00:00"
        // input[type=date] cần "YYYY-MM-DD"
        const formattedDate = initialData.releaseDate
          ? initialData.releaseDate.toString().split('T')[0]
          : '';
        reset({
          ...initialData,
          releaseDate: formattedDate,
          ratingImdb: initialData.ratingImdb ?? undefined,
          duration: initialData.duration ?? undefined,
        });
      } else {
        reset({ status: 'COMING_SOON' });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: MovieFormData) => {
    onSubmit(cleanPayload(data));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm dark:bg-neutral-950/80" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 fade-in-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/90">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            {initialData ? 'Sửa thông tin phim' : 'Thêm phim mới'}
          </h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* Row 1: Tên + Trạng thái */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Tên phim *</label>
              <input {...register('title')} className="cinema-input" placeholder="Nhập tên phim..." />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <label className="cinema-label mb-2 block">Trạng thái *</label>
              <select {...register('status')} className="cinema-input">
                <option value="COMING_SOON">Sắp chiếu</option>
                <option value="NOW_SHOWING">Đang chiếu</option>
                <option value="ENDED">Đã kết thúc</option>
              </select>
            </div>
          </div>

          {/* Row 2: Thời lượng + Ngày chiếu + Phân loại */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="cinema-label mb-2 block">
                Thời lượng (phút){!initialData && ' *'}
              </label>
              <input
                type="number"
                min={1}
                {...register('duration')}
                className="cinema-input"
                placeholder="120"
              />
              {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="cinema-label mb-2 block">
                Ngày khởi chiếu{!initialData && ' *'}
              </label>
              {/* input type="date" → trả về "YYYY-MM-DD" khớp với LocalDate backend */}
              <input type="date" {...register('releaseDate')} className="cinema-input" />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Phân loại tuổi</label>
              <input {...register('ageRating')} className="cinema-input" placeholder="T18, P, K..." />
            </div>
          </div>

          {/* Row 3: Thể loại + IMDb */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Thể loại</label>
              <input {...register('genre')} className="cinema-input" placeholder="Hành động, Hài, Kinh dị..." />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Điểm IMDb (0–10)</label>
              <input type="number" step="0.1" min={0} max={10} {...register('ratingImdb')} className="cinema-input" />
              {errors.ratingImdb && <p className="mt-1 text-xs text-red-500">{errors.ratingImdb.message}</p>}
            </div>
          </div>

          {/* Row 4: Đạo diễn + Quốc gia */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Đạo diễn</label>
              <input {...register('director')} className="cinema-input" />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Quốc gia</label>
              <input {...register('country')} className="cinema-input" />
            </div>
          </div>

          {/* Diễn viên */}
          <div>
            <label className="cinema-label mb-2 block">Diễn viên</label>
            <input {...register('actors')} className="cinema-input" placeholder="Tên diễn viên, ngăn cách bằng dấu phẩy..." />
          </div>

          {/* Row 5: Poster + Trailer */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cinema-label mb-2 block">Link ảnh Poster</label>
              <input {...register('posterUrl')} className="cinema-input" placeholder="https://..." />
            </div>
            <div>
              <label className="cinema-label mb-2 block">Link Trailer (YouTube)</label>
              <input {...register('trailerUrl')} className="cinema-input" placeholder="https://youtube.com/..." />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="cinema-label mb-2 block">Mô tả nội dung</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-950 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-200/60 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-600 dark:focus:bg-neutral-900 dark:focus:ring-amber-400/10 resize-none"
              placeholder="Nhập tóm tắt nội dung phim..."
            />
          </div>

          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3 dark:border-white/10">
            <button type="button" onClick={onClose} className="btn-ghost">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {initialData ? 'Lưu thay đổi' : 'Thêm phim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovieFormModal;
