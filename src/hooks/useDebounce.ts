import { useEffect, useState } from 'react';

/**
 * Trì hoãn cập nhật giá trị cho đến khi người dùng ngừng gõ.
 * Dùng cho search input để tránh gọi API quá nhiều lần.
 *
 * @param value   Giá trị cần debounce
 * @param delay   Thời gian chờ (ms), mặc định 400ms
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
