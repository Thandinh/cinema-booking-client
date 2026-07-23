/** App Data Directory paths */
export const APP_NAME = 'cinemabooking.vn';

/** Poster mặc định khi không có URL hoặc URL lỗi */
export const FALLBACK_POSTER =
  'https://placehold.co/480x720/111827/fbbf24?text=cinemabooking.vn';

/** Thời gian giữ ghế (giây) — phải khớp với backend HoldExpireScheduler */
const configuredHoldMinutes = Number(
  import.meta.env.VITE_BOOKING_SEAT_HOLD_MINUTES
    ?? import.meta.env.VITE_BOOKING_PENDING_TIMEOUT_MINUTES
    ?? 5
);

export const HOLD_SECONDS = Number.isFinite(configuredHoldMinutes)
  ? Math.max(1, Math.floor(configuredHoldMinutes * 60))
  : 300;

/** LocalStorage keys */
export const LS_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  PERMISSIONS: 'permissions',
  THEME: 'theme',
} as const;
