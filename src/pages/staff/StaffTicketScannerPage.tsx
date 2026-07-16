import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  DoorOpen,
  Film,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  Ticket,
} from 'lucide-react';
import { ticketApi } from '../../api/ticketApi';
import { formatDateTime } from '../../utils/format';
import type { TicketResponse } from '../../types/domain.types';

type ScanState = 'idle' | 'processing' | 'success' | 'error';

const getCheckInErrorMessage = (err: any) => {
  const status = err.response?.status;
  const code = err.response?.data?.code;
  const message = err.response?.data?.message;

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản nhân viên.';
  }
  if (status === 403) {
    return 'Tài khoản hiện tại chưa có quyền soát vé. Cần quyền TICKET_CHECKIN.';
  }

  switch (code) {
    case 8001:
      return 'Không tìm thấy vé cho mã QR này.';
    case 8002:
      return 'Vé này đã được sử dụng.';
    case 8003:
      return 'Vé này đã bị hủy.';
    case 8004:
      return 'Mã QR không hợp lệ. Hãy quét mã QR thật trên vé sau khi thanh toán thành công.';
    case 8005:
      return 'Vé chưa ở trạng thái hoạt động.';
    case 8006:
      return 'Chưa đến thời gian mở check-in cho suất chiếu này.';
    case 8007:
      return 'Suất chiếu đã quá thời gian check-in.';
    case 8010:
      return 'Không đọc được nội dung mã QR, vui lòng quét lại.';
    default:
      return message || 'Vé không hợp lệ hoặc đã được sử dụng.';
  }
};

