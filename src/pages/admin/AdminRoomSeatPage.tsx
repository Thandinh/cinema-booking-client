import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Armchair,
  ChevronRight,
  DoorOpen,
  Edit3,
  Grid3X3,
  Layers3,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import { roomSeatApi, type RoomResponse, type SeatLayoutTemplate, type SeatResponse, type SeatType } from '../../api/roomSeatApi';
import { toast } from '../../components/ui/Toast';

type RoomModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  room: RoomResponse | null;
  name: string;
};

type BulkFormState = {
  rowLabels: string;
  seatsPerRow: string;
  layoutTemplate: SeatLayoutTemplate;
  seatType: SeatType;
  priceMultiplier: string;
  skipExisting: boolean;
};

type SeatPreviewRow = {
  label: string;
  seats: Array<{
    seatNumber: number;
    seatType: SeatType;
  }>;
};

const SEAT_TYPE_META: Record<SeatType, { label: string; multiplier: number; className: string; dotClassName: string }> = {
  NORMAL: {
    label: 'Thường',
    multiplier: 1,
    className: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-white/10',
    dotClassName: 'bg-slate-400',
  },
  VIP: {
    label: 'VIP',
    multiplier: 1.5,
    className: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25',
    dotClassName: 'bg-amber-500',
  },
  COUPLE: {
    label: 'Couple',
    multiplier: 1.8,
    className: 'bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25',
    dotClassName: 'bg-rose-500',
  },
};

const emptyRoomModal: RoomModalState = {
  open: false,
  mode: 'create',
  room: null,
  name: '',
};

const defaultBulkForm: BulkFormState = {
  rowLabels: 'A,B,C,D,E,F,G,H',
  seatsPerRow: '12',
  layoutTemplate: 'STANDARD_CINEMA',
  seatType: 'NORMAL',
  priceMultiplier: '1',
  skipExisting: true,
};

