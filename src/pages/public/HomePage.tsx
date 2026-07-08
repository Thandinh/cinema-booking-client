import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, Film, MapPin, Search, Sparkles, Ticket } from 'lucide-react';
import { movieApi } from '../../api/movieApi';
import MovieCard from '../../components/MovieCard';
import MovieCardSkeleton from '../../components/MovieCardSkeleton';

type TabType = 'NOW_SHOWING' | 'COMING_SOON';

const tabs: { label: string; value: TabType; helper: string }[] = [
  { label: 'Đang chiếu', value: 'NOW_SHOWING', helper: 'Có thể đặt vé ngay' },
  { label: 'Sắp chiếu', value: 'COMING_SOON', helper: 'Theo dõi lịch mở bán' },
];

const FALLBACK_POSTER = 'https://placehold.co/480x720/111827/fbbf24?text=CinemaBooking';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('NOW_SHOWING');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['movies', activeTab],
    queryFn: () => movieApi.getAll({ status: activeTab, size: 24 }).then(r => r.data.result),
    staleTime: 1000 * 60 * 5,
  });

  const movies = data?.content ?? [];
  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? movies.filter(movie =>
      [movie.title, movie.genre, movie.director, movie.actors].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    )
    : movies;

  const featured = filtered[0] ?? movies[0];

  return (
    <>
      <Helmet>
        <title>CinemaBooking - Đặt vé xem phim online</title>
        <meta name="description" content="Đặt vé xem phim nhanh chóng, chọn ghế trực quan và quản lý vé trong tài khoản." />
      </Helmet>

      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-white/10">
        {featured?.posterUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm dark:opacity-25"
            style={{ backgroundImage: `url(${featured.posterUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-stone-50/95 to-stone-50 dark:from-neutral-950/75 dark:via-neutral-950/95 dark:to-neutral-950" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:px-8 lg:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <Sparkles size={14} />
              Đặt vé điện ảnh
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              Chọn phim, giữ ghế, nhận vé trong vài phút.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 cinema-muted sm:text-lg">
              Trải nghiệm đặt vé gọn như một sản phẩm thật: lịch chiếu rõ ràng, sơ đồ ghế trực quan và vé được lưu lại trong tài khoản.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="search"
                  placeholder="Tìm phim, thể loại, đạo diễn..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/70 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:ring-amber-400/10"
                />
              </div>
              <Link
                to="/cinemas"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-100"
              >
                <MapPin size={17} />
                Tìm rạp gần bạn
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-xl">
              {[
                { label: 'Phim', value: isLoading ? '--' : String(movies.length), icon: Film },
                { label: 'Đặt vé', value: '24/7', icon: Ticket },
                { label: 'Lịch chiếu', value: 'Realtime', icon: CalendarDays },
              ].map(item => (
                <div key={item.label} className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900/80 dark:ring-white/10">
                  <item.icon className="mb-3 text-amber-500" size={18} />
                  <p className="text-lg font-black text-slate-950 dark:text-white">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative ml-auto max-w-sm">
              <div className="absolute -inset-4 rounded-[2rem] bg-amber-300/30 blur-2xl dark:bg-amber-400/20" />
              <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-950 p-3 shadow-2xl ring-1 ring-white/10">
                <img
                  src={featured?.posterUrl || FALLBACK_POSTER}
                  alt={featured?.title || 'CinemaBooking'}
                  className="aspect-[2/3] w-full rounded-[1rem] object-cover"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = FALLBACK_POSTER;
                  }}
                />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-4 text-slate-950 shadow-xl backdrop-blur">
                  <p className="line-clamp-1 text-sm font-black">{featured?.title || 'Phim nổi bật'}</p>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{featured?.genre || 'Lịch chiếu mới nhất'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/85">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {tabs.map(tab => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSearch('');
                }}
                className={`min-w-40 rounded-2xl px-4 py-3 text-left transition ${
                  active
                    ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="block text-sm font-black">{tab.label}</span>
                <span className={`mt-1 block text-xs font-semibold ${active ? 'text-white/70 dark:text-slate-600' : 'text-slate-500 dark:text-neutral-500'}`}>
                  {tab.helper}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {activeTab === 'NOW_SHOWING' ? 'Phim đang chiếu' : 'Phim sắp chiếu'}
            </h2>
            <p className="mt-1 text-sm cinema-muted">
              {isLoading ? 'Đang tải danh sách phim...' : `${filtered.length} phim phù hợp`}
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/10 sm:self-auto"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {isError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <p className="font-black">Không thể tải danh sách phim</p>
            <p className="mt-2 text-sm">Vui lòng kiểm tra backend hoặc kết nối mạng rồi thử lại.</p>
          </div>
        )}

        {!isError && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {isLoading
                ? Array.from({ length: 12 }).map((_, index) => <MovieCardSkeleton key={index} />)
                : filtered.map(movie => <MovieCard key={movie.id} movie={movie} />)}
            </div>

            {!isLoading && filtered.length === 0 && (
              <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
                <Film className="mx-auto text-slate-400" size={42} />
                <p className="mt-4 font-black text-slate-950 dark:text-white">Chưa có phim phù hợp</p>
                <p className="mt-2 text-sm cinema-muted">Thử đổi từ khóa tìm kiếm hoặc chuyển sang tab khác.</p>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
};

export default HomePage;
