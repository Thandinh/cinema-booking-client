import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Radio,
  ShieldCheck,
  ShoppingCart,
  Ticket,
  Wifi,
  WifiOff,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { bookingApi } from '../../api/bookingApi';
import type { ApiResponse } from '../../types/api.types';
import type { BookingResponse, HoldSeatResponse, SeatMapItem } from '../../types/domain.types';
import { formatCountdown, formatMoney } from '../../utils/format';
import { HOLD_SECONDS } from '../../constants';
import { toast } from '../../components/ui/Toast';
import { useSeatWebSocket, type SeatStatusEvent } from '../../hooks/useSeatWebSocket';
import { useAuthStore } from '../../stores/authStore';

const SEAT_STYLES: Record<SeatMapItem['seatType'], Record<SeatMapItem['status'] | 'SELECTED' | 'MY_HOLD', string>> = {
  NORMAL: {
    AVAILABLE: 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-white/10 dark:hover:bg-neutral-700',
    HOLD: 'bg-orange-100 text-orange-800 border-orange-200 cursor-not-allowed dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
    MY_HOLD: 'bg-slate-950 text-white border-slate-950 ring-2 ring-slate-300 dark:bg-white dark:text-slate-950 dark:ring-white/20 cursor-not-allowed',
    BOOKED: 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
    SELECTED: 'bg-slate-950 text-white border-slate-950 ring-2 ring-slate-300 dark:bg-white dark:text-slate-950 dark:ring-white/20',
  },
  VIP: {
    AVAILABLE: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/20',
    HOLD: 'bg-orange-100 text-orange-800 border-orange-200 cursor-not-allowed dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
    MY_HOLD: 'bg-slate-950 text-white border-slate-950 ring-2 ring-slate-300 dark:bg-white dark:text-slate-950 dark:ring-white/20 cursor-not-allowed',
    BOOKED: 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
    SELECTED: 'bg-slate-950 text-white border-slate-950 ring-2 ring-slate-300 dark:bg-white dark:text-slate-950 dark:ring-white/20',
  },
  COUPLE: {
    AVAILABLE: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/20',
    HOLD: 'bg-orange-100 text-orange-800 border-orange-200 cursor-not-allowed dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
    MY_HOLD: 'bg-slate-950 text-white border-slate-950 ring-2 ring-slate-300 dark:bg-white dark:text-slate-950 dark:ring-white/20 cursor-not-allowed',
    BOOKED: 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
    SELECTED: 'bg-slate-950 text-white border-slate-950 ring-2 ring-slate-300 dark:bg-white dark:text-slate-950 dark:ring-white/20',
  },
};

const secondsUntil = (value?: string) => {
  if (!value) return HOLD_SECONDS;
  return Math.max(1, Math.floor((new Date(value).getTime() - Date.now()) / 1000));
};

