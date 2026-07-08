import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck, ShoppingCart, Ticket } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { ApiResponse } from '../../types/api.types';
import type { SeatMapItem } from '../../types/domain.types';

const HOLD_SECONDS = 600;

const SEAT_STYLES: Record<SeatMapItem['seatType'], Record<SeatMapItem['status'] | 'SELECTED', string>> = {
  NORMAL: {
    AVAILABLE: 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-amber-300 hover:border-amber-400 dark:bg-neutral-800 dark:text-neutral-200 dark:border-white/10',
    HOLD: 'bg-amber-200/70 text-amber-900 border-amber-300 cursor-not-allowed dark:bg-amber-400/20 dark:text-amber-200 dark:border-amber-400/30',
    BOOKED: 'bg-red-200/80 text-red-800 border-red-300 cursor-not-allowed dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30',
    SELECTED: 'bg-amber-400 text-slate-950 border-amber-500 ring-4 ring-amber-200 dark:ring-amber-400/20',
  },
  VIP: {
    AVAILABLE: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-amber-300 hover:border-amber-400 dark:bg-indigo-500/20 dark:text-indigo-100 dark:border-indigo-400/20',
    HOLD: 'bg-amber-200/70 text-amber-900 border-amber-300 cursor-not-allowed dark:bg-amber-400/20 dark:text-amber-200 dark:border-amber-400/30',
    BOOKED: 'bg-red-200/80 text-red-800 border-red-300 cursor-not-allowed dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30',
    SELECTED: 'bg-amber-400 text-slate-950 border-amber-500 ring-4 ring-amber-200 dark:ring-amber-400/20',
  },
  COUPLE: {
    AVAILABLE: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-amber-300 hover:border-amber-400 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/20',
    HOLD: 'bg-amber-200/70 text-amber-900 border-amber-300 cursor-not-allowed dark:bg-amber-400/20 dark:text-amber-200 dark:border-amber-400/30',
    BOOKED: 'bg-red-200/80 text-red-800 border-red-300 cursor-not-allowed dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30',
    SELECTED: 'bg-amber-400 text-slate-950 border-amber-500 ring-4 ring-amber-200 dark:ring-amber-400/20',
  },
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

const SeatSelectionPage = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [heldSeats, setHeldSeats] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(HOLD_SECONDS);
  const [holdActive, setHoldActive] = useState(false);

  const { data: seatData, isLoading, isError } = useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: () => axiosClient.get<ApiResponse<SeatMapItem[]>>(`/api/v1/bookings/showtimes/${showtimeId}/seats`).then(r => r.data.result),
    refetchInterval: holdActive ? false : 30000,
    enabled: !!showtimeId,
  });

  useEffect(() => {
    if (!holdActive) return;

    const interval = window.setInterval(() => {
      setTimeLeft(current => {
        if (current <= 1) {
          window.clearInterval(interval);
          setHoldActive(false);
          setHeldSeats([]);
          return HOLD_SECONDS;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [holdActive]);

  const toggleSeat = useCallback((seat: SeatMapItem) => {
    if (seat.status !== 'AVAILABLE' || holdActive) return;
    setSelected(current =>
      current.includes(seat.seatId)
        ? current.filter(id => id !== seat.seatId)
        : [...current, seat.seatId]
    );
  }, [holdActive]);

  const holdMutation = useMutation({
    mutationFn: () => axiosClient.post<ApiResponse<any>>('/api/v1/bookings/hold', {
      showtimeId,
      seatIds: selected,
    }),
    onSuccess: () => {
      setHeldSeats(selected);
      setSelected([]);
      setHoldActive(true);
      setTimeLeft(HOLD_SECONDS);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Không thể giữ ghế. Vui lòng thử lại.');
    },
  });

  const bookingMutation = useMutation({
    mutationFn: () => axiosClient.post<ApiResponse<any>>('/api/v1/bookings', {
      showtimeId,
      seatIds: heldSeats,
    }),
    onSuccess: (response) => {
      const bookingId = response.data.result?.id;
      navigate(bookingId ? `/checkout/${bookingId}` : '/my/bookings');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Không thể tạo booking.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải sơ đồ ghế
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black">Không thể tải sơ đồ ghế</p>
        <p className="mt-2 text-sm cinema-muted">Vui lòng thử lại sau hoặc chọn suất chiếu khác.</p>
      </div>
    );
  }

  const seats = seatData ?? [];
  if (seats.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <Ticket className="mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black">Chưa có sơ đồ ghế</p>
        <p className="mt-2 text-sm cinema-muted">Suất chiếu này chưa được cấu hình ghế.</p>
      </div>
    );
  }

  const maxRow = Math.max(...seats.map(seat => seat.rowIndex));
  const maxCol = Math.max(...seats.map(seat => seat.colIndex));
  const grid: (SeatMapItem | null)[][] = Array.from({ length: maxRow + 1 }, (_, rowIndex) =>
    Array.from({ length: maxCol + 1 }, (_, colIndex) =>
      seats.find(seat => seat.rowIndex === rowIndex && seat.colIndex === colIndex) ?? null
    )
  );

  const activeSeatIds = holdActive ? heldSeats : selected;
  const selectedSeats = seats.filter(seat => activeSeatIds.includes(seat.seatId));
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const getSeatClass = (seat: SeatMapItem) => {
    if (heldSeats.includes(seat.seatId) || selected.includes(seat.seatId)) {
      return SEAT_STYLES[seat.seatType].SELECTED;
    }
    return SEAT_STYLES[seat.seatType][seat.status];
  };

  return (
    <>
      <Helmet>
        <title>Chọn ghế - CinemaBooking</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <ShieldCheck size={14} />
              Giữ ghế an toàn
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">Chọn ghế xem phim</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 cinema-muted">Chọn ghế còn trống, giữ chỗ trong 10 phút rồi hoàn tất đặt vé.</p>
          </div>
          {holdActive && (
            <div className="inline-flex items-center gap-3 rounded-2xl bg-amber-100 px-5 py-3 font-black text-amber-900 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <Clock size={18} />
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 sm:p-6">
            <div className="mb-8 text-center">
              <div className="mx-auto h-3 w-4/5 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_18px_50px_rgba(245,158,11,.35)]" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-neutral-500">Màn hình</p>
            </div>

            <div className="overflow-x-auto pb-3">
              <div className="mx-auto inline-block min-w-max">
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="mb-2 flex items-center gap-2">
                    <span className="mr-1 w-6 text-right text-xs font-black text-slate-400">
                      {row.find(seat => seat)?.rowLabel ?? ''}
                    </span>
                    {row.map((seat, colIndex) =>
                      seat ? (
                        <button
                          key={seat.seatId}
                          onClick={() => toggleSeat(seat)}
                          disabled={seat.status !== 'AVAILABLE' || holdActive}
                          title={`${seat.rowLabel}${seat.seatNumber} - ${formatMoney(seat.price)}`}
                          className={`size-8 rounded-lg border text-[11px] font-black transition duration-150 ${getSeatClass(seat)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      ) : (
                        <div key={`${rowIndex}-${colIndex}`} className="size-8" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-slate-200 pt-5 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-neutral-400 sm:grid-cols-5">
              {[
                { className: 'bg-slate-200 dark:bg-neutral-800', label: 'Ghế thường' },
                { className: 'bg-indigo-100 dark:bg-indigo-500/30', label: 'VIP' },
                { className: 'bg-rose-100 dark:bg-rose-500/30', label: 'Couple' },
                { className: 'bg-amber-400', label: 'Đang chọn' },
                { className: 'bg-red-200 dark:bg-red-500/30', label: 'Đã đặt' },
              ].map(item => (
                <span key={item.label} className="flex items-center gap-2">
                  <span className={`size-4 rounded ${item.className}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-white dark:text-slate-950">
                <Ticket size={20} />
              </span>
              <div>
                <p className="font-black text-slate-950 dark:text-white">Tóm tắt đặt vé</p>
                <p className="text-xs font-semibold cinema-muted">{holdActive ? 'Ghế đã được giữ' : 'Chọn ghế để tiếp tục'}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-neutral-950">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">Ghế</p>
              <div className="mt-3 flex min-h-10 flex-wrap gap-2">
                {selectedSeats.length > 0 ? selectedSeats.map(seat => (
                  <span key={seat.seatId} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
                    {seat.rowLabel}{seat.seatNumber}
                  </span>
                )) : (
                  <span className="text-sm cinema-muted">Chưa chọn ghế</span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm font-semibold">
              <div className="flex justify-between gap-4 cinema-muted">
                <span>Số lượng</span>
                <span>{selectedSeats.length} ghế</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-slate-950 dark:border-white/10 dark:text-white">
                <span>Tổng tiền</span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300">{formatMoney(totalPrice)}</span>
              </div>
            </div>

            {!holdActive && (
              <button
                onClick={() => holdMutation.mutate()}
                disabled={selected.length === 0 || holdMutation.isPending}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {holdMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Clock size={17} />}
                Giữ ghế
              </button>
            )}

            {holdActive && (
              <button
                onClick={() => bookingMutation.mutate()}
                disabled={heldSeats.length === 0 || bookingMutation.isPending}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-100"
              >
                {bookingMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <ShoppingCart size={17} />}
                Hoàn tất đặt vé
              </button>
            )}

            {holdActive && (
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
                Ghế đã được giữ tạm thời. Vui lòng hoàn tất trước khi hết thời gian.
              </p>
            )}
          </aside>
        </div>
      </div>
    </>
  );
};

export default SeatSelectionPage;
