import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useQuery } from '@tanstack/react-query';
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
  Upload,
} from 'lucide-react';
import { ticketApi } from '../../api/ticketApi';
import { cinemaApi } from '../../api/cinemaApi';
import { formatDateTime } from '../../utils/format';
import type { TicketResponse } from '../../types/domain.types';

type ScanState = 'idle' | 'processing' | 'success' | 'used' | 'error';

const QR_READER_ELEMENT_ID = 'staff-qr-reader';
const QR_FILE_READER_ELEMENT_ID = 'staff-qr-file-reader';

const loadImageFromFile = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error('IMAGE_LOAD_FAILED'));
  };
  image.src = imageUrl;
});

const canvasToPngFile = (canvas: HTMLCanvasElement, fileName: string) =>
  new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('CANVAS_EXPORT_FAILED'));
        return;
      }

      resolve(new File([blob], fileName, { type: 'image/png' }));
    }, 'image/png');
  });

const createSquareCropCandidate = async (
  image: HTMLImageElement,
  sourceName: string,
  index: number,
  centerXRatio: number,
  centerYRatio: number,
  sizeRatioByWidth: number,
) => {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const cropSize = Math.min(sourceWidth * sizeRatioByWidth, sourceWidth, sourceHeight);
  const cropX = Math.max(0, Math.min(sourceWidth - cropSize, sourceWidth * centerXRatio - cropSize / 2));
  const cropY = Math.max(0, Math.min(sourceHeight - cropSize, sourceHeight * centerYRatio - cropSize / 2));
  const outputSize = 900;
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('CANVAS_CONTEXT_FAILED');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, outputSize, outputSize);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);

  return canvasToPngFile(canvas, `qr-candidate-${index}-${sourceName.replace(/\.[^.]+$/, '')}.png`);
};

