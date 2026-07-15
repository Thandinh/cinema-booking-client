import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  Clapperboard,
  Clock3,
  MapPin,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { cinemaApi, type CinemaMapItem } from '../api/cinemaApi';
import { movieApi } from '../api/movieApi';
import type { Movie, Showtime } from '../types/domain.types';
import { formatTime } from '../utils/format';

type QuickBookingWidgetProps = {
  variant?: 'default' | 'compact';
};

const CITY_STORAGE_KEY = 'cinema:selectedCity';
const DEFAULT_CITY = 'TP Hồ Chí Minh';

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));

const QuickBookingWidget = ({ variant = 'default' }: QuickBookingWidgetProps) => {
  const navigate = useNavigate();

  const [selectedCity, setSelectedCity] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem(CITY_STORAGE_KEY) ?? ''
  );
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');

  const { data: moviesData = [] } = useQuery({
    queryKey: ['quick-movies'],
    queryFn: () => movieApi.getAll({ status: 'NOW_SHOWING', size: 100 }).then(response => response.data.result.content),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cinemasData = [] } = useQuery({
    queryKey: ['quick-cinemas'],
    queryFn: () => cinemaApi.getMapData().then(response => response.data.result),
    staleTime: 5 * 60 * 1000,
  });

  const { data: showtimesData = [], isFetching: loadingShowtimes } = useQuery({
    queryKey: ['quick-showtimes', selectedMovieId],
    queryFn: () => movieApi.getShowtimes(selectedMovieId).then(response => response.data.result),
    enabled: Boolean(selectedMovieId),
    staleTime: 60 * 1000,
  });

  const movies: Movie[] = moviesData;
  const cinemas: CinemaMapItem[] = cinemasData;
  const showtimes: Showtime[] = showtimesData;

  const cityOptions = useMemo(() => {
    const cities = Array.from(new Set(cinemas.map(cinema => cinema.city).filter(Boolean)));
    return cities.sort((cityA, cityB) => {
      if (cityA === DEFAULT_CITY) return -1;
      if (cityB === DEFAULT_CITY) return 1;
      return cityA.localeCompare(cityB, 'vi');
    });
  }, [cinemas]);

  const activeCity = cityOptions.includes(selectedCity)
    ? selectedCity
    : cityOptions.includes(DEFAULT_CITY)
      ? DEFAULT_CITY
      : cityOptions[0] ?? '';

  const availableCinemas = useMemo(
    () =>
      cinemas.filter(cinema =>
        cinema.city === activeCity &&
        showtimes.some(showtime => showtime.cinemaId === cinema.id)
      ),
    [activeCity, cinemas, showtimes]
  );

  const availableDates = useMemo(
    () =>
      Array.from(
        new Set(
          showtimes
            .filter(showtime => showtime.cinemaId === selectedCinemaId)
            .map(showtime => showtime.startTime.split('T')[0])
        )
      ).sort(),
    [selectedCinemaId, showtimes]
  );

  const availableShowtimes = useMemo(
    () =>
      showtimes
        .filter(showtime =>
          showtime.cinemaId === selectedCinemaId &&
          showtime.startTime.startsWith(selectedDate)
        )
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [selectedCinemaId, selectedDate, showtimes]
  );

  useEffect(() => {
    setSelectedCinemaId('');
    setSelectedDate('');
    setSelectedShowtimeId('');
  }, [selectedMovieId]);

  useEffect(() => {
    setSelectedCinemaId('');
    setSelectedDate('');
    setSelectedShowtimeId('');
  }, [activeCity]);

  useEffect(() => {
    setSelectedDate('');
    setSelectedShowtimeId('');
  }, [selectedCinemaId]);

  useEffect(() => {
    setSelectedShowtimeId('');
  }, [selectedDate]);

  const selectedMovie = movies.find(movie => movie.id === selectedMovieId);
  const selectedCinema = availableCinemas.find(cinema => cinema.id === selectedCinemaId);
  const canBook = Boolean(selectedShowtimeId);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CITY_STORAGE_KEY, city);
    }
  };

  const handleBook = () => {
    if (selectedShowtimeId) {
      navigate(`/seat-selection/${selectedShowtimeId}`);
    }
  };

  const shellClass =
    variant === 'compact'
      ? 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900'
      : 'mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-5';

  return (
    <div className={shellClass}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Ticket size={18} />
        </span>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Đặt vé nhanh</h2>
          <p className="text-xs font-semibold cinema-muted">
            {selectedMovie ? selectedMovie.title : 'Chọn thành phố, phim và rạp để xem suất chiếu'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <SelectField
          icon={MapPin}
          label="Thành phố"
          value={activeCity}
          onChange={handleCityChange}
          placeholder="Thành phố"
          options={cityOptions.map(city => ({ value: city, label: city }))}
        />

        <SelectField
          icon={Clapperboard}
          label="Phim"
          value={selectedMovieId}
          onChange={setSelectedMovieId}
          placeholder="Phim đang chiếu"
          options={movies.map(movie => ({ value: movie.id, label: movie.title }))}
        />

        <SelectField
          icon={Building2}
          label="Rạp"
          value={selectedCinemaId}
          onChange={setSelectedCinemaId}
          placeholder={loadingShowtimes ? 'Đang tải rạp...' : 'Rạp chiếu'}
          disabled={!selectedMovieId || !activeCity || loadingShowtimes}
          options={availableCinemas.map(cinema => ({ value: cinema.id, label: cinema.name }))}
        />

        <SelectField
          icon={Calendar}
          label="Ngày"
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder="Ngày chiếu"
          disabled={!selectedCinemaId}
          options={availableDates.map(date => ({ value: date, label: dateLabel(date) }))}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
            Suất chiếu
          </span>
          {selectedCinema && (
            <span className="max-w-[180px] truncate text-xs font-bold cinema-muted">{selectedCinema.name}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {availableShowtimes.map(showtime => {
            const active = selectedShowtimeId === showtime.id;
            return (
              <button
                key={showtime.id}
                type="button"
                onClick={() => setSelectedShowtimeId(showtime.id)}
                className={`h-11 rounded-lg border text-sm font-black transition-colors ${
                  active
                    ? 'border-amber-400 bg-amber-300 text-slate-950'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-white/5'
                }`}
              >
                {formatTime(showtime.startTime)}
              </button>
            );
          })}

          {availableShowtimes.length === 0 && (
            <div className="col-span-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold cinema-muted dark:border-white/10 dark:bg-neutral-950">
              {selectedDate
                ? 'Ngày này chưa có suất phù hợp.'
                : 'Chọn thành phố, phim, rạp và ngày để xem giờ chiếu.'}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleBook}
        disabled={!canBook}
        className="btn-primary mt-5 w-full"
      >
        <Clock3 size={16} />
        Tiếp tục
      </button>
    </div>
  );
};

type SelectFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
};

const SelectField = ({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: SelectFieldProps) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
      {label}
    </span>
    <span className="relative block">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-8 text-sm font-bold text-slate-950 outline-none transition-colors focus:border-amber-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:focus:bg-neutral-900"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  </label>
);

export default QuickBookingWidget;
