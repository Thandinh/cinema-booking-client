import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Film,
  MapPin,
  Search,
  Ticket,
  TrendingUp,
  X,
} from 'lucide-react';
import { cinemaApi, type CinemaMapItem } from '../../api/cinemaApi';
import { movieApi } from '../../api/movieApi';
import MovieCard from '../../components/MovieCard';
import MovieCardSkeleton from '../../components/MovieCardSkeleton';
import QuickBookingWidget from '../../components/QuickBookingWidget';
import { useDebounce } from '../../hooks/useDebounce';

type TabType = 'NOW_SHOWING' | 'COMING_SOON';

const DEFAULT_CITY = 'TP Hồ Chí Minh';

const tabs: { label: string; value: TabType; icon: typeof Film }[] = [
  { label: 'Đang chiếu', value: 'NOW_SHOWING', icon: TrendingUp },
  { label: 'Sắp chiếu', value: 'COMING_SOON', icon: CalendarDays },
];

const groupCinemasByCity = (cinemas: CinemaMapItem[]) =>
  cinemas.reduce<Record<string, CinemaMapItem[]>>((acc, cinema) => {
    const city = cinema.city || 'Khu vực khác';
    acc[city] = [...(acc[city] ?? []), cinema];
    return acc;
  }, {});

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('NOW_SHOWING');
  const [search, setSearch] = useState('');
  const [selectedCinemaCity, setSelectedCinemaCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['movies', activeTab],
    queryFn: () =>
      movieApi
        .getAll({ status: activeTab, size: 100 })
        .then(response => response.data.result),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cinemas = [] } = useQuery({
    queryKey: ['cinemas', 'map'],
    queryFn: () => cinemaApi.getMapData().then(response => response.data.result),
    staleTime: 1000 * 60 * 5,
  });

  const movies = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    const content = data?.content ?? [];
    if (!keyword) return content;
    return content.filter(movie =>
      [movie.title, movie.genre, movie.director, movie.actors]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(keyword))
    );
  }, [data?.content, debouncedSearch]);

  const cinemaGroups = useMemo(() => groupCinemasByCity(cinemas), [cinemas]);
  const cinemaCityOptions = useMemo(
    () =>
      Object.keys(cinemaGroups).sort((cityA, cityB) => {
        if (cityA === DEFAULT_CITY) return -1;
        if (cityB === DEFAULT_CITY) return 1;
        return cityA.localeCompare(cityB, 'vi');
      }),
    [cinemaGroups]
  );
  const activeCinemaCity = cinemaCityOptions.includes(selectedCinemaCity)
    ? selectedCinemaCity
    : cinemaCityOptions.includes(DEFAULT_CITY)
      ? DEFAULT_CITY
      : cinemaCityOptions[0] ?? '';
  const filteredCinemaCityOptions = useMemo(() => {
    const keyword = citySearch.trim().toLowerCase();
    if (!keyword) return cinemaCityOptions;
    return cinemaCityOptions.filter(city => city.toLowerCase().includes(keyword));
  }, [cinemaCityOptions, citySearch]);
  const highlightedCinemas = cinemaGroups[activeCinemaCity] ?? [];

  return (
    <>
      <Helmet>
        <title>cinemabooking.vn - Đặt vé xem phim</title>
        <meta
          name="description"
          content="Xem lịch chiếu, chọn rạp, chọn ghế và thanh toán vé xem phim online."
        />
      </Helmet>

      <section className="border-b border-slate-200/70 bg-white dark:border-white/8 dark:bg-neutral-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="cinema-label">Phim đang chiếu</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                  Hôm nay bạn muốn xem phim gì?
                </h1>
              </div>

              <Link to="/cinemas" className="btn-ghost shrink-0">
                <MapPin size={16} /> Tìm rạp
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="search"
                  placeholder="Tìm tên phim, thể loại..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="cinema-input pl-10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {tabs.map(tab => {
                  const active = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.value);
                        setSearch('');
                      }}
                      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${
                        active
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {isLoading
                ? Array.from({ length: 10 }).map((_, index) => <MovieCardSkeleton key={index} />)
                : movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
            </div>

            {isError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
                <Film className="mx-auto mb-3 text-red-400" size={36} />
                <p className="font-black text-red-700 dark:text-red-300">Không thể tải danh sách phim</p>
                <p className="mt-2 text-sm text-red-600/80 dark:text-red-300/80">Kiểm tra backend rồi thử lại.</p>
              </div>
            )}

            {!isLoading && !isError && movies.length === 0 && (
              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center dark:border-white/10 dark:bg-neutral-900">
                <Film className="mx-auto mb-3 text-slate-400" size={36} />
                <p className="font-black text-slate-950 dark:text-white">Chưa có phim phù hợp</p>
                <p className="mt-2 text-sm cinema-muted">
                  {search ? `Không tìm thấy kết quả cho "${search}".` : 'Hiện chưa có phim trong mục này.'}
                </p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <QuickBookingWidget variant="compact" />
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="cinema-label">Đặt vé tại rạp</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Chọn rạp, ngày chiếu và suất chiếu phù hợp với bạn.
            </h2>
          </div>
          <Link to="/cinemas" className="btn-secondary shrink-0">
            <Building2 size={16} /> Danh sách rạp
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm font-black text-slate-950 dark:text-white">Thành phố</p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="search"
                value={citySearch}
                onChange={event => setCitySearch(event.target.value)}
                placeholder="Tìm thành phố"
                className="cinema-input h-10 pl-9 pr-9 text-sm"
              />
              {citySearch && (
                <button
                  type="button"
                  onClick={() => setCitySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200"
                  aria-label="Xóa tìm kiếm thành phố"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredCinemaCityOptions.map(city => {
                const items = cinemaGroups[city] ?? [];
                const active = city === activeCinemaCity;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCinemaCity(city)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${
                      active
                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{city}</span>
                    <span className={`text-xs ${active ? 'text-white/70 dark:text-slate-500' : 'text-slate-500 dark:text-neutral-500'}`}>
                      {items.length} rạp
                    </span>
                  </button>
                );
              })}
              {filteredCinemaCityOptions.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm font-semibold cinema-muted dark:border-white/10">
                  Không tìm thấy thành phố phù hợp.
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">
                  Rạp tại {activeCinemaCity || 'khu vực đã chọn'}
                </p>
                <p className="mt-1 text-xs font-semibold cinema-muted">{highlightedCinemas.length} rạp đang mở bán</p>
              </div>
              <span className="hidden shrink-0 text-xs font-bold cinema-muted sm:inline">Kéo ngang để xem thêm</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {highlightedCinemas.map(cinema => (
              <Link
                key={cinema.id}
                to={`/cinemas/${cinema.id}`}
                className="group w-[280px] shrink-0 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20 dark:hover:bg-white/5 sm:w-[320px]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <MapPin size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-black text-slate-950 dark:text-white">{cinema.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium cinema-muted">{cinema.address}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400">
                      Xem lịch chiếu <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

              {highlightedCinemas.length === 0 && (
              <div className="w-full rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-neutral-900">
                <Building2 className="mx-auto mb-3 text-slate-400" size={36} />
                <p className="font-black text-slate-950 dark:text-white">Chưa có dữ liệu rạp</p>
                <p className="mt-2 text-sm cinema-muted">Hãy kiểm tra dữ liệu cinema trong mock-data.sql.</p>
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Phim đang chiếu', value: data?.totalElements ?? movies.length, icon: Film },
              { label: 'Rạp đang mở bán', value: cinemas.length, icon: Building2 },
              { label: 'Ghế được cập nhật', value: 'Trực tiếp', icon: Ticket },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-neutral-950 dark:text-neutral-200">
                  <item.icon size={18} />
                </span>
                <div>
                  <p className="text-xl font-black text-slate-950 dark:text-white">{item.value}</p>
                  <p className="text-xs font-bold cinema-muted">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
