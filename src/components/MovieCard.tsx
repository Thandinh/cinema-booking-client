import { Link } from 'react-router-dom';
import { Clock, Star, Ticket } from 'lucide-react';
import type { Movie } from '../types/domain.types';
import { FALLBACK_POSTER } from '../constants';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  NOW_SHOWING: { label: 'Đang chiếu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' },
  COMING_SOON: { label: 'Sắp chiếu', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20' },
  ENDED: { label: 'Đã chiếu', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-neutral-400 dark:border-white/10' },
};

const MovieCard = ({ movie }: { movie: Movie }) => {
  const badge = STATUS_BADGE[movie.status] ?? STATUS_BADGE.ENDED;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20">
      <Link to={`/movies/${movie.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-neutral-800">
          <img
            src={movie.posterUrl || FALLBACK_POSTER}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={event => {
              (event.target as HTMLImageElement).src = FALLBACK_POSTER;
            }}
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${badge.cls}`}>
              {badge.label}
            </span>
            {movie.ageRating && (
              <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                {movie.ageRating}
              </span>
            )}
          </div>

          {movie.ratingImdb && movie.ratingImdb > 0 && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-[11px] font-black text-amber-300">
              <Star size={11} fill="currentColor" /> {movie.ratingImdb.toFixed(1)}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={`/movies/${movie.id}`}>
          <h3 className="line-clamp-2 min-h-[38px] text-sm font-black leading-snug text-slate-950 group-hover:text-slate-700 dark:text-white dark:group-hover:text-neutral-200">
            {movie.title}
          </h3>
        </Link>

        <div className="mt-2 flex min-h-[34px] flex-wrap items-start gap-x-3 gap-y-1">
          {movie.duration && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-500">
              <Clock size={11} /> {movie.duration} phút
            </span>
          )}
          {movie.genre && (
            <span className="line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-neutral-500">
              {movie.genre.split(',')[0].trim()}
            </span>
          )}
        </div>

        <Link
          to={`/movies/${movie.id}`}
          className="mt-auto inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-slate-950 text-xs font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-neutral-200"
        >
          <Ticket size={13} />
          {movie.status === 'NOW_SHOWING' ? 'Mua vé' : 'Xem lịch'}
        </Link>
      </div>
    </article>
  );
};

export default MovieCard;