const SeatSelectionPage = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [seatMap, setSeatMap] = useState<SeatMapItem[]>([]);
  const holdersRef = useRef<Map<string, string>>(new Map());
  const [selected, setSelected] = useState<string[]>([]);
  const [heldSeats, setHeldSeats] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(HOLD_SECONDS);
  const [holdActive, setHoldActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const { data: fetchedSeatMap = [], isLoading, isError } = useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: () => bookingApi.getSeatMap(showtimeId!).then(response => response.data.result),
    enabled: Boolean(showtimeId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  useEffect(() => {
    setSeatMap(fetchedSeatMap ?? []);
  }, [fetchedSeatMap]);

  const handleSeatUpdate = useCallback((event: SeatStatusEvent) => {
    setSeatMap(previous =>
      previous.map(seat => {
        if (seat.seatId !== event.seatId) return seat;
        if (event.status === 'HOLD' && event.heldByUserId) {
          holdersRef.current.set(event.seatId, event.heldByUserId);
        } else {
          holdersRef.current.delete(event.seatId);
        }
        return { ...seat, status: event.status };
      })
    );

    if (event.status !== 'AVAILABLE') {
      setSelected(previous => previous.filter(id => id !== event.seatId));
    }
  }, []);

  const { isConnectedRef } = useSeatWebSocket({
    showtimeId,
    onSeatUpdate: handleSeatUpdate,
    currentUserId: user?.id,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWsConnected(isConnectedRef.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isConnectedRef]);

  useEffect(() => {
    if (!holdActive) return;
    const interval = window.setInterval(() => {
      setTimeLeft(current => {
        if (current <= 1) {
          window.clearInterval(interval);
          setHoldActive(false);
          setHeldSeats([]);
          queryClient.invalidateQueries({ queryKey: ['seats', showtimeId] });
          toast.warning('Hết thời gian giữ ghế. Vui lòng chọn lại.');
          return HOLD_SECONDS;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [holdActive, queryClient, showtimeId]);

  const toggleSeat = useCallback((seat: SeatMapItem) => {
    if (seat.status !== 'AVAILABLE' || holdActive) return;
    setSelected(current =>
      current.includes(seat.seatId)
        ? current.filter(id => id !== seat.seatId)
        : [...current, seat.seatId]
    );
  }, [holdActive]);

  const holdMutation = useMutation({
    mutationFn: () =>
      axiosClient.post<ApiResponse<HoldSeatResponse>>('/api/v1/bookings/hold', {
        showtimeId,
        seatIds: selected,
      }),
    onSuccess: response => {
      const result = response.data.result;
      const heldSeatIds = result?.heldSeatIds?.map(String) ?? selected;
      setHeldSeats(heldSeatIds);
      setSelected([]);
      setHoldActive(true);
      setTimeLeft(secondsUntil(result?.holdUntil));
      toast.success('Ghế đã được giữ. Đang chuyển sang thanh toán.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể giữ ghế. Vui lòng thử lại.');
    },
  });

  const bookingMutation = useMutation({
    mutationFn: (seatIds: string[]) =>
      axiosClient.post<ApiResponse<BookingResponse>>('/api/v1/bookings', {
        showtimeId,
        seatIds,
      }),
    onSuccess: response => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      const bookingId = response.data.result?.id;
      navigate(bookingId ? `/checkout/${bookingId}` : '/my/bookings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể tạo đơn đặt vé.');
    },
  });

  const handleContinueToCheckout = async () => {
    const currentSeatIds = holdActive ? heldSeats : selected;
    if (currentSeatIds.length === 0) return;

    try {
      if (holdActive) {
        await bookingMutation.mutateAsync(currentSeatIds);
        return;
      }

      const holdResponse = await holdMutation.mutateAsync();
      const heldSeatIds = holdResponse.data.result?.heldSeatIds?.map(String) ?? currentSeatIds;
      await bookingMutation.mutateAsync(heldSeatIds);
    } catch {
      // Mutations already show the user-facing error.
    }
  };

  const grid = useMemo(() => {
    if (seatMap.length === 0) return [];
    const maxRow = Math.max(...seatMap.map(seat => seat.rowIndex));
    const maxCol = Math.max(...seatMap.map(seat => seat.colIndex));
    return Array.from({ length: maxRow + 1 }, (_, rowIndex) =>
      Array.from({ length: maxCol + 1 }, (_, colIndex) =>
        seatMap.find(seat => seat.rowIndex === rowIndex && seat.colIndex === colIndex) ?? null
      )
    );
  }, [seatMap]);

  const activeSeatIds = holdActive ? heldSeats : selected;
  const selectedSeats = seatMap.filter(seat => activeSeatIds.includes(seat.seatId));
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const isSubmitting = holdMutation.isPending || bookingMutation.isPending;

  const getSeatStyle = (seat: SeatMapItem): string => {
    if (heldSeats.includes(seat.seatId) || selected.includes(seat.seatId)) {
      return SEAT_STYLES[seat.seatType].SELECTED;
    }
    if (seat.status === 'HOLD') {
      const holderId = holdersRef.current.get(seat.seatId);
      if (holderId && user?.id && holderId === user.id) {
        return SEAT_STYLES[seat.seatType].MY_HOLD;
      }
      return SEAT_STYLES[seat.seatType].HOLD;
    }
    return SEAT_STYLES[seat.seatType][seat.status] ?? SEAT_STYLES[seat.seatType].BOOKED;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin" size={18} />
          Đang tải sơ đồ ghế
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-container py-20 text-center">
        <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black dark:text-white">Không thể tải sơ đồ ghế</p>
        <p className="mt-2 text-sm cinema-muted">Vui lòng thử lại sau hoặc chọn suất chiếu khác.</p>
      </div>
    );
  }

  if (seatMap.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <Ticket className="mx-auto mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black dark:text-white">Chưa có sơ đồ ghế</p>
        <p className="mt-2 text-sm cinema-muted">Suất chiếu này chưa được cấu hình ghế.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Chọn ghế - Cinema Booking</title>
      </Helmet>

      <div className="page-container py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="badge-brand w-fit">
              <ShieldCheck size={14} /> Giữ ghế tạm thời
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Chọn ghế
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 cinema-muted">
              Ghế sẽ được giữ trong thời gian thanh toán sau khi bạn tiếp tục.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              title={wsConnected ? 'Trạng thái ghế đang được cập nhật' : 'Đang kết nối lại...'}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors ${
                wsConnected
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
                  : 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/5 dark:text-neutral-400 dark:ring-white/10'
              }`}
            >
              {wsConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {wsConnected ? 'Đang cập nhật' : 'Mất kết nối'}
            </div>

            {holdActive && (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 font-black text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10">
                <Clock size={15} />
                <span className="tabular-nums">{formatCountdown(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="cinema-card overflow-hidden p-4 sm:p-6">
            <div className="mb-10 text-center">
              <div className="mx-auto h-2.5 w-3/4 rounded-full bg-gradient-to-r from-transparent via-slate-400 to-transparent shadow-[0_15px_40px_rgba(100,116,139,.25)]" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-slate-400 dark:text-neutral-500">
                Màn hình
              </p>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="mx-auto inline-block min-w-max">
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="mb-2 flex items-center justify-center gap-2 sm:gap-2.5">
                    <span className="mr-2 w-6 shrink-0 text-right text-[11px] font-black text-slate-400 sm:text-xs">
                      {row.find(seat => seat)?.rowLabel ?? ''}
                    </span>
                    {row.map((seat, colIndex) =>
                      seat ? (
                        <button
                          key={seat.seatId}
                          onClick={() => toggleSeat(seat)}
                          disabled={seat.status !== 'AVAILABLE' || holdActive}
                          title={`${seat.rowLabel}${seat.seatNumber} - ${formatMoney(seat.price)}`}
                          className={`size-8 rounded-lg border text-[11px] font-black transition-colors sm:size-9 sm:text-xs ${getSeatStyle(seat)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      ) : (
                        <div key={`${rowIndex}-${colIndex}`} className="size-8 sm:size-9" />
                      )
                    )}
                    <span className="ml-2 w-6 shrink-0 text-left text-[11px] font-black text-slate-400 sm:text-xs">
                      {row.find(seat => seat)?.rowLabel ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/8">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-bold text-slate-600 dark:text-neutral-400 sm:text-xs">
                {[
                  { className: 'bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-white/10', label: 'Ghế thường' },
                  { className: 'bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/20', label: 'VIP' },
                  { className: 'bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-400/20', label: 'Couple' },
                  { className: 'bg-slate-950 dark:bg-white border border-slate-950 dark:border-white', label: 'Đang chọn' },
                  { className: 'bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30', label: 'Đang giữ' },
                  { className: 'bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30', label: 'Đã đặt' },
                ].map(item => (
                  <span key={item.label} className="flex items-center gap-2.5">
                    <span className={`size-4 shrink-0 rounded-md ${item.className}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {wsConnected && (
              <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Radio size={12} className="animate-pulse" /> Trạng thái ghế đang được cập nhật
              </div>
            )}
          </section>

          <aside className="h-fit cinema-card p-5 lg:sticky lg:top-24 lg:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Ticket size={18} />
              </span>
              <div>
                <p className="text-base font-black text-slate-950 dark:text-white">Ghế đã chọn</p>
                <p className="text-[11px] font-semibold cinema-muted">
                  {holdActive ? 'Đang giữ ghế cho bạn' : 'Chọn ghế để tiếp tục'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-4 dark:bg-neutral-950">
              <p className="cinema-label">Danh sách ghế</p>
              <div className="mt-3 flex min-h-10 flex-wrap gap-2">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map(seat => (
                    <span
                      key={seat.seatId}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10"
                    >
                      {seat.rowLabel}{seat.seatNumber}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold cinema-muted">Chưa chọn ghế</span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold cinema-muted">
                <span>Số lượng</span>
                <span>{selectedSeats.length} ghế</span>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-white/8">
                <span className="text-sm font-semibold text-slate-950 dark:text-white">Tổng tiền</span>
                <span className="text-2xl font-black text-slate-950 dark:text-white">
                  {formatMoney(totalPrice)}
                </span>
              </div>
            </div>

            <button
              onClick={handleContinueToCheckout}
              disabled={(holdActive ? heldSeats.length === 0 : selected.length === 0) || isSubmitting}
              className="btn-primary mt-6 w-full"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
              Tiếp tục thanh toán
            </button>

            {holdActive && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-emerald-50 p-3 text-[11px] font-semibold leading-relaxed text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 shrink-0" size={14} />
                Ghế đang được giữ. Hoàn tất thanh toán trước khi hết thời gian.
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
};

export default SeatSelectionPage;