const createQrDecodeCandidates = async (file: File) => {
  const candidates: File[] = [file];

  try {
    const image = await loadImageFromFile(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (sourceWidth < 120 || sourceHeight < 120) {
      return candidates;
    }

    const cropPlans = [
      // Downloaded ticket image: QR card is in the upper-middle section.
      { centerX: 0.5, centerY: 0.345, size: 0.58 },
      { centerX: 0.5, centerY: 0.345, size: 0.48 },
      { centerX: 0.5, centerY: 0.32, size: 0.7 },
      // Screenshots can contain the QR around the middle.
      { centerX: 0.5, centerY: 0.5, size: 0.86 },
    ];

    for (const [index, plan] of cropPlans.entries()) {
      try {
        candidates.push(await createSquareCropCandidate(
          image,
          file.name || 'uploaded-ticket',
          index + 1,
          plan.centerX,
          plan.centerY,
          plan.size,
        ));
      } catch {
        // Keep the original image path useful even when a crop cannot be produced.
      }
    }
  } catch {
    // If the browser cannot load the image for cropping, still try the original file.
  }

  return candidates;
};

const decodeQrWithNativeBarcodeDetector = async (file: File) => {
  const BarcodeDetectorCtor = (window as any).BarcodeDetector;
  if (!BarcodeDetectorCtor || !window.createImageBitmap) {
    return null;
  }

  const bitmap = await window.createImageBitmap(file);
  try {
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
    const results = await detector.detect(bitmap);
    const decoded = results.find((result: any) => typeof result.rawValue === 'string' && result.rawValue.trim());
    return decoded?.rawValue?.trim() || null;
  } finally {
    bitmap.close();
  }
};

const decodeQrWithHtml5Qrcode = async (files: File[]) => {
  const fileScanner = new Html5Qrcode(QR_FILE_READER_ELEMENT_ID, {
    verbose: false,
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
  });
  let lastError: unknown = null;

  try {
    for (const file of files) {
      try {
        const decoded = await fileScanner.scanFileV2(file, false);
        const decodedText = decoded.decodedText.trim();
        if (decodedText) {
          return decodedText;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError ?? new Error('QR_FILE_UNREADABLE');
  } finally {
    try {
      fileScanner.clear();
    } catch {
      // scanFile owns a transient canvas; ignore duplicate cleanup from the library.
    }
  }
};

const decodeQrFromImageFile = async (file: File) => {
  const candidates = await createQrDecodeCandidates(file);

  for (const candidate of candidates) {
    const nativeDecoded = await decodeQrWithNativeBarcodeDetector(candidate).catch(() => null);
    if (nativeDecoded) {
      return nativeDecoded;
    }
  }

  return decodeQrWithHtml5Qrcode(candidates);
};

const getCheckInErrorMessage = (err: any) => {
  if (err?.message === 'CHECK_IN_CONTEXT_REQUIRED') {
    return 'Vui lòng chọn rạp và suất chiếu đang soát trước khi quét vé.';
  }
  if (err?.message === 'QR_FILE_UNREADABLE') {
    return 'Không đọc được mã QR trong ảnh. Hãy chọn ảnh rõ hơn hoặc quét trực tiếp bằng camera.';
  }

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
    case 8011:
      return 'Vui lòng chọn rạp và suất chiếu đang soát trước khi quét vé.';
    case 8012:
      return 'Vé không thuộc rạp đang soát. Kiểm tra lại rạp của khách.';
    case 8013:
      return 'Vé không thuộc suất chiếu đang soát. Kiểm tra lại phòng hoặc giờ chiếu.';
    default:
      return message || 'Vé không hợp lệ hoặc đã được sử dụng.';
  }
};

const StaffTicketScannerPage = () => {
  const [state, setState] = useState<ScanState>('idle');
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');
  const [scanLocked, setScanLocked] = useState(false);
  const processingRef = useRef(false);
  const contextRef = useRef({ cinemaId: '', showtimeId: '' });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraSessionRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cinemasQuery = useQuery({
    queryKey: ['staff-check-in-cinemas'],
    queryFn: () => cinemaApi.getAll({ page: 0, size: 300 }).then(res => res.data.result.content),
  });

  const openShowtimesQuery = useQuery({
    queryKey: ['staff-check-in-showtimes', selectedCinemaId],
    enabled: Boolean(selectedCinemaId),
    refetchInterval: 30000,
    queryFn: () => ticketApi.getOpenCheckInShowtimes(selectedCinemaId).then(res => res.data.result),
  });

  const cinemas = useMemo(() => cinemasQuery.data ?? [], [cinemasQuery.data]);
  const cityOptions = useMemo(
    () => Array.from(new Set(cinemas.map(cinema => cinema.city).filter((city): city is string => Boolean(city)))).sort(),
    [cinemas],
  );
  const filteredCinemas = useMemo(
    () => cinemas.filter(cinema => !selectedCity || cinema.city === selectedCity),
    [cinemas, selectedCity],
  );
  const openShowtimes = useMemo(() => openShowtimesQuery.data ?? [], [openShowtimesQuery.data]);
  const selectedCinema = cinemas.find(cinema => cinema.id === selectedCinemaId);
  const selectedShowtime = openShowtimes.find(showtime => showtime.id === selectedShowtimeId);
  const canScan = Boolean(selectedCinemaId && selectedShowtimeId);
  const canStartNewScan = canScan && !scanLocked && state !== 'processing';

  useEffect(() => {
    contextRef.current = { cinemaId: selectedCinemaId, showtimeId: selectedShowtimeId };
  }, [selectedCinemaId, selectedShowtimeId]);

  useEffect(() => {
    if (selectedCinemaId && !openShowtimes.some(showtime => showtime.id === selectedShowtimeId)) {
      setSelectedShowtimeId('');
    }
  }, [openShowtimes, selectedCinemaId, selectedShowtimeId]);

  const submitDecodedQr = useCallback((decoded: string) => {
    if (processingRef.current || !decoded) return;

    if (!contextRef.current.cinemaId || !contextRef.current.showtimeId) {
      processingRef.current = true;
      setScanLocked(true);
      setTicketData(null);
      setErrorMsg('Vui lòng chọn rạp và suất chiếu đang soát trước khi quét vé.');
      setState('error');
      return;
    }

    processingRef.current = true;
    setScanLocked(true);
    setScannedQr(decoded.trim());
  }, []);

  useEffect(() => {
    const readerRoot = document.getElementById(QR_READER_ELEMENT_ID);
    if (!readerRoot) return;

    let disposed = false;
    const sessionId = cameraSessionRef.current + 1;
    cameraSessionRef.current = sessionId;
    const scannerElement = document.createElement('div');
    scannerElement.id = `${QR_READER_ELEMENT_ID}-${sessionId}`;
    scannerElement.className = 'min-h-[320px] w-full';
    readerRoot.replaceChildren(scannerElement);

    const scanner = new Html5Qrcode(scannerElement.id, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    scannerRef.current = scanner;

    const isCurrentScanner = () => scannerRef.current === scanner && cameraSessionRef.current === sessionId;

    const scannerConfig = {
      fps: 10,
      disableFlip: false,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(220, Math.min(300, Math.floor(minEdge * 0.72)));
        return { width: size, height: size };
      },
    };

    const startScanner = async () => {
      if (disposed || !isCurrentScanner()) return;

      try {
        const cameras = await Html5Qrcode.getCameras();
        const preferredCamera =
          cameras.find(camera => /back|rear|environment|sau/i.test(camera.label)) ?? cameras[0];

        if (preferredCamera?.id) {
          if (disposed || !isCurrentScanner()) return;
          await scanner.start(
            preferredCamera.id,
            scannerConfig,
            decoded => {
              if (!disposed && isCurrentScanner()) {
                submitDecodedQr(decoded);
              }
            },
            undefined,
          );
          return;
        }
      } catch {
        // Some browsers only grant camera labels after direct permission; fall back to facingMode.
      }

      if (disposed || !isCurrentScanner()) return;
      await scanner.start(
        { facingMode: { ideal: 'environment' } },
        scannerConfig,
        decoded => {
          if (!disposed && isCurrentScanner()) {
            submitDecodedQr(decoded);
          }
        },
        undefined,
      );
    };

    let startPromise: Promise<void> | null = null;
    const clearScanner = async () => {
      try {
        await startPromise;
      } catch {
        // Startup may fail if permission is denied; cleanup should still be best-effort.
      }

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // Camera may already be stopped by the browser or React StrictMode cleanup.
      }

      try {
        scanner.clear();
      } catch {
        // The underlying library can clear its own DOM during stop; ignore duplicate cleanup.
      }

      scannerElement.remove();
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    };

    startPromise = startScanner();
    startPromise
      .then(() => {
        if (disposed) {
          void clearScanner();
        }
      })
      .catch((err) => {
        if (disposed) return;
        setTicketData(null);
        setErrorMsg(
          err?.message?.includes('Permission')
            ? 'Trình duyệt chưa được cấp quyền camera. Vui lòng cho phép camera để quét vé.'
            : 'Không mở được camera. Kiểm tra quyền camera hoặc thử tải lại trang.',
        );
        setState('error');
      });

    return () => {
      disposed = true;
      void clearScanner();
    };
  }, [submitDecodedQr]);

  useEffect(() => {
    if (!scannedQr) return;

    const process = async () => {
      setState('processing');
      setErrorMsg(null);
      setTicketData(null);

      try {
        const { cinemaId, showtimeId } = contextRef.current;
        if (!cinemaId || !showtimeId) {
          throw new Error('CHECK_IN_CONTEXT_REQUIRED');
        }
        const res = await ticketApi.checkIn({ qrCode: scannedQr, cinemaId, showtimeId });
        const result = res.data.result;
        setTicketData(result);
        setState(result.alreadyCheckedIn ? 'used' : 'success');
      } catch (err: any) {
        setErrorMsg(getCheckInErrorMessage(err));
        setState('error');
      }
    };

    process();
  }, [scannedQr]);

  const handleFileScan = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || processingRef.current) return;

    if (!file.type.startsWith('image/')) {
      processingRef.current = false;
      setScanLocked(false);
      setTicketData(null);
      setErrorMsg('Vui lòng chọn một file ảnh có chứa mã QR.');
      setState('error');
      return;
    }

    if (!contextRef.current.cinemaId || !contextRef.current.showtimeId) {
      processingRef.current = false;
      setScanLocked(false);
      setTicketData(null);
      setErrorMsg('Vui lòng chọn rạp và suất chiếu đang soát trước khi quét vé.');
      setState('error');
      return;
    }

    processingRef.current = true;
    setScanLocked(true);
    setState('processing');
    setErrorMsg(null);
    setTicketData(null);

    const activeCameraScanner = scannerRef.current;
    let shouldResumeCamera = false;

    try {
      try {
        if (activeCameraScanner?.isScanning) {
          activeCameraScanner.pause(true);
          shouldResumeCamera = true;
        }
      } catch {
        // Some browsers do not support pausing the active stream reliably.
      }

      const decoded = await decodeQrFromImageFile(file);
      setScannedQr(decoded);
    } catch (err) {
      console.error('Unable to decode uploaded QR image', err);
      processingRef.current = false;
      setScanLocked(false);
      setErrorMsg(getCheckInErrorMessage(new Error('QR_FILE_UNREADABLE')));
      setState('error');
    } finally {
      if (shouldResumeCamera && activeCameraScanner && activeCameraScanner === scannerRef.current) {
        try {
          activeCameraScanner.resume();
        } catch {
          // Camera can already be stopped while navigating or changing context.
        }
      }
    }
  };

  const reset = () => {
    processingRef.current = false;
    setScanLocked(false);
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

        <section className="cinema-card mb-6 p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-black text-slate-950 dark:text-white">Ngữ cảnh soát vé</h2>
              <p className="mt-1 text-xs font-semibold cinema-muted">
                Chọn đúng rạp và suất chiếu trước khi quét để tránh dùng nhầm vé của khách.
              </p>
            </div>
            {selectedCinema && selectedShowtime && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                {selectedCinema.name} · {selectedShowtime.roomName}
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="cinema-label mb-1.5 block">Thành phố</span>
              <select
                value={selectedCity}
                onChange={event => {
                  setSelectedCity(event.target.value);
                  setSelectedCinemaId('');
                  setSelectedShowtimeId('');
                  reset();
                }}
                className="cinema-input"
                disabled={cinemasQuery.isLoading}
              >
                <option value="">Tất cả thành phố</option>
                {cityOptions.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="cinema-label mb-1.5 block">Rạp chiếu</span>
              <select
                value={selectedCinemaId}
                onChange={event => {
                  setSelectedCinemaId(event.target.value);
                  setSelectedShowtimeId('');
                  reset();
                }}
                className="cinema-input"
                disabled={cinemasQuery.isLoading}
              >
                <option value="">Chọn rạp</option>
                {filteredCinemas.map(cinema => (
                  <option key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="cinema-label mb-1.5 block">Suất đang mở check-in</span>
              <select
                value={selectedShowtimeId}
                onChange={event => {
                  setSelectedShowtimeId(event.target.value);
                  reset();
                }}
                className="cinema-input"
                disabled={!selectedCinemaId || openShowtimesQuery.isLoading}
              >
                <option value="">
                  {!selectedCinemaId
                    ? 'Chọn rạp trước'
                    : openShowtimesQuery.isLoading
                      ? 'Đang tải suất chiếu'
                      : 'Chọn suất chiếu'}
                </option>
                {openShowtimes.map(showtime => (
                  <option key={showtime.id} value={showtime.id}>
                    {formatDateTime(showtime.startTime)} · {showtime.roomName} · {showtime.movieTitle}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedCinemaId && !openShowtimesQuery.isLoading && openShowtimes.length === 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
              Rạp này hiện không có suất nào đang trong thời gian mở check-in.
            </p>
          )}
        </section>

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
                id={QR_READER_ELEMENT_ID}
                className="min-h-[320px] w-full overflow-hidden rounded-2xl bg-slate-950
                  [&_video]:!h-[320px] [&_video]:!w-full [&_video]:!object-cover"
              />
              <div
                id={QR_FILE_READER_ELEMENT_ID}
                aria-hidden="true"
                className="pointer-events-none fixed -left-[10000px] top-0 h-[360px] w-[360px] overflow-hidden opacity-0"
              />

              {!canScan && (
                <div className="absolute inset-4 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 p-6 text-center backdrop-blur-sm dark:bg-neutral-900/90">
                  <ScanLine className="text-amber-500" size={36} />
                  <div>
                    <p className="font-black text-slate-950 dark:text-white">Chọn rạp và suất chiếu trước</p>
                    <p className="mt-1 text-xs font-semibold cinema-muted">
                      Camera chỉ xác thực vé khi đã có đúng ngữ cảnh soát vé.
                    </p>
                  </div>
                </div>
              )}

              {state === 'processing' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm dark:bg-neutral-900/90">
                  <Loader2 className="animate-spin text-amber-500" size={36} />
                  <p className="font-black text-slate-950 dark:text-white">Đang xác thực vé...</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 dark:border-white/8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileScan}
              />
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-center text-xs font-semibold cinema-muted sm:text-left">
                Đưa mã QR trên điện thoại hoặc vé in vào khung camera
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canStartNewScan}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-slate-950 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
                >
                  <Upload size={15} /> Tải ảnh QR
                </button>
              </div>
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

            {state === 'used' && ticketData && (
              <div className="fade-in">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-500/20 dark:bg-amber-500/10">
                  <div className="mx-auto mb-3 grid size-16 place-items-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/25">
                    <AlertTriangle size={30} className="text-white" />
                  </div>
                  <p className="text-2xl font-black text-amber-800 dark:text-amber-300">
                    Vé đã được sử dụng
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/80">
                    Không cho khách vào lại bằng mã này
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

                  {ticketData.checkInTime && (
                    <InfoRow icon={CheckCircle2} label="Đã vào lúc">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        {formatDateTime(ticketData.checkInTime)}
                      </span>
                    </InfoRow>
                  )}

                  {ticketData.checkedInByName && (
                    <InfoRow icon={ScanLine} label="Nhân viên">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        {ticketData.checkedInByName}
                      </span>
                    </InfoRow>
                  )}
                </div>

                <button onClick={reset} className="btn-secondary mt-6 w-full">
                  <RefreshCw size={16} /> Quét vé tiếp theo
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

                  {ticketData.checkedInByName && (
                    <InfoRow icon={ScanLine} label="Nhân viên">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        {ticketData.checkedInByName}
                      </span>
                    </InfoRow>
                  )}
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
