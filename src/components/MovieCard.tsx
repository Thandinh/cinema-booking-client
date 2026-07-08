import { Link } from 'react-router-dom';
import { Clock, Star, Ticket } from 'lucide-react';
import type { Movie } from '../types/domain.types';

interface Props {
  movie: Movie;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  NOW_SHOWING: { label: 'Đang chiếu', color: 'bg-emerald-500 text-white' },
  COMING_SOON: { label: 'Sắp chiếu', color: 'bg-amber-400 text-slate-950' },
  ENDED: { label: 'Đã kết thúc', color: 'bg-slate-500 text-white' },
};

const FALLBACK_POSTER = 'https://placehold.co/480x720/111827/fbbf24?text=CinemaBooking';

const MovieCard = ({ movie }: Props) => {
  const badge = STATUS_BADGE[movie.status] ?? STATUS_BADGE.ENDED;

  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 dark:bg-neutral-900 dark:ring-white/10 dark:hover:shadow-black/30"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-200 dark:bg-neutral-800">
        <img
          src={movie.posterUrl || FALLBACK_POSTER}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_POSTER;
          }}
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 to-transparent opacity-80" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black ${badge.color}`}>
          {badge.label}
        </span>
        {movie.ageRating && (
          <span className="absolute right-3 top-3 rounded-md bg-red-600 px-2 py-1 text-[11px] font-black text-white">
            {movie.ageRating}
          </span>
        )}
        <span className="absolute bottom-3 left-3 right-3 inline-flex translate-y-2 items-center justify-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-black text-slate-950 opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Ticket size={14} />
          Xem suất chiếu
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
          {movie.title}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400">
          {movie.duration ? (
            <span className="flex items-center gap-1">
              <Clock size={13} /> {movie.duration} phút
            </span>
          ) : (
            <span />
          )}
          {movie.ratingImdb && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star size={13} fill="currentColor" /> {movie.ratingImdb}
            </span>
          )}
        </div>
        {movie.genre && (
          <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-500 dark:text-neutral-500">{movie.genre}</p>
        )}
      </div>
    </Link>
  );
};

export default MovieCard;