const AdminRoomSeatPage = () => {
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [cinemaKeyword, setCinemaKeyword] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomModal, setRoomModal] = useState<RoomModalState>(emptyRoomModal);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkFormState>(defaultBulkForm);
  const [selectedSeat, setSelectedSeat] = useState<SeatResponse | null>(null);
  const [seatType, setSeatType] = useState<SeatType>('NORMAL');
  const [seatMultiplier, setSeatMultiplier] = useState('1');
  const bulkPreviewRows = useMemo(() => buildBulkPreview(bulkForm), [bulkForm]);
  const bulkPreviewStats = useMemo(() => getBulkPreviewStats(bulkPreviewRows), [bulkPreviewRows]);
  const bulkPreviewTotal = bulkPreviewStats.normal + bulkPreviewStats.vip + bulkPreviewStats.couple;

  const { data: cinemaPage, isLoading: loadingCinemas } = useQuery({
    queryKey: ['admin-room-seat-cinemas'],
    queryFn: () => cinemaApi.getAll({ page: 0, size: 500 }).then(response => response.data.result),
  });

  const cinemas = useMemo(() => cinemaPage?.content ?? [], [cinemaPage?.content]);
  const cityOptions = useMemo(() => {
    return Array.from(new Set(
      cinemas
        .map(cinema => cinema.city?.trim())
        .filter((city): city is string => Boolean(city))
    )).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [cinemas]);

  const filteredCinemas = useMemo(() => {
    const keyword = cinemaKeyword.trim().toLowerCase();
    return cinemas.filter(cinema => {
      const city = cinema.city?.trim() ?? '';
      const matchesCity = selectedCity === 'ALL' || city === selectedCity;
      const matchesKeyword = !keyword
        || cinema.name.toLowerCase().includes(keyword)
        || cinema.address?.toLowerCase().includes(keyword);

      return matchesCity && matchesKeyword;
    });
  }, [cinemaKeyword, cinemas, selectedCity]);

  useEffect(() => {
    if (filteredCinemas.length === 0) {
      if (selectedCinemaId) {
        setSelectedCinemaId('');
        setSelectedRoomId('');
        setSelectedSeat(null);
      }
      return;
    }

    if (!selectedCinemaId || !filteredCinemas.some(cinema => cinema.id === selectedCinemaId)) {
      setSelectedCinemaId(filteredCinemas[0].id);
      setSelectedRoomId('');
      setSelectedSeat(null);
    }
  }, [filteredCinemas, selectedCinemaId]);

  const selectedCinema = cinemas.find(cinema => cinema.id === selectedCinemaId) ?? null;

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['admin-rooms', selectedCinemaId],
    queryFn: () => roomSeatApi.getRoomsByCinema(selectedCinemaId).then(response => response.data.result),
    enabled: Boolean(selectedCinemaId),
  });

  useEffect(() => {
    if (rooms.length === 0) {
      setSelectedRoomId('');
      return;
    }
    if (!selectedRoomId || !rooms.some(room => room.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const selectedRoom = rooms.find(room => room.id === selectedRoomId) ?? null;

  const { data: seats = [], isLoading: loadingSeats } = useQuery({
    queryKey: ['admin-room-seats', selectedRoomId],
    queryFn: () => roomSeatApi.getSeatsByRoom(selectedRoomId).then(response => response.data.result),
    enabled: Boolean(selectedRoomId),
  });

  useEffect(() => {
    if (selectedSeat && !seats.some(seat => seat.id === selectedSeat.id)) {
      setSelectedSeat(null);
    }
  }, [seats, selectedSeat]);

  const createRoomMutation = useMutation({
    mutationFn: (payload: { cinemaId: string; name: string }) => roomSeatApi.createRoom(payload),
    onSuccess: (response) => {
      toast.success('Đã tạo phòng chiếu');
      setRoomModal(emptyRoomModal);
      queryClient.invalidateQueries({ queryKey: ['admin-rooms', selectedCinemaId] });
      setSelectedRoomId(response.data.result.id);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tạo phòng chiếu'),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => roomSeatApi.updateRoom(id, { name }),
    onSuccess: () => {
      toast.success('Đã cập nhật phòng chiếu');
      setRoomModal(emptyRoomModal);
      queryClient.invalidateQueries({ queryKey: ['admin-rooms', selectedCinemaId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể cập nhật phòng chiếu'),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => roomSeatApi.deleteRoom(id),
    onSuccess: () => {
      toast.success('Đã xóa phòng chiếu');
      setSelectedSeat(null);
      queryClient.invalidateQueries({ queryKey: ['admin-rooms', selectedCinemaId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể xóa phòng chiếu'),
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: () => roomSeatApi.bulkGenerateSeats(buildBulkPayload(selectedRoomId, bulkForm)),
    onSuccess: (response) => {
      const result = response.data.result;
      toast.success(`Đã tạo ${result.totalCreated} ghế, bỏ qua ${result.totalSkipped} ghế, đồng bộ ${result.totalSeatStatusesCreated} trạng thái`);
      setBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-room-seats', selectedRoomId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể sinh ghế'),
  });

  const updateSeatMutation = useMutation({
    mutationFn: (seat: SeatResponse) =>
      roomSeatApi.updateSeat(seat.id, {
        seatType,
        priceMultiplier: Number(seatMultiplier || SEAT_TYPE_META[seatType].multiplier),
      }),
    onSuccess: (response) => {
      toast.success('Đã cập nhật ghế');
      setSelectedSeat(response.data.result);
      queryClient.invalidateQueries({ queryKey: ['admin-room-seats', selectedRoomId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể cập nhật ghế'),
  });

  const deleteSeatMutation = useMutation({
    mutationFn: (id: string) => roomSeatApi.deleteSeat(id),
    onSuccess: () => {
      toast.success('Đã xóa ghế');
      setSelectedSeat(null);
      queryClient.invalidateQueries({ queryKey: ['admin-room-seats', selectedRoomId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể xóa ghế đang được giữ/đã đặt'),
  });

  const seatGrid = useMemo(() => buildSeatGrid(seats), [seats]);
  const seatStats = useMemo(() => getSeatStats(seats), [seats]);

  const openCreateRoom = () => {
    setRoomModal({ open: true, mode: 'create', room: null, name: '' });
  };

  const openEditRoom = (room: RoomResponse) => {
    setRoomModal({ open: true, mode: 'edit', room, name: room.name });
  };

  const submitRoom = (event: FormEvent) => {
    event.preventDefault();
    const name = roomModal.name.trim();
    if (!name) {
      toast.error('Vui lòng nhập tên phòng chiếu');
      return;
    }

    if (roomModal.mode === 'edit' && roomModal.room) {
      updateRoomMutation.mutate({ id: roomModal.room.id, name });
      return;
    }

    if (!selectedCinemaId) {
      toast.error('Vui lòng chọn rạp trước');
      return;
    }
    createRoomMutation.mutate({ cinemaId: selectedCinemaId, name });
  };

  const handleSelectSeat = (seat: SeatResponse) => {
    setSelectedSeat(seat);
    setSeatType(seat.seatType);
    setSeatMultiplier(String(seat.priceMultiplier ?? SEAT_TYPE_META[seat.seatType].multiplier));
  };

  return (
    <>
      <Helmet>
        <title>Phòng & ghế - cinemabooking.vn</title>
      </Helmet>

      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
              <Layers3 size={14} />
              Room & seat ops
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Phòng chiếu & sơ đồ ghế</h1>
            <p className="mt-1 text-sm cinema-muted">
              Quản lý phòng, sinh sơ đồ ghế hàng loạt và cập nhật loại ghế theo từng phòng chiếu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SummaryCard label="Phòng" value={rooms.length} />
            <SummaryCard label="Ghế" value={seats.length} />
            <SummaryCard label="VIP/Couple" value={seatStats.vip + seatStats.couple} />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <section className="cinema-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-500">Rạp chiếu</h2>
              </div>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Thành phố</span>
                <select
                  value={selectedCity}
                  onChange={(event) => {
                    setSelectedCity(event.target.value);
                    setCinemaKeyword('');
                    setSelectedSeat(null);
                  }}
                  className="cinema-input h-10"
                >
                  <option value="ALL">Tất cả thành phố</option>
                  {cityOptions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <div className="mb-3 flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
                <Search size={15} className="text-slate-400" />
                <input
                  value={cinemaKeyword}
                  onChange={(event) => setCinemaKeyword(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none dark:text-white"
                  placeholder="Tìm rạp..."
                />
              </div>

              <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                <span>{selectedCity === 'ALL' ? 'Tất cả rạp' : selectedCity}</span>
                <span>{filteredCinemas.length} rạp</span>
              </div>

              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {loadingCinemas ? (
                  <LoadingLine label="Đang tải rạp..." />
                ) : filteredCinemas.length === 0 ? (
                  <p className="py-6 text-center text-sm font-semibold cinema-muted">Không có rạp phù hợp.</p>
                ) : filteredCinemas.map(cinema => (
                  <button
                    key={cinema.id}
                    type="button"
                    onClick={() => {
                      setSelectedCinemaId(cinema.id);
                      setSelectedSeat(null);
                    }}
                    className={`w-full rounded-lg p-3 text-left ring-1 transition-colors ${
                      selectedCinemaId === cinema.id
                        ? 'bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-slate-950 dark:ring-white'
                        : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{cinema.name}</p>
                        <p className={`mt-1 truncate text-xs font-semibold ${selectedCinemaId === cinema.id ? 'opacity-75' : 'cinema-muted'}`}>
                          {cinema.city || cinema.address || 'Chưa có địa chỉ'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 opacity-60" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="cinema-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-500">Phòng chiếu</h2>
                  {selectedCinema && <p className="mt-1 truncate text-xs font-semibold cinema-muted">{selectedCinema.name}</p>}
                </div>
                <button type="button" onClick={openCreateRoom} disabled={!selectedCinemaId} className="grid size-9 place-items-center rounded-lg bg-slate-950 text-white disabled:opacity-40 dark:bg-white dark:text-slate-950" title="Thêm phòng">
                  <Plus size={16} />
                </button>
              </div>

              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {loadingRooms ? (
                  <LoadingLine label="Đang tải phòng..." />
                ) : rooms.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center dark:border-white/10">
                    <DoorOpen className="mx-auto text-slate-300" size={28} />
                    <p className="mt-2 text-sm font-semibold cinema-muted">Rạp này chưa có phòng chiếu.</p>
                    <button type="button" onClick={openCreateRoom} className="btn-primary mt-3 h-9 px-3 text-xs">
                      <Plus size={14} />
                      Tạo phòng
                    </button>
                  </div>
                ) : rooms.map(room => (
                  <div
                    key={room.id}
                    className={`rounded-lg p-3 ring-1 transition-colors ${
                      selectedRoomId === room.id
                        ? 'bg-amber-50 ring-amber-200 dark:bg-amber-400/10 dark:ring-amber-400/25'
                        : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:ring-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <button type="button" onClick={() => { setSelectedRoomId(room.id); setSelectedSeat(null); }} className="w-full text-left">
                      <p className="font-black text-slate-950 dark:text-white">{room.name}</p>
                      <p className="mt-1 text-xs font-semibold cinema-muted">#{room.id.slice(0, 8).toUpperCase()}</p>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => openEditRoom(room)} className="btn-ghost !h-8 flex-1 !px-2 !text-xs">
                        <Edit3 size={13} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa phòng ${room.name}?`)) deleteRoomMutation.mutate(room.id);
                        }}
                        className="btn-ghost !h-8 flex-1 !px-2 !text-xs hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/10 dark:hover:!text-red-300"
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-5">
            <section className="cinema-card overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-white/5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">
                    {selectedRoom ? `Sơ đồ ghế - ${selectedRoom.name}` : 'Sơ đồ ghế'}
                  </h2>
                  <p className="mt-1 text-sm cinema-muted">
                    {selectedRoom ? `${selectedCinema?.name ?? ''} · ${seats.length} ghế` : 'Chọn phòng chiếu để xem sơ đồ ghế.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={!selectedRoomId} onClick={() => setBulkOpen(true)} className="btn-primary h-10 px-4 disabled:opacity-50">
                    <Wand2 size={16} />
                    Sinh ghế
                  </button>
                </div>
              </div>

              <div className="p-5">
                {!selectedRoom ? (
                  <EmptyState title="Chưa chọn phòng" description="Chọn một phòng chiếu bên trái để quản lý sơ đồ ghế." />
                ) : loadingSeats ? (
                  <div className="py-20"><LoadingLine label="Đang tải ghế..." /></div>
                ) : seats.length === 0 ? (
                  <EmptyState title="Phòng chưa có ghế" description="Dùng nút Sinh ghế để tạo nhanh sơ đồ ghế tiêu chuẩn cho phòng chiếu." />
                ) : (
                  <>
                    <div className="mb-5 flex flex-wrap gap-3">
                      {(Object.keys(SEAT_TYPE_META) as SeatType[]).map(type => (
                        <div key={type} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-950 dark:text-neutral-300 dark:ring-white/10">
                          <span className={`size-2 rounded-full ${SEAT_TYPE_META[type].dotClassName}`} />
                          {SEAT_TYPE_META[type].label}
                        </div>
                      ))}
                    </div>

                    <div className="mb-5 rounded-xl bg-slate-950 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.24em] text-white shadow-inner dark:bg-white dark:text-slate-950">
                      Màn hình
                    </div>

                    <div className="overflow-x-auto pb-2">
                      <div className="mx-auto w-max min-w-full space-y-2">
                        {seatGrid.map(row => (
                          <div key={row.label} className="grid items-center gap-2" style={{ gridTemplateColumns: `32px repeat(${row.seats.length}, minmax(42px, 1fr))` }}>
                            <div className="text-center text-xs font-black text-slate-400">{row.label}</div>
                            {row.seats.map(seat => (
                              <button
                                key={seat.id}
                                type="button"
                                onClick={() => handleSelectSeat(seat)}
                                className={`h-10 min-w-10 rounded-lg text-xs font-black ring-1 transition-transform hover:-translate-y-0.5 ${
                                  selectedSeat?.id === seat.id
                                    ? 'bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-slate-950 dark:ring-white'
                                    : SEAT_TYPE_META[seat.seatType].className
                                }`}
                                title={`${seat.seatCode} · ${SEAT_TYPE_META[seat.seatType].label}`}
                              >
                                {seat.seatNumber}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="cinema-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-500">
                  <Grid3X3 size={16} />
                  Thống kê ghế
                </h3>
                <div className="grid gap-3 sm:grid-cols-4">
                  <SeatStat label="Tổng ghế" value={seats.length} />
                  <SeatStat label="Thường" value={seatStats.normal} />
                  <SeatStat label="VIP" value={seatStats.vip} />
                  <SeatStat label="Couple" value={seatStats.couple} />
                </div>
              </div>

              <div className="cinema-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-slate-500 dark:text-neutral-500">
                  <Armchair size={16} />
                  Chi tiết ghế
                </h3>

                {selectedSeat ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-black text-slate-950 dark:text-white">{selectedSeat.seatCode}</p>
                      <p className="mt-1 text-xs font-semibold cinema-muted">Hàng {selectedSeat.rowLabel}, ghế {selectedSeat.seatNumber}</p>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Loại ghế</span>
                      <select
                        value={seatType}
                        onChange={(event) => {
                          const nextType = event.target.value as SeatType;
                          setSeatType(nextType);
                          setSeatMultiplier(String(SEAT_TYPE_META[nextType].multiplier));
                        }}
                        className="cinema-input"
                      >
                        <option value="NORMAL">Thường</option>
                        <option value="VIP">VIP</option>
                        <option value="COUPLE">Couple</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Hệ số giá</span>
                      <input type="number" min="0" step="0.1" value={seatMultiplier} onChange={(event) => setSeatMultiplier(event.target.value)} className="cinema-input" />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => updateSeatMutation.mutate(selectedSeat)} disabled={updateSeatMutation.isPending} className="btn-primary h-10 px-3 disabled:opacity-50">
                        {updateSeatMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa ghế ${selectedSeat.seatCode}?`)) deleteSeatMutation.mutate(selectedSeat.id);
                        }}
                        disabled={deleteSeatMutation.isPending}
                        className="btn-ghost h-10 px-3 hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/10 dark:hover:!text-red-300 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold cinema-muted">Chọn một ghế trên sơ đồ để chỉnh loại ghế và hệ số giá.</p>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      {roomModal.open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitRoom} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{roomModal.mode === 'edit' ? 'Sửa phòng chiếu' : 'Thêm phòng chiếu'}</h2>
              <button type="button" onClick={() => setRoomModal(emptyRoomModal)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={17} />
              </button>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tên phòng</span>
              <input value={roomModal.name} onChange={(event) => setRoomModal(value => ({ ...value, name: event.target.value }))} className="cinema-input" placeholder="Phòng 01" autoFocus />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRoomModal(emptyRoomModal)} className="btn-ghost h-10 px-4">Hủy</button>
              <button type="submit" disabled={createRoomMutation.isPending || updateRoomMutation.isPending} className="btn-primary h-10 px-4 disabled:opacity-50">
                {(createRoomMutation.isPending || updateRoomMutation.isPending) && <Loader2 size={15} className="animate-spin" />}
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              bulkGenerateMutation.mutate();
            }}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Sinh sơ đồ ghế</h2>
                <p className="mt-1 text-xs font-semibold cinema-muted">{selectedRoom?.name}</p>
              </div>
              <button type="button" onClick={() => setBulkOpen(false)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Hàng ghế</span>
                <input value={bulkForm.rowLabels} onChange={(event) => setBulkForm(value => ({ ...value, rowLabels: event.target.value }))} className="cinema-input" placeholder="A,B,C,D,E,F,G,H" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Ghế mỗi hàng</span>
                  <input type="number" min="1" max="50" value={bulkForm.seatsPerRow} onChange={(event) => setBulkForm(value => ({ ...value, seatsPerRow: event.target.value }))} className="cinema-input" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Kiểu layout</span>
                  <select value={bulkForm.layoutTemplate} onChange={(event) => setBulkForm(value => ({ ...value, layoutTemplate: event.target.value as SeatLayoutTemplate }))} className="cinema-input">
                    <option value="STANDARD_CINEMA">Chuẩn rạp: Thường / VIP / Couple</option>
                    <option value="CUSTOM">Tùy chỉnh một loại ghế</option>
                  </select>
                </label>
              </div>
              {bulkForm.layoutTemplate === 'STANDARD_CINEMA' ? (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
                  Layout chuẩn sẽ tự chia: các hàng đầu là ghế Thường, 2 hàng gần cuối là VIP, hàng cuối là Couple. Ghế mới cũng được tự động đồng bộ vào các suất chiếu tương lai của phòng này.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Loại ghế</span>
                  <select value={bulkForm.seatType} onChange={(event) => {
                    const nextType = event.target.value as SeatType;
                    setBulkForm(value => ({ ...value, seatType: nextType, priceMultiplier: String(SEAT_TYPE_META[nextType].multiplier) }));
                  }} className="cinema-input">
                    <option value="NORMAL">Thường</option>
                    <option value="VIP">VIP</option>
                    <option value="COUPLE">Couple</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Hệ số giá</span>
                  <input type="number" min="0" step="0.1" value={bulkForm.priceMultiplier} onChange={(event) => setBulkForm(value => ({ ...value, priceMultiplier: event.target.value }))} className="cinema-input" />
                </label>
                </div>
              )}
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-neutral-300">
                <input type="checkbox" checked={bulkForm.skipExisting} onChange={(event) => setBulkForm(value => ({ ...value, skipExisting: event.target.checked }))} className="size-4 accent-amber-500" />
                Bỏ qua ghế đã tồn tại
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-neutral-950">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">Xem trước sơ đồ</h3>
                    <p className="mt-0.5 text-xs font-semibold cinema-muted">
                      {bulkPreviewRows.length} hàng · {bulkPreviewTotal} ghế
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-black">
                    <PreviewStat label="Thường" value={bulkPreviewStats.normal} seatType="NORMAL" />
                    <PreviewStat label="VIP" value={bulkPreviewStats.vip} seatType="VIP" />
                    <PreviewStat label="Couple" value={bulkPreviewStats.couple} seatType="COUPLE" />
                  </div>
                </div>
                {bulkPreviewRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm font-semibold cinema-muted dark:border-white/10">
                    Nhập hàng ghế và số ghế mỗi hàng để xem trước.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-auto rounded-lg bg-white p-3 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
                    <div className="mb-3 rounded-lg bg-slate-950 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-950">
                      Màn hình
                    </div>
                    <div className="w-max min-w-full space-y-1.5">
                      {bulkPreviewRows.map(row => (
                        <div key={row.label} className="grid items-center gap-1.5" style={{ gridTemplateColumns: `28px repeat(${row.seats.length}, minmax(34px, 1fr))` }}>
                          <div className="text-center text-[11px] font-black text-slate-400">{row.label}</div>
                          {row.seats.map(seat => (
                            <div
                              key={`${row.label}-${seat.seatNumber}`}
                              className={`grid h-8 min-w-8 place-items-center rounded-md text-[11px] font-black ring-1 ${SEAT_TYPE_META[seat.seatType].className}`}
                            >
                              {seat.seatNumber}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setBulkOpen(false)} className="btn-ghost h-10 px-4">Hủy</button>
              <button type="submit" disabled={bulkGenerateMutation.isPending || !selectedRoomId || bulkPreviewTotal === 0} className="btn-primary h-10 px-4 disabled:opacity-50">
                {bulkGenerateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                Xác nhận sinh ghế
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/10">
    {label} <span className="font-black text-slate-950 dark:text-white">{value}</span>
  </div>
);

const SeatStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

const PreviewStat = ({ label, value, seatType }: { label: string; value: number; seatType: SeatType }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
    <span className={`size-2 rounded-full ${SEAT_TYPE_META[seatType].dotClassName}`} />
    {label}: {value}
  </span>
);

const LoadingLine = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold cinema-muted">
    <Loader2 size={16} className="animate-spin text-amber-500" />
    {label}
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-white/10">
    <Armchair className="mx-auto text-slate-300 dark:text-neutral-700" size={36} />
    <p className="mt-3 font-black text-slate-950 dark:text-white">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm font-semibold cinema-muted">{description}</p>
  </div>
);

function buildBulkPayload(roomId: string, form: BulkFormState) {
  const rowLabels = normalizeRowLabels(form.rowLabels);

  return {
    roomId,
    rowLabels,
    seatsPerRow: Number(form.seatsPerRow || 0),
    layoutTemplate: form.layoutTemplate,
    seatType: form.seatType,
    priceMultiplier: Number(form.priceMultiplier || SEAT_TYPE_META[form.seatType].multiplier),
    skipExisting: form.skipExisting,
  };
}

function buildBulkPreview(form: BulkFormState): SeatPreviewRow[] {
  const rowLabels = normalizeRowLabels(form.rowLabels);
  const parsedSeatsPerRow = Number(form.seatsPerRow || 0);
  const seatsPerRow = Number.isFinite(parsedSeatsPerRow)
    ? Math.max(0, Math.min(50, parsedSeatsPerRow))
    : 0;

  if (rowLabels.length === 0 || seatsPerRow === 0) {
    return [];
  }

  return rowLabels.map((label, rowIndex) => ({
    label,
    seats: Array.from({ length: seatsPerRow }, (_, index) => ({
      seatNumber: index + 1,
      seatType: resolvePreviewSeatType(form.layoutTemplate, rowIndex, rowLabels.length, form.seatType),
    })),
  }));
}

function normalizeRowLabels(value: string) {
  return Array.from(new Set(
    value
      .split(',')
      .map(label => label.trim().toUpperCase())
      .filter(Boolean)
  ));
}

function resolvePreviewSeatType(
  layoutTemplate: SeatLayoutTemplate,
  rowIndex: number,
  totalRows: number,
  fallbackSeatType: SeatType
): SeatType {
  if (layoutTemplate !== 'STANDARD_CINEMA' || totalRows < 4) {
    return fallbackSeatType;
  }
  if (rowIndex === totalRows - 1) {
    return 'COUPLE';
  }
  if (rowIndex >= totalRows - 3) {
    return 'VIP';
  }
  return 'NORMAL';
}

function buildSeatGrid(seats: SeatResponse[]) {
  const sortedSeats = [...seats].sort((a, b) => {
    const rowA = a.rowIndex ?? a.rowLabel.charCodeAt(0);
    const rowB = b.rowIndex ?? b.rowLabel.charCodeAt(0);
    if (rowA !== rowB) return rowA - rowB;
    return (a.colIndex ?? a.seatNumber) - (b.colIndex ?? b.seatNumber);
  });

  const rows = new Map<string, SeatResponse[]>();
  sortedSeats.forEach(seat => {
    const key = seat.rowLabel;
    rows.set(key, [...(rows.get(key) ?? []), seat]);
  });

  return Array.from(rows.entries()).map(([label, rowSeats]) => ({
    label,
    seats: rowSeats,
  }));
}

function getBulkPreviewStats(rows: SeatPreviewRow[]) {
  return rows.reduce(
    (acc, row) => {
      row.seats.forEach(seat => {
        if (seat.seatType === 'VIP') acc.vip += 1;
        else if (seat.seatType === 'COUPLE') acc.couple += 1;
        else acc.normal += 1;
      });
      return acc;
    },
    { normal: 0, vip: 0, couple: 0 }
  );
}

function getSeatStats(seats: SeatResponse[]) {
  return seats.reduce(
    (acc, seat) => {
      if (seat.seatType === 'VIP') acc.vip += 1;
      else if (seat.seatType === 'COUPLE') acc.couple += 1;
      else acc.normal += 1;
      return acc;
    },
    { normal: 0, vip: 0, couple: 0 }
  );
}

export default AdminRoomSeatPage;
