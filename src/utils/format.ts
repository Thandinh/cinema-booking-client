// Shared formatting utilities for the client app.

const pad2 = (value: number): string => value.toString().padStart(2, '0');

/** Định dạng tiền Việt: 80000 -> "80.000đ" */
export const formatMoney = (value?: number | null): string =>
  `${(value ?? 0).toLocaleString('vi-VN')}đ`;

/** Định dạng ngày giờ suất chiếu: ISO string -> "22:50 · 15/07/2026" */
export const formatDateTime = (value?: string | null): string => {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())} · ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/** Định dạng giờ chiếu: ISO string -> "18:00" */
export const formatTime = (value?: string | null): string => {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

/** Định dạng ngày: ISO string -> "09/07/2026" */
export const formatDate = (value?: string | null): string => {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/** Đếm ngược từ giây: 610 -> "10:10" */
export const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
};
