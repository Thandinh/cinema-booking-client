import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Ticket,
} from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import type { Showtime } from '../../types/domain.types';
import { FALLBACK_POSTER } from '../../constants';
import { formatMoney, formatTime } from '../../utils/format';

type MovieScheduleGroup = {
  movieId: string;
  movieTitle: string;
  moviePosterUrl?: string;
  times: Showtime[];
};

const shortDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));

const groupByMovie = (showtimes: Showtime[]) =>
  showtimes.reduce<Record<string, MovieScheduleGroup>>((acc, showtime) => {
    const key = showtime.movieId;
    if (!acc[key]) {
      acc[key] = {
        movieId: showtime.movieId,
        movieTitle: showtime.movieTitle,
        moviePosterUrl: showtime.moviePosterUrl,
        times: [],
      };
    }
    acc[key].times.push(showtime);
    return acc;
  }, {});

const CinemaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState('');

  const { data: cinema, isLoading: loadingCinema, isError: cinemaError } = useQuery({
    queryKey: ['cinema', id],
    queryFn: () => cinemaApi.getById(id!).then(response => response.data.result),
    enabled: Boolean(id),
  });

  const { data: showtimePage, isLoading: loadingShowtimes, isError: showtimesError } = useQuery({
    queryKey: ['showtimes', 'cinema', id],
    queryFn: () =>
      cinemaApi
        .getShowtimes(id!, { size: 200, sort: 'startTime,asc' })
        .then(response => response.data.result),
    enabled: Boolean(id),
  });

  const sortedShowtimes = useMemo(
    () =>
      [...(showtimePage?.content ?? [])].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [showtimePage?.content]
  );

  const availableDates = useMemo(
    () => Array.from(new Set(sortedShowtimes.map(showtime => showtime.startTime.split('T')[0]))),
    [sortedShowtimes]
  );

  const activeDate = availableDates.includes(selectedDate)
    ? selectedDate
    : availableDates[0] ?? '';

  const movieGroups = useMemo(
    () =>
      Object.values(
        groupByMovie(
          sortedShowtimes.filter(showtime => !activeDate || showtime.startTime.startsWith(activeDate))
        )
      ).map(group => ({
        ...group,
        times: group.times.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
      })),
    [activeDate, sortedShowtimes]
  );

  if (loadingCinema) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin" size={18} />
          Đang tải rạp chiếu...
        </div>
      </div>
    );
  }

  if (cinemaError || !cinema) {
    return (
      <div className="page-container py-20 text-center">
        <AlertCircle className="mx-auto mb-4 text-slate-400" size={42} />
        <p className="text-lg font-black text-slate-950 dark:text-white">Không tìm thấy rạp</p>
        <Link to="/cinemas" className="btn-secondary mt-5">Quay lại danh sách rạp</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{cinema.name} - Lịch chiếu</title>
      </Helmet>

      <div className="page-container py-6">
        <Link
          to="/cinemas"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Rạp chiếu
        </Link>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Building2 size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
                  Rạp chiếu
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                  {cinema.name}
                </h1>
                <div className="mt-3 flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-neutral-300 sm:flex-row sm:flex-wrap">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={15} className="text-slate-400" />
                    {cinema.address || 'Chưa có địa chỉ'}
                  </span>
                  {cinema.city && (
                    <span className="inline-flex items-center gap-2">
                      <span className="hidden text-slate-300 sm:inline">/</span>
                      {cinema.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {cinema.latitude && cinema.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${cinema.latitude},${cinema.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary shrink-0"
              >
                <Navigation size={16} /> Chỉ đường
              </a>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
                Lịch chiếu
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                Phim đang chiếu tại rạp
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold cinema-muted">
              <Ticket size={16} />
              {sortedShowtimes.length} suất
            </div>
          </div>

          {loadingShowtimes && (
            <div className="space-y-3">
              {[1, 2, 3].map(item => (
                <div key={item} className="skeleton h-32" />
              ))}
            </div>
          )}

          {showtimesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
              <AlertCircle className="mx-auto mb-3 text-red-500" size={34} />
              <p className="font-black text-red-700 dark:text-red-300">Không thể tải lịch chiếu</p>
              <p className="mt-2 text-sm text-red-600/80 dark:text-red-300/80">Vui lòng thử lại sau.</p>
            </div>
          )}

          {!loadingShowtimes && !showtimesError && sortedShowtimes.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center dark:border-white/10 dark:bg-neutral-900">
              <CalendarDays className="mx-auto mb-3 text-slate-400" size={36} />
              <p className="font-black text-slate-950 dark:text-white">Rạp chưa có suất chiếu</p>
              <p className="mt-2 text-sm cinema-muted">Bạn có thể chọn rạp khác hoặc quay lại sau.</p>
            </div>
          )}

          {!loadingShowtimes && !showtimesError && sortedShowtimes.length > 0 && (
            <>
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {availableDates.map(date => {
                  const active = date === activeDate;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`shrink-0 rounded-lg px-4 py-2.5 text-left transition-colors ${
                        active
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="block text-sm font-black">{shortDate(date).split(' ')[0]}</span>
                      <span className="mt-0.5 block text-xs font-bold opacity-70">{shortDate(date).replace(shortDate(date).split(' ')[0], '').trim()}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {movieGroups.map(group => (
                  <article
                    key={group.movieId}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900"
                  >
                    <div className="grid gap-4 p-4 sm:grid-cols-[88px_1fr]">
                      <Link
                        to={`/movies/${group.movieId}`}
                        className="block w-22 overflow-hidden rounded-md bg-slate-200 dark:bg-neutral-800"
                      >
                        <img
                          src={group.moviePosterUrl || FALLBACK_POSTER}
                          alt={group.movieTitle}
                          className="aspect-[2/3] w-full object-cover"
                          onError={event => {
                            (event.target as HTMLImageElement).src = FALLBACK_POSTER;
                          }}
                          loading="lazy"
                        />
                      </Link>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <Link
                              to={`/movies/${group.movieId}`}
                              className="text-lg font-black tracking-tight text-slate-950 hover:text-slate-700 dark:text-white dark:hover:text-neutral-200"
                            >
                              {group.movieTitle}
                            </Link>
                            <p className="mt-1 text-sm font-semibold cinema-muted">
                              {group.times.length} suất ngày này
                            </p>
                          </div>

                          <Link
                            to={`/movies/${group.movieId}`}
                            className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
                          >
                            Xem phim <ChevronRight size={13} />
                          </Link>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {group.times.map(showtime => (
                            <Link
                              key={showtime.id}
                              to={`/seat-selection/${showtime.id}`}
                              className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-neutral-950 dark:hover:border-white/20 dark:hover:bg-white/5"
                            >
                              <span>
                                <span className="flex items-center gap-1.5 text-base font-black text-slate-950 dark:text-white">
                                  <Clock size={14} className="text-slate-400" />
                                  {formatTime(showtime.startTime)}
                                </span>
                                <span className="mt-0.5 block text-xs font-semibold cinema-muted">
                                  {showtime.roomName}
                                </span>
                              </span>
                              <span className="text-right">
                                <span className="block text-xs font-black text-slate-950 dark:text-white">
                                  {formatMoney(showtime.basePrice)}
                                </span>
                                <span className="mt-0.5 block text-[11px] font-bold text-slate-500 group-hover:text-slate-950 dark:text-neutral-500 dark:group-hover:text-white">
                                  Chọn ghế
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default CinemaDetailPage;
