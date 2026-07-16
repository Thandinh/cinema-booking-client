import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleSlash,
  Clapperboard,
  DoorOpen,
  Download,
  Loader2,
  MapPin,
  QrCode,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';
import type { BookingDetailResponse } from '../../types/domain.types';
import { formatDateTime, formatMoney } from '../../utils/format';

const TICKET_STATUS = {
  ACTIVE: {
    label: 'Có thể check-in',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
    icon: CheckCircle2,
  },
  USED: {
    label: 'Đã sử dụng',
    className: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-neutral-400 dark:ring-white/10',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
    icon: CircleSlash,
  },
};

type TicketImageMeta = {
  movieTitle: string;
  cinemaName: string;
  fullCinemaAddress?: string;
  roomName: string;
  startTime: string;
  bookingCode: string;
};

const TicketDetailPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId!).then(response => response.data.result),
    enabled: Boolean(bookingId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải vé...
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center">
        <div className="mb-4 grid size-16 place-items-center rounded-lg bg-red-50 dark:bg-red-500/10">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-lg font-black text-slate-950 dark:text-white">Không tìm thấy vé</p>
        <p className="mt-2 text-sm cinema-muted">Vé này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link to="/my/bookings" className="btn-primary mt-6">
          Về Vé của tôi
        </Link>
      </div>
    );
  }

  const tickets = [...(booking.bookingDetails ?? [])].sort((a, b) =>
    `${a.rowLabel}${a.seatNumber}`.localeCompare(`${b.rowLabel}${b.seatNumber}`, 'vi', { numeric: true })
  );
  const seatsLabel = tickets.length > 0
    ? tickets.map(ticket => `${ticket.rowLabel}${ticket.seatNumber}`).join(', ')
    : '-';
  const isSuccess = booking.status === 'SUCCESS';
  const activeTickets = tickets.filter(ticket => ticket.ticketStatus === 'ACTIVE').length;
  const usedTickets = tickets.filter(ticket => ticket.ticketStatus === 'USED').length;
  const fullCinemaAddress = formatFullAddress(booking.cinemaAddress, booking.cinemaCity);
  const ticketMeta: TicketImageMeta = {
    movieTitle: booking.movieTitle,
    cinemaName: booking.cinemaName,
    fullCinemaAddress,
    roomName: booking.roomName,
    startTime: booking.startTime,
    bookingCode: booking.id.slice(0, 12).toUpperCase(),
  };

  return (
    <>
      <Helmet>
        <title>{booking.movieTitle} - Vé điện tử | cinemabooking.vn</title>
      </Helmet>

      <div className="page-container py-8">
        <Link
          to="/my/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400"
        >
          <ArrowLeft size={16} /> Quay lại Vé của tôi
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <div className="bg-slate-950 p-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                    cinemabooking.vn - E-Ticket
                  </p>
                  <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
                    {booking.movieTitle}
                  </h1>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black ${
                  isSuccess
                    ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30'
                    : 'bg-amber-400/20 text-amber-100 ring-1 ring-amber-400/30'
                }`}>
                  {isSuccess && <CheckCircle2 size={13} />}
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="border-y border-dashed border-slate-200 bg-slate-50 px-6 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-600">
              Thông tin đặt vé
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <TicketField icon={MapPin} label="Rạp chiếu" value={booking.cinemaName} />
              {fullCinemaAddress && (
                <TicketField icon={MapPin} label="Địa chỉ" value={fullCinemaAddress} />
              )}
              <TicketField icon={DoorOpen} label="Phòng chiếu" value={booking.roomName} />
              <TicketField icon={CalendarDays} label="Suất chiếu" value={formatDateTime(booking.startTime)} />
              <TicketField icon={Ticket} label="Ghế" value={seatsLabel} highlight />
              <TicketField icon={Clapperboard} label="Mã booking" value={`#${booking.id.slice(0, 12).toUpperCase()}`} mono />
            </div>

            <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 p-6 dark:border-white/8 dark:bg-neutral-950/60 sm:grid-cols-3">
              <SummaryItem label="Tổng thanh toán" value={formatMoney(booking.totalPrice)} highlight />
              <SummaryItem label="Số vé" value={`${tickets.length} vé`} />
              <SummaryItem label="Check-in" value={`${usedTickets}/${tickets.length} đã dùng`} />
            </div>

            {booking.status === 'PENDING' && (
              <div className="border-t border-slate-100 p-6 dark:border-white/8">
                <Link to={`/checkout/${booking.id}`} className="btn-primary">
                  Thanh toán ngay
                </Link>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-white/8">
                <div>
                  <p className="cinema-label">Vé theo ghế</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {activeTickets} vé sẵn sàng check-in
                  </p>
                </div>
                <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <QrCode size={18} />
                </span>
              </div>

              <div className="max-h-[min(680px,calc(100vh-220px))] space-y-3 overflow-y-auto p-3 overscroll-contain">
                {tickets.map(ticket => (
                  <SeatTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    bookingSuccess={isSuccess}
                    ticketMeta={ticketMeta}
                  />
                ))}
              </div>
            </section>

            <Link to="/my/bookings" className="btn-ghost w-full !justify-center">
              Xem tất cả vé
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
};

const SeatTicketCard = ({
  ticket,
  bookingSuccess,
  ticketMeta,
}: {
  ticket: BookingDetailResponse;
  bookingSuccess: boolean;
  ticketMeta: TicketImageMeta;
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const status = ticket.ticketStatus ?? (bookingSuccess ? 'ACTIVE' : undefined);
  const config = status ? TICKET_STATUS[status as keyof typeof TICKET_STATUS] : null;
  const StatusIcon = config?.icon;
  const seatLabel = `${ticket.rowLabel}${ticket.seatNumber}`;

  const handleSaveTicket = async () => {
    if (!ticket.ticketQrImage) return;

    setIsSaving(true);
    try {
      await downloadTicketImage(ticket, ticketMeta);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/8">
        <div>
          <p className="text-lg font-black text-slate-950 dark:text-white">Ghế {seatLabel}</p>
          <p className="text-xs font-semibold cinema-muted">{ticket.seatType ?? 'STANDARD'} - {formatMoney(ticket.priceAtBooking)}</p>
        </div>
        {config && StatusIcon && (
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black ring-1 ${config.className}`}>
            <StatusIcon size={12} />
            {config.label}
          </span>
        )}
      </div>

      <div className="p-4 text-center">
        <div className="mx-auto grid size-56 place-items-center rounded-lg bg-white p-3 ring-1 ring-slate-200 dark:ring-white/10">
          {ticket.ticketQrImage ? (
            <img
              src={ticket.ticketQrImage}
              alt={`QR check-in ghế ${seatLabel}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="px-4 text-center text-xs font-bold text-slate-500">
              QR sẽ hiển thị sau khi thanh toán thành công.
            </div>
          )}
        </div>

        <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">
          Mã check-in riêng cho ghế {seatLabel}
        </p>
        <p className="mt-2 break-all rounded-lg bg-slate-50 p-2.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
          {ticket.ticketQrCode ?? 'Chưa có QR'}
        </p>
        {ticket.ticketCheckInTime && (
          <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Đã check-in lúc {formatDateTime(ticket.ticketCheckInTime)}
          </p>
        )}

        <button
          type="button"
          onClick={handleSaveTicket}
          disabled={!ticket.ticketQrImage || isSaving}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-black text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-400 dark:disabled:bg-white/10 dark:disabled:text-neutral-500"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Lưu vé PNG
        </button>
      </div>
    </article>
  );
};

const TicketField = ({
  icon: Icon,
  label,
  value,
  highlight,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) => (
  <div className="rounded-lg bg-slate-50 p-4 dark:bg-neutral-950">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-white text-amber-500 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="cinema-label">{label}</p>
        <p className={`mt-1.5 text-[13px] font-black leading-snug ${
          highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-white'
        } ${mono ? 'font-mono tracking-wide' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

const SummaryItem = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div>
    <p className="cinema-label">{label}</p>
    <p className={`mt-1 text-base font-black ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

const downloadTicketImage = async (ticket: BookingDetailResponse, meta: TicketImageMeta) => {
  const qrImage = ticket.ticketQrImage;
  if (!qrImage) return;

  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1520;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const seatLabel = `${ticket.rowLabel}${ticket.seatNumber}`;
  const padding = 84;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#020617';
  roundedRect(ctx, 40, 40, 820, 1440, 28);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, 56, 56, 788, 1408, 22);
  ctx.fill();

  ctx.fillStyle = '#020617';
  roundedRect(ctx, 56, 56, 788, 190, 22);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText('CINEMABOOKING - E-TICKET', padding, 112);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 40px Arial, sans-serif';
  drawWrappedText(ctx, meta.movieTitle, padding, 166, 700, 46, 2);

  const qr = await loadCanvasImage(qrImage);
  ctx.fillStyle = '#f8fafc';
  roundedRect(ctx, 215, 290, 470, 470, 24);
  ctx.fill();
  ctx.drawImage(qr, 245, 320, 410, 410);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 46px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Ghế ${seatLabel}`, 450, 830);
  ctx.textAlign = 'left';

  const infoRows = [
    ['Rạp chiếu', meta.cinemaName],
    ...(meta.fullCinemaAddress ? [['Địa chỉ', meta.fullCinemaAddress]] : []),
    ['Phòng chiếu', meta.roomName],
    ['Suất chiếu', formatDateTime(meta.startTime)],
    ['Loại ghế', ticket.seatType ?? 'STANDARD'],
    ['Giá vé', formatMoney(ticket.priceAtBooking)],
    ['Mã booking', `#${meta.bookingCode}`],
  ];

  let y = 900;
  infoRows.forEach(([label, value]) => {
    y = drawInfoRow(ctx, label, value, y);
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '700 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Vui lòng xuất trình vé này tại quầy check-in.', 450, 1390);
  ctx.fillText('Mỗi QR chỉ áp dụng cho đúng ghế trên vé.', 450, 1424);
  ctx.textAlign = 'left';

  const link = document.createElement('a');
  link.download = `cinema-ticket-${sanitizeFileName(meta.movieTitle)}-${seatLabel}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const loadCanvasImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) => {
  const words = text.split(' ');
  let line = '';
  let linesDrawn = 0;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const testLine = line ? `${line} ${word}` : word;
    const isTooWide = ctx.measureText(testLine).width > maxWidth && Boolean(line);
    const isLastWord = index === words.length - 1;

    if (isTooWide) {
      const shouldEllipsize = linesDrawn === maxLines - 1;
      ctx.fillText(shouldEllipsize ? `${line}...` : line, x, y);
      if (shouldEllipsize) return;

      line = word;
      y += lineHeight;
      linesDrawn += 1;
    } else {
      line = testLine;
    }

    if (isLastWord && line) {
      ctx.fillText(line, x, y);
    }
  }
};

const drawInfoRow = (ctx: CanvasRenderingContext2D, label: string, value: string, y: number) => {
  ctx.fillStyle = '#64748b';
  ctx.font = '700 22px Arial, sans-serif';
  ctx.fillText(label.toUpperCase(), 100, y);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 25px Arial, sans-serif';
  drawWrappedText(ctx, value, 300, y, 500, 31, 2);

  return y + 66;
};

const sanitizeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const formatFullAddress = (address?: string | null, city?: string | null) => {
  const cleanAddress = address?.trim();
  const cleanCity = city?.trim();

  if (!cleanAddress) return cleanCity;
  if (!cleanCity) return cleanAddress;
  if (cleanAddress.toLocaleLowerCase('vi-VN').includes(cleanCity.toLocaleLowerCase('vi-VN'))) {
    return cleanAddress;
  }

  return `${cleanAddress}, ${cleanCity}`;
};

export default TicketDetailPage;
