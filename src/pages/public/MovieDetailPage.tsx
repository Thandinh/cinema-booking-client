import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Calendar, ChevronLeft, Clock, Globe, MapPin, Play, Star, Ticket } from 'lucide-react';
import { movieApi } from '../../api/movieApi';
import type { Showtime } from '../../types/domain.types';

const FALLBACK_POSTER = 'https://placehold.co/480x720/111827/fbbf24?text=CinemaBooking';

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const ShowtimeSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(item => (
      <div key={item} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10" />
    ))}
  </div>
);

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: movieData, isLoading: loadingMovie } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => movieApi.getById(id!).then(r => r.data.result),
    enabled: !!id,
  });

  const { data: showtimes, isLoading: loadingShowtimes } = useQuery({
    queryKey: ['showtimes', 'movie', id],
    queryFn: () => movieApi.getShowtimes(id!).then(r => r.data.result),
    enabled: !!id,
  });

  if (loadingMovie) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-8 md:grid-cols-[260px_1fr]">
          <div className="aspect-[2/3] rounded-3xl bg-slate-200 dark:bg-neutral-900" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-slate-200 dark:bg-neutral-900" />
            <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-neutral-900" />
            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-neutral-900" />
          </div>
        </div>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black">Không tìm thấy phim</p>
        <Link to="/" className="mt-4 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  const movie = movieData;
  const groupedShowtimes = (showtimes ?? []).reduce<Record<string, Showtime[]>>((acc, showtime) => {
    const key = showtime.cinemaName || 'Rạp chiếu';
    acc[key] = acc[key] ? [...acc[key], showtime] : [showtime];
    return acc;
  }, {});

  return (
    <>
      <Helmet>
        <title>{movie.title} - CinemaBooking</title>
        <meta name="description" content={movie.description?.slice(0, 160)} />
      </Helmet>

      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm dark:opacity-25"
          style={{ backgroundImage: `url(${movie.posterUrl || FALLBACK_POSTER})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-stone-50/95 to-stone-50 dark:from-neutral-950/80 dark:via-neutral-950/95 dark:to-neutral-950" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-300">
            <ChevronLeft size={17} />
            Quay lại danh sách phim
          </Link>

          <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-end">
            <div className="relative max-w-60">
              <div className="absolute -inset-3 rounded-[2rem] bg-amber-300/30 blur-xl dark:bg-amber-400/20" />
              <img
                src={movie.posterUrl || FALLBACK_POSTER}
                alt={movie.title}
                className="relative aspect-[2/3] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-white/20"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_POSTER;
                }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                {movie.ageRating && (
                  <span className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-black text-white">{movie.ageRating}</span>
                )}
                {movie.status === 'NOW_SHOWING' && (
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">Đang chiếu</span>
                )}
                {movie.status === 'COMING_SOON' && (
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">Sắp chiếu</span>
                )}
              </div>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
                {movie.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold cinema-muted">
                {movie.duration && <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-neutral-900/80 dark:ring-white/10"><Clock size={16} /> {movie.duration} phút</span>}
                {movie.releaseDate && <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-neutral-900/80 dark:ring-white/10"><Calendar size={16} /> {formatDate(movie.releaseDate)}</span>}
                {movie.language && <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-neutral-900/80 dark:ring-white/10"><Globe size={16} /> {movie.language}</span>}
                {movie.ratingImdb && <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 font-black text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20"><Star size={16} fill="currentColor" /> IMDb {movie.ratingImdb}/10</span>}
              </div>

              {movie.genre && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {movie.genre.split(',').map(genre => (
                    <span key={genre.trim()} className="rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              )}

              {movie.description && (
                <p className="mt-5 max-w-3xl text-sm leading-7 cinema-muted">{movie.description}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
                  >
                    <Play size={16} fill="currentColor" /> Xem trailer
                  </a>
                )}
                <a href="#showtimes" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-100">
                  <Ticket size={16} /> Chọn suất chiếu
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="showtimes" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Lịch chiếu</h2>
            <p className="mt-1 text-sm cinema-muted">Chọn rạp và giờ chiếu để tiếp tục đặt ghế.</p>
          </div>
        </div>

        {loadingShowtimes && <ShowtimeSkeleton />}

        {!loadingShowtimes && Object.keys(groupedShowtimes).length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
            <Calendar className="mx-auto text-slate-400" size={42} />
            <p className="mt-4 font-black">Hiện chưa có suất chiếu</p>
            <p className="mt-2 text-sm cinema-muted">Vui lòng quay lại sau hoặc chọn phim khác.</p>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(groupedShowtimes).map(([cinemaName, times]) => (
            <div key={cinemaName} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <p className="font-black text-slate-950 dark:text-white">{cinemaName}</p>
                    {times[0]?.cinemaAddress && <p className="mt-1 text-sm cinema-muted">{times[0].cinemaAddress}</p>}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {times.map(showtime => (
                  <Link
                    key={showtime.id}
                    to={`/seat-selection/${showtime.id}`}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-neutral-950 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl font-black text-slate-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
                        {formatTime(showtime.startTime)}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-white/10">
                        {showtime.roomName}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">
                      {(showtime.basePrice ?? 0).toLocaleString('vi-VN')}đ
                    </p>
                    <p className="mt-1 text-xs font-semibold cinema-muted">Chọn ghế và giữ vé</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default MovieDetailPage;