const StaffTicketScannerPage = () => {
  const [state, setState] = useState<ScanState>('idle');
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
      false,
    );

    scanner.render(
      (decoded) => {
        if (!processingRef.current && decoded) {
          processingRef.current = true;
          setScannedQr(decoded);
        }
      },
      () => {
        // Ignore scan noise while the camera is searching for a QR.
      },
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!scannedQr) return;

    const process = async () => {
      setState('processing');
      setErrorMsg(null);
      setTicketData(null);

      try {
        const res = await ticketApi.checkIn(scannedQr);
        setTicketData(res.data.result);
        setState('success');
      } catch (err: any) {
        setErrorMsg(getCheckInErrorMessage(err));
        setState('error');
      }
    };

    process();
  }, [scannedQr]);

  const reset = () => {
    processingRef.current = false;
    setScannedQr(null);
    setTicketData(null);
    setErrorMsg(null);
    setState('idle');
  };

  return (
    <>
      <Helmet>
        <title>Soát vé | cinemabooking.vn Staff</title>
      </Helmet>

      <div className="page-container-md py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-800 ring-1 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
            <ScanLine size={13} /> Nhân viên
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Soát vé tại cổng
          </h1>
          <p className="mt-2 text-sm cinema-muted">
            Quét mã QR trên vé điện tử của khách hàng để xác nhận check-in.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="cinema-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-white/8 dark:bg-neutral-950/50">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <QrCode size={16} />
              </span>
              <h2 className="font-black text-slate-950 dark:text-white">Camera quét QR</h2>
            </div>

            <div className="relative p-4">
              <div
                id="qr-reader"
                className="w-full overflow-hidden rounded-2xl
                  [&_#qr-reader__dashboard_section_csr_span]:text-sm [&_#qr-reader__dashboard_section_csr_span]:font-semibold
                  [&_#qr-reader__dashboard_section_csr_span]:text-slate-700 dark:[&_#qr-reader__dashboard_section_csr_span]:text-neutral-300
                  [&_button]:!rounded-xl [&_button]:!bg-amber-400 [&_button]:!px-4 [&_button]:!py-2
                  [&_button]:!text-sm [&_button]:!font-black [&_button]:!text-slate-950
                  [&_button]:transition [&_button]:hover:!bg-amber-300
                  [&_select]:!rounded-xl [&_select]:!border-slate-200 [&_select]:dark:!border-white/10
                  [&_#qr-reader__status_span]:!text-sm [&_#qr-reader__status_span]:!font-semibold
                  [&_#qr-reader__camera_selection]:!rounded-xl"
              />

              {state === 'processing' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm dark:bg-neutral-900/90">
                  <Loader2 className="animate-spin text-amber-500" size={36} />
                  <p className="font-black text-slate-950 dark:text-white">Đang xác thực vé...</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 dark:border-white/8">
              <p className="text-center text-xs font-semibold cinema-muted">
                Đưa mã QR trên điện thoại hoặc vé in vào khung camera
              </p>
            </div>
          </section>

          <section className="cinema-card p-6">
            <h2 className="mb-6 font-black text-slate-950 dark:text-white">Kết quả xác thực</h2>

            {state === 'idle' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-slate-100 dark:bg-neutral-800">
                  <ScanLine size={28} className="text-slate-400" />
                </div>
                <p className="font-black text-slate-950 dark:text-white">Chưa có dữ liệu</p>
                <p className="mt-2 text-sm cinema-muted">Quét mã QR của khách để bắt đầu.</p>
              </div>
            )}

            {state === 'processing' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="mb-3 animate-spin text-amber-500" size={32} />
                <p className="font-semibold text-slate-950 dark:text-white">Đang kiểm tra...</p>
              </div>
            )}

            {state === 'error' && (
              <div className="fade-in">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
                  <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-red-100 dark:bg-red-500/20">
                    <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-lg font-black text-red-700 dark:text-red-300">
                    Xác thực thất bại
                  </p>
                  <p className="mt-2 text-sm font-semibold text-red-600/80 dark:text-red-400/80">
                    {errorMsg}
                  </p>
                </div>
                <button onClick={reset} className="btn-danger mt-4 w-full">
                  <RefreshCw size={16} /> Quét vé khác
                </button>
              </div>
            )}

            {state === 'success' && ticketData && (
              <div className="fade-in">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <div className="mx-auto mb-3 grid size-16 place-items-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={30} className="text-white" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    Check-in hợp lệ!
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">
                    Khách có thể vào rạp
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <InfoRow icon={Film} label="Phim">
                    <span className="font-black text-slate-950 dark:text-white">{ticketData.movieTitle}</span>
                  </InfoRow>

                  {ticketData.cinemaName && (
                    <InfoRow icon={MapPin} label="Rạp chiếu">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        {ticketData.cinemaName}
                      </span>
                    </InfoRow>
                  )}

                  {ticketData.roomName && (
                    <InfoRow icon={DoorOpen} label="Phòng chiếu">
                      <span className="font-black text-slate-950 dark:text-white">
                        {ticketData.roomName}
                      </span>
                    </InfoRow>
                  )}

                  <InfoRow icon={Ticket} label="Ghế">
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {ticketData.rowLabel}{ticketData.seatNumber}
                    </span>
                  </InfoRow>

                  {ticketData.startTime && (
                    <InfoRow icon={CalendarDays} label="Suất chiếu">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        {formatDateTime(ticketData.startTime)}
                      </span>
                    </InfoRow>
                  )}

                  <InfoRow icon={CheckCircle2} label="Giờ vào">
                    <span className="font-semibold text-slate-700 dark:text-neutral-300">
                      {formatDateTime(ticketData.checkInTime || new Date().toISOString())}
                    </span>
                  </InfoRow>
                </div>

                <button onClick={reset} className="btn-secondary mt-6 w-full">
                  <RefreshCw size={16} /> Quét vé tiếp theo
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Ticket;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-neutral-950">
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-amber-500 ring-1 ring-slate-200 dark:bg-neutral-800 dark:ring-white/10">
      <Icon size={15} />
    </span>
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <p className="cinema-label shrink-0">{label}</p>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  </div>
);

export default StaffTicketScannerPage;
