export interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  scope?: string;
  [key: string]: any;
}

/**
 * Giải mã payload của JWT token (không verify signature).
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem token đã hết hạn chưa.
 * @param token JWT token
 * @returns true nếu đã hết hạn, false nếu hợp lệ
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  // exp trong JWT là epoch time (giây), Date.now() là ms
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}
