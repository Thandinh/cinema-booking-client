import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  MessageSquare,
  Play,
  Star,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import { movieApi } from '../../api/movieApi';
import type { Showtime } from '../../types/domain.types';
import { formatDate, formatMoney, formatTime } from '../../utils/format';
import { FALLBACK_POSTER } from '../../constants';

type TabType = 'SHOWTIMES' | 'INFO' | 'REVIEWS';

const CITY_STORAGE_KEY = 'cinema:selectedCity';
const FALLBACK_CITY = 'Khu vực khác';
const DEFAULT_CITY = 'TP Hồ Chí Minh';

const getShowtimeCity = (showtime: Showtime) => showtime.cinemaCity?.trim() || FALLBACK_CITY;

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('SHOWTIMES');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCity, setSelectedCity] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem(CITY_STORAGE_KEY) ?? ''
  );

  const { data: movie, isLoading: loadingMovie } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => movieApi.getById(id!).then(response => response.data.result),
    enabled: Boolean(id),
  });

  const { data: showtimes, isLoading: loadingShowtimes } = useQuery({
    queryKey: ['showtimes', 'movie', id],
    queryFn: () => movieApi.getShowtimes(id!).then(response => response.data.result),
    enabled: Boolean(id),
  });

  const { data: cinemas, isLoading: loadingCinemas } = useQuery({
    queryKey: ['cinemas', 'map'],
    queryFn: () => cinemaApi.getMapData().then(response => response.data.result),
    staleTime: 5 * 60 * 1000,
  });

  const cinemaById = useMemo(
    () => new Map((cinemas ?? []).map(cinema => [cinema.id, cinema])),
    [cinemas]
  );

  const enrichedShowtimes = useMemo(
    () =>
      (showtimes ?? []).map(showtime => {
        const cinema = cinemaById.get(showtime.cinemaId);
        return {
          ...showtime,
          cinemaAddress: showtime.cinemaAddress || cinema?.address,
          cinemaCity: showtime.cinemaCity || cinema?.city,
        };
      }),
    [cinemaById, showtimes]
  );

  const sortedShowtimes = useMemo(
    () =>
      [...enrichedShowtimes].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [enrichedShowtimes]
  );

  const cityOptions = useMemo(() => {
    const counts = sortedShowtimes.reduce<Record<string, number>>((acc, showtime) => {
      const city = getShowtimeCity(showtime);
      acc[city] = (acc[city] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort(([cityA, countA], [cityB, countB]) => {
        if (cityA === DEFAULT_CITY) return -1;
        if (cityB === DEFAULT_CITY) return 1;
        return countB - countA || cityA.localeCompare(cityB, 'vi');
      })
      .map(([city]) => city);
  }, [sortedShowtimes]);

  const activeCity = cityOptions.includes(selectedCity)
    ? selectedCity
    : cityOptions.includes(DEFAULT_CITY)
      ? DEFAULT_CITY
      : cityOptions[0] ?? '';

  const cityFilteredShowtimes = useMemo(
    () => sortedShowtimes.filter(showtime => !activeCity || getShowtimeCity(showtime) === activeCity),
    [activeCity, sortedShowtimes]
  );

  const availableDates = useMemo(
    () => Array.from(new Set(cityFilteredShowtimes.map(showtime => showtime.startTime.split('T')[0]))),
    [cityFilteredShowtimes]
  );

  const activeDate = availableDates.includes(selectedDate)
    ? selectedDate
    : availableDates[0] ?? '';

  const groupedShowtimes = useMemo(
    () =>
      cityFilteredShowtimes
        .filter(showtime => !activeDate || showtime.startTime.startsWith(activeDate))
        .reduce<Record<string, Showtime[]>>((acc, showtime) => {
          const key = showtime.cinemaName || 'Rạp chiếu';
          acc[key] = [...(acc[key] ?? []), showtime];
          return acc;
        }, {}),
    [activeDate, cityFilteredShowtimes]
  );

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDate('');
    if (typeof window !== 'undefined') {
      localStorage.setItem(CITY_STORAGE_KEY, city);
    }
  };

  const loadingSchedule = loadingShowtimes || loadingCinemas;

  if (loadingMovie) {
    return (
      <div className="page-container py-10">
        <div className="grid animate-pulse gap-8 md:grid-cols-[240px_1fr]">
          <div className="aspect-[2/3] rounded-lg bg-slate-200 dark:bg-neutral-800" />
          <div className="space-y-4 pt-4">
            <div className="h-8 w-2/3 rounded-lg bg-slate-200 dark:bg-neutral-800" />
            <div className="h-5 w-1/2 rounded-lg bg-slate-200 dark:bg-neutral-800" />
            <div className="h-5 w-1/3 rounded-lg bg-slate-200 dark:bg-neutral-800" />
            <div className="mt-4 h-28 rounded-lg bg-slate-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24 text-center">
        <div className="mb-4 grid size-16 place-items-center rounded-lg bg-slate-100 dark:bg-neutral-800">
          <AlertCircle size={28} className="text-slate-400" />
        </div>
        <p className="text-lg font-black text-slate-950 dark:text-white">Không tìm thấy phim</p>
        <Link to="/" className="btn-secondary mt-6">Quay về trang chủ</Link>
      </div>
    );
  }

  const statusBadge = movie.status === 'NOW_SHOWING'
    ? { label: 'Đang chiếu', cls: 'bg-emerald-500 text-white' }
    : movie.status === 'COMING_SOON'
      ? { label: 'Sắp chiếu', cls: 'bg-amber-400 text-slate-950' }
      : { label: 'Đã chiếu', cls: 'bg-slate-500 text-white' };

  return (
    <>
      <Helmet>
        <title>{movie.title} - CinemaBooking</title>
        <meta name="description" content={movie.description?.slice(0, 160)} />
      </Helmet>

      <section className="border-b border-slate-200/70 bg-white dark:border-white/8 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400"
          >
            <ChevronLeft size={16} /> Danh sách phim
          </Link>

          <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-end">
            <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-white/10 md:mx-0">
              <img
                src={movie.posterUrl || FALLBACK_POSTER}
                alt={movie.title}
                className="aspect-[2/3] w-full object-cover"
                onError={event => {
                  (event.target as HTMLImageElement).src = FALLBACK_POSTER;
                }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-lg px-3 py-1 text-xs font-black ${statusBadge.cls}`}>
                  {statusBadge.label}
                </span>
                {movie.ageRating && (
                  <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-black text-white">
                    {movie.ageRating}
                  </span>
                )}
                {movie.ratingImdb && movie.ratingImdb > 0 && (
                  <span className="badge-brand">
                    <Star size={11} fill="currentColor" /> IMDb {movie.ratingImdb}/10
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                {movie.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {movie.duration && <MetaPill icon={Clock}>{movie.duration} phút</MetaPill>}
                {movie.releaseDate && <MetaPill icon={Calendar}>{formatDate(movie.releaseDate)}</MetaPill>}
                {movie.language && <MetaPill icon={Globe}>{movie.language}</MetaPill>}
                {movie.director && <MetaPill icon={Users}>Đạo diễn: {movie.director}</MetaPill>}
                {movie.country && <MetaPill icon={Globe}>{movie.country}</MetaPill>}
              </div>

              {movie.genre && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {movie.genre.split(',').map(genre => (
                    <span
                      key={genre.trim()}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400"
                    >
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              )}

              {movie.description && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-500 dark:text-neutral-400 line-clamp-3">
                  {movie.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-black text-white transition-colors hover:bg-red-500"
                  >
                    <Play size={15} fill="currentColor" /> Trailer
                  </a>
                )}
                {movie.status === 'NOW_SHOWING' && (
                  <button type="button" onClick={() => setActiveTab('SHOWTIMES')} className="btn-secondary">
                    <Ticket size={16} /> Mua vé
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl dark:border-white/8 dark:bg-neutral-950/92">
        <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {[
            { id: 'SHOWTIMES', label: 'Lịch chiếu', icon: Ticket },
            { id: 'INFO', label: 'Chi tiết', icon: Globe },
            { id: 'REVIEWS', label: 'Đánh giá', icon: MessageSquare },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 border-b-2 py-4 text-sm font-black transition-colors ${
                  active
                    ? 'border-amber-500 text-slate-950 dark:border-amber-400 dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'SHOWTIMES' && (
          <div className="fade-in-up">
            {loadingSchedule && (
              <div className="space-y-4">
                {[1, 2].map(item => (
                  <div key={item} className="skeleton h-32 rounded-lg" />
                ))}
              </div>
            )}

            {!loadingSchedule && sortedShowtimes.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="Chưa có suất chiếu"
                description="Lịch chiếu của phim này sẽ được cập nhật sau."
              />
            )}

            {!loadingSchedule && sortedShowtimes.length > 0 && (
              <>
                <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-900 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="cinema-label">Khu vực</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-neutral-300">
                      Chọn thành phố để xem rạp và suất chiếu phù hợp.
                    </p>
                  </div>
                  <label className="flex min-w-full flex-col gap-1.5 sm:min-w-[240px]">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                      Thành phố
                    </span>
                    <select
                      value={activeCity}
                      onChange={event => handleCityChange(event.target.value)}
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition-colors focus:border-amber-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                    >
                      {cityOptions.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

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
                            : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="block text-sm font-black">
                          {new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(new Date(date))}
                        </span>
                        <span className="mt-0.5 block text-xs font-bold opacity-70">
                          {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(date))}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {availableDates.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="Chưa có lịch tại khu vực này"
                    description="Bạn có thể chọn thành phố khác để xem các suất chiếu đang mở bán."
                  />
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedShowtimes).map(([cinemaName, times]) => (
                      <div key={cinemaName} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-neutral-900">
                        <Link
                          to={`/cinemas?cinemaId=${times[0].cinemaId}`}
                          className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 transition-colors hover:bg-slate-100 dark:border-white/8 dark:bg-neutral-950 dark:hover:bg-white/5"
                          aria-label={`Xem vị trí ${cinemaName} trên bản đồ`}
                        >
                          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                            <MapPin size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-black text-slate-950 dark:text-white">{cinemaName}</span>
                            {times[0]?.cinemaAddress && (
                              <span className="mt-0.5 block text-xs font-semibold cinema-muted">{times[0].cinemaAddress}</span>
                            )}
                          </span>
                        </Link>

                        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          {times.map(showtime => (
                            <Link
                              key={showtime.id}
                              to={`/seat-selection/${showtime.id}`}
                              className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-neutral-950 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10"
                            >
                              <div>
                                <p className="text-xl font-black text-slate-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
                                  {formatTime(showtime.startTime)}
                                </p>
                                <p className="mt-1 text-xs font-semibold cinema-muted">{showtime.roomName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-950 dark:text-white">
                                  {formatMoney(showtime.basePrice ?? 0)}
                                </p>
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  Chọn ghế <ChevronRight size={12} />
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'INFO' && (
          <div className="space-y-6 fade-in-up">
            <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-neutral-900">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Nội dung phim</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-neutral-300">
                {movie.description || 'Nội dung phim đang được cập nhật.'}
              </p>
            </section>

            {(movie.actors || movie.director) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {movie.actors && <InfoPanel label="Diễn viên" value={movie.actors} />}
                {movie.director && <InfoPanel label="Đạo diễn" value={movie.director} />}
              </div>
            )}
          </div>
        )}

        {activeTab === 'REVIEWS' && (
          <EmptyState
            icon={MessageSquare}
            title="Đánh giá từ khán giả"
            description="Tính năng bình luận và đánh giá sẽ được mở trong phiên bản tiếp theo."
          />
        )}
      </div>
    </>
  );
};

const MetaPill = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-white/10">
    <Icon size={14} className="shrink-0" />
    {children}
  </span>
);

const InfoPanel = ({ label, value }: { label: string; value: string }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-neutral-900">
    <p className="cinema-label">{label}</p>
    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
  </section>
);

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white py-14 text-center dark:border-white/10 dark:bg-neutral-900">
    <div className="mx-auto mb-4 grid size-14 place-items-center rounded-lg bg-slate-100 dark:bg-neutral-800">
      <Icon size={24} className="text-slate-400" />
    </div>
    <p className="font-black text-slate-950 dark:text-white">{title}</p>
    <p className="mt-2 text-sm cinema-muted">{description}</p>
  </div>
);

export default MovieDetailPage;
