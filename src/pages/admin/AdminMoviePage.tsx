import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Edit2, Film, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { movieApi } from '../../api/movieApi';
import type { Movie } from '../../types/domain.types';
import { toast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/format';
import MovieFormModal from './MovieFormModal';

const AdminMoviePage = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-movies', keyword, page],
    queryFn: () => movieApi.getAll({ keyword, page, size: 10 }).then(r => r.data.result),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => movieApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa phim thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
    },
    onError: () => toast.error('Không thể xóa phim, có thể phim đã có suất chiếu'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Movie>) => movieApi.create(data),
    onSuccess: () => {
      toast.success('Đã thêm phim mới thành công');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
    },
    onError: () => toast.error('Lỗi khi thêm phim'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Movie> }) => movieApi.update(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật phim thành công');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật phim'),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa phim này? Hành động không thể hoàn tác.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAdd = () => {
    setSelectedMovie(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData: Partial<Movie>) => {
    if (selectedMovie) {
      updateMutation.mutate({ id: selectedMovie.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <>
      <Helmet>
        <title>Quản lý Phim — Admin Portal</title>
      </Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý Phim</h1>
            <p className="mt-1 text-sm cinema-muted">Quản lý danh sách phim, thêm mới, sửa và xóa.</p>
          </div>
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Thêm phim mới
          </button>
        </div>

        <div className="cinema-card mb-6 p-4">
          <div className="flex max-w-sm items-center gap-2 rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên phim..."
              className="h-10 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none dark:text-white placeholder:text-slate-400"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>

        <div className="cinema-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-400">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Phim</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Khởi chiếu</th>
                  <th className="px-6 py-4">Đánh giá</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <Loader2 size={24} className="mx-auto animate-spin text-amber-500" />
                    </td>
                  </tr>
                ) : data?.content?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center font-semibold">
                      Không tìm thấy phim nào.
                    </td>
                  </tr>
                ) : (
                  data?.content?.map((movie: Movie) => (
                    <tr key={movie.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt={movie.title} className="h-12 w-9 rounded-md object-cover" />
                          ) : (
                            <div className="grid h-12 w-9 place-items-center rounded-md bg-slate-100 dark:bg-neutral-800">
                              <Film size={16} className="text-slate-400" />
                            </div>
                          )}
                          <div className="font-black text-slate-950 dark:text-white">{movie.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {movie.status === 'NOW_SHOWING' && <span className="badge-success">Đang chiếu</span>}
                        {movie.status === 'COMING_SOON' && <span className="badge-warning">Sắp chiếu</span>}
                        {movie.status === 'ENDED' && <span className="badge-neutral">Đã chiếu</span>}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {movie.releaseDate ? formatDate(movie.releaseDate) : '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">
                        {movie.ratingImdb ? `IMDb ${movie.ratingImdb}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(movie)}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data?.totalPages && data.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">
                Trang {page + 1} / {data.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <MovieFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialData={selectedMovie}
      />
    </>
  );
};

export default AdminMoviePage;
