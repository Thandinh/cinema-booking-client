# cinemabooking.vn Client

Frontend React + TypeScript + Vite cho h? th?ng ??t v? xem phim cinemabooking.vn.

## Y?u c?u

- Node.js 22+
- Backend Spring Boot ch?y t?i `http://localhost:8080` khi c?n d? li?u th?t

## C?u h?nh m?i tr??ng

T?o file `.env` t? `.env.example` v? ch?nh c?c gi? tr? c?n thi?t:

```env
BACKEND_PROXY_TARGET=http://localhost:8080
DEV_SERVER_HOST=localhost
DEV_SERVER_PORT=5173
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_BOOKING_SEAT_HOLD_MINUTES=2
```

Khi ch?y local, n?n ?? `VITE_API_BASE_URL` r?ng ?? request ?i qua Vite proxy. Khi deploy t?ch frontend/backend, ??t `VITE_API_BASE_URL` v? URL backend public.

## Ch?y development

```powershell
npm install
npm run dev
```

M? `http://localhost:5173`.

## Ki?m tra ch?t l??ng

```powershell
npm run lint
npm test
npm run build
```

Ho?c ch?y to?n b?:

```powershell
npm run check
```

## Test

- `npm test`: ch?y Vitest unit/UI tests.
- `npm run test:watch`: ch?y test ? ch? ?? watch khi ?ang ph?t tri?n.

## Build production

```powershell
npm run build
npm run preview
```

## Ghi ch?

- Kh?ng commit `.env`, `dist/`, `node_modules/`, log file ho?c report test.
- N?u d?ng ngrok/mobile demo, c?p nh?t `DEV_SERVER_HOST=0.0.0.0` v? `DEV_ALLOWED_HOSTS=<domain-ngrok>` trong `.env`.
