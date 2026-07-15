/** App Data Directory paths */
export const APP_NAME = 'CinemaBooking';

/** Poster mặc định khi không có URL hoặc URL lỗi */
export const FALLBACK_POSTER =
  'https://placehold.co/480x720/111827/fbbf24?text=CinemaBooking';

/** Thời gian giữ ghế (giây) — phải khớp với backend HoldExpireScheduler */
export const HOLD_SECONDS = 600;

/** LocalStorage keys */
export const LS_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_INFO: 'user_info',
  PERMISSIONS: 'permissions',
  THEME: 'theme',
} as const;
