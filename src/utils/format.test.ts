import { describe, expect, it } from 'vitest';
import { formatCountdown, formatDate, formatDateTime, formatMoney, formatTime } from './format';

describe('format utils', () => {
  it('formats Vietnamese currency without decimals', () => {
    expect(formatMoney(280000)).toBe('280.000\u0111');
    expect(formatMoney(null)).toBe('0\u0111');
  });

  it('formats cinema date and time without seconds', () => {
    const value = '2026-07-15T22:50:00';

    expect(formatDateTime(value)).toBe('22:50 \u00b7 15/07/2026');
    expect(formatTime(value)).toBe('22:50');
    expect(formatDate(value)).toBe('15/07/2026');
  });

  it('falls back for invalid dates and pads countdown values', () => {
    expect(formatDateTime('not-a-date')).toBe('--');
    expect(formatCountdown(305)).toBe('05:05');
  });
});
