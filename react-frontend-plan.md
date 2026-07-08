# 🎬 Cinema Booking System — React Frontend Implementation Plan

## 1. Tech Stack

| Layer | Công nghệ | Lý do chọn |
|-------|-----------|------------|
| Framework | **React 18 + Vite** | Nhanh, HMR tốt |
| Routing | **React Router v6** | Nested routes, protected routes |
| State | **Zustand** | Nhẹ hơn Redux, đủ dùng cho dự án này |
| Data Fetching | **TanStack Query (React Query)** | Cache, auto-refetch, loading/error states |
| HTTP Client | **Axios** (custom instance) | Interceptor tự gắn JWT token |
| Styling | **Tailwind CSS v3** | Nhanh, responsive, đẹp |
| UI Components | **shadcn/ui** | Đẹp, accessible, customizable |
| Map | **Leaflet + react-leaflet** | Đã dùng ở static HTML, giữ nguyên |
| WebSocket | **STOMP.js + SockJS** | Realtime seat status |
| Forms | **React Hook Form + Zod** | Validation chuẩn TypeScript |
| Icons | **Lucide React** | Nhẹ, đồng nhất |
| Notifications | **React Toastify / Sonner** | Toast đẹp |
| Charts (Admin) | **Recharts** | Dashboard analytics |

---

## 2. Cấu trúc thư mục

```
cinema-client/
├── public/
├── src/
│   ├── api/                  # Axios instances & API calls
│   │   ├── axiosClient.ts    # Base axios + JWT interceptor
│   │   ├── authApi.ts
│   │   ├── movieApi.ts
│   │   ├── cinemaApi.ts
│   │   ├── showtimeApi.ts
│   │   ├── bookingApi.ts
│   │   ├── paymentApi.ts
│   │   └── userApi.ts
│   │
│   ├── components/           # Shared components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── ui/               # shadcn components (Button, Modal, etc.)
│   │   ├── MovieCard.tsx
│   │   ├── SeatMap.tsx       # ⭐ Core component - seat grid
│   │   ├── CountdownTimer.tsx # Đếm ngược giữ ghế
│   │   └── ProtectedRoute.tsx
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSeatWebSocket.ts  # Hook WebSocket ghế
│   │   └── usePermission.ts    # Check user permissions
│   │
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts      # JWT, user info, permissions[]
│   │   └── bookingStore.ts   # Ghế đã chọn, showtime, tổng tiền
│   │
│   ├── pages/
│   │   ├── public/           # Không cần đăng nhập
│   │   │   ├── HomePage.tsx
│   │   │   ├── MovieListPage.tsx
│   │   │   ├── MovieDetailPage.tsx
│   │   │   ├── CinemaMapPage.tsx
│   │   │   ├── ShowtimeListPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   │
│   │   ├── user/             # Cần đăng nhập (role: USER)
│   │   │   ├── SeatSelectionPage.tsx   # ⭐ Core page
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── PaymentResultPage.tsx
│   │   │   ├── MyBookingsPage.tsx
│   │   │   ├── MyTicketsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   │
│   │   └── admin/            # Admin panel (role: ADMIN/STAFF)
│   │       ├── DashboardPage.tsx
│   │       ├── ManageMoviesPage.tsx
│   │       ├── ManageCinemasPage.tsx
│   │       ├── ManageShowtimesPage.tsx
│   │       ├── ManageBookingsPage.tsx
│   │       ├── ManageUsersPage.tsx
│   │       ├── CheckInPage.tsx      # QR scan check-in
│   │       └── AnalyticsPage.tsx
│   │
│   ├── types/                # TypeScript interfaces
│   │   ├── auth.types.ts
│   │   ├── movie.types.ts
│   │   ├── booking.types.ts
│   │   └── api.types.ts      # ApiResponse<T> wrapper
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   └── jwtUtils.ts       # Decode JWT lấy permissions
│   │
│   ├── router/
│   │   └── AppRouter.tsx     # Toàn bộ routes + guards
│   │
│   └── main.tsx
```

---

## 3. API Mapping — Backend → Frontend

### 🔓 Public (không cần token)
| Frontend Action | API Call | Endpoint |
|-----------------|----------|----------|
| Danh sách phim đang chiếu | `GET /api/v1/movies?status=NOW_SHOWING` | MovieListPage |
| Chi tiết phim | `GET /api/v1/movies/{id}` | MovieDetailPage |
| Bản đồ rạp | `GET /api/v1/cinemas/map` | CinemaMapPage |
| Rạp gần tôi | `GET /api/v1/cinemas/nearest?lat=&lng=&limit=5` | CinemaMapPage |
| Lịch chiếu của rạp | `GET /api/v1/showtimes/cinema/{id}` | ShowtimeListPage |

### 🔐 Auth
| Frontend Action | API Call |
|-----------------|----------|
| Đăng nhập | `POST /auth/token` → lưu JWT vào localStorage |
| Đăng ký | `POST /api/v1/users/register` |
| Refresh token | `POST /auth/refresh` |
| Đăng xuất | `POST /auth/logout` → xóa localStorage |

### 👤 User (cần JWT)
| Frontend Action | API Call |
|-----------------|----------|
| Xem sơ đồ ghế | `GET /api/v1/bookings/showtimes/{showtimeId}/seats` |
| Giữ ghế | `POST /api/v1/bookings/hold` |
| Tạo booking | `POST /api/v1/bookings` |
| Xem booking của tôi | `GET /api/v1/bookings/my` |
| Xem vé của tôi | `GET /api/v1/bookings/tickets/my` |
| Hủy booking | `PATCH /api/v1/bookings/{id}/cancel` |
| Cập nhật profile | `PUT /api/v1/users/{id}` |

### 👑 Admin/Staff
| Frontend Action | API Call |
|-----------------|----------|
| Dashboard stats | `GET /api/v1/analytics/summary` |
| Tất cả bookings | `GET /api/v1/bookings?status=` |
| CRUD Movies | `GET/POST/PUT/DELETE /api/v1/movies` |
| CRUD Cinemas | `GET/POST/PUT/DELETE /api/v1/cinemas` |
| CRUD Showtimes | `GET/POST/PUT/DELETE /api/v1/showtimes` |
| Check-in QR | `POST /api/v1/bookings/tickets/check-in?qrCode=` |
| Danh sách users | `GET /api/v1/users` |

---

## 4. Authentication Flow — axiosClient.ts

```typescript
// src/api/axiosClient.ts
const axiosClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: tự động gắn JWT
axiosClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto refresh token khi 401
axiosClient.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      // Gọi POST /auth/refresh
      // Nếu refresh thất bại → logout → redirect /login
    }
    return Promise.reject(error);
  }
);
```

---

## 5. Zustand Auth Store

```typescript
// src/stores/authStore.ts
interface AuthState {
  token: string | null;
  user: UserInfo | null;
  permissions: string[]; // ['BOOKING_CREATE', 'MOVIE_VIEW', ...]
  
  login: (token: string) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

// Decode JWT để lấy permissions từ claims
// JWT payload chứa: { sub, scope, iat, exp }
// scope = "BOOKING_CREATE MOVIE_VIEW ..." (space-separated)
```

---

## 6. ⭐ Core: SeatSelectionPage Flow

```
Mở SeatSelectionPage (showtimeId trong URL)
        │
        ├── 1. GET /api/v1/bookings/showtimes/{id}/seats
        │         → Render SeatMap grid (AVAILABLE/HOLD/BOOKED)
        │
        ├── 2. Connect WebSocket: /ws
        │         subscribe('/topic/showtimes/{id}/seats')
        │         → Realtime update khi ghế khác bị hold/book
        │
        ├── 3. User click ghế AVAILABLE
        │         → Add to selectedSeats state (client-side)
        │
        ├── 4. User bấm "Giữ ghế" (countdown 10 phút bắt đầu)
        │         POST /api/v1/bookings/hold
        │         { showtimeId, seatIds: [...] }
        │         → Ghế chuyển HOLD trên server
        │
        ├── 5. Chuyển sang CheckoutPage
        │         → Nhập mã khuyến mãi (optional)
        │         POST /api/v1/bookings
        │         { showtimeId, seatIds, promotionCode? }
        │
        └── 6. Redirect sang VNPay
                  → Sau khi callback: PaymentResultPage
```

---

## 7. SeatMap Component

```tsx
// Hiển thị ghế theo grid từ rowIndex/colIndex
// Màu sắc theo trạng thái:
const seatColors = {
  AVAILABLE: 'bg-gray-700 hover:bg-indigo-500 cursor-pointer',
  HOLD:      'bg-yellow-500 cursor-not-allowed opacity-60',
  BOOKED:    'bg-red-600 cursor-not-allowed opacity-60',
  SELECTED:  'bg-indigo-500 ring-2 ring-white',
  VIP:       'bg-purple-700 hover:bg-purple-500', // seat_type = VIP
};
```

---

## 8. Protected Route + Permission Guard

```tsx
// src/components/ProtectedRoute.tsx
// Sử dụng permission từ JWT (scope claim)

<Route element={<ProtectedRoute permission="BOOKING_CREATE" />}>
  <Route path="/seat-selection/:showtimeId" element={<SeatSelectionPage />} />
</Route>

<Route element={<ProtectedRoute permission="BOOKING_VIEW_ALL" />}>
  <Route path="/admin/bookings" element={<ManageBookingsPage />} />
</Route>
```

---

## 9. Route Structure

```tsx
// AppRouter.tsx
<Routes>
  {/* Public */}
  <Route path="/" element={<HomePage />} />
  <Route path="/movies" element={<MovieListPage />} />
  <Route path="/movies/:id" element={<MovieDetailPage />} />
  <Route path="/cinemas" element={<CinemaMapPage />} />
  <Route path="/cinemas/:id/showtimes" element={<ShowtimeListPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/payment/result" element={<PaymentResultPage />} />

  {/* User (authenticated) */}
  <Route element={<ProtectedRoute />}>
    <Route path="/seat-selection/:showtimeId" element={<SeatSelectionPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/my/bookings" element={<MyBookingsPage />} />
    <Route path="/my/tickets" element={<MyTicketsPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>

  {/* Admin */}
  <Route element={<ProtectedRoute permission="DASHBOARD_VIEW" />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="movies" element={<ManageMoviesPage />} />
      <Route path="cinemas" element={<ManageCinemasPage />} />
      <Route path="showtimes" element={<ManageShowtimesPage />} />
      <Route path="bookings" element={<ManageBookingsPage />} />
      <Route path="users" element={<ManageUsersPage />} />
      <Route path="check-in" element={<CheckInPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
    </Route>
  </Route>
</Routes>
```

---

## 10. Thứ tự implement (Recommended)

| Phase | Trang | Ưu tiên |
|-------|-------|---------|
| **Phase 1** | Setup project, axiosClient, authStore, Navbar | 🔴 Bắt buộc |
| **Phase 1** | LoginPage + RegisterPage | 🔴 Bắt buộc |
| **Phase 2** | HomePage + MovieListPage + MovieDetailPage | 🔴 Bắt buộc |
| **Phase 2** | CinemaMapPage (re-dùng Leaflet) + ShowtimeListPage | 🟠 Cao |
| **Phase 3** | **SeatSelectionPage + WebSocket** | 🔴 Core Feature |
| **Phase 3** | CheckoutPage + PaymentResultPage | 🔴 Core Feature |
| **Phase 4** | MyBookingsPage + MyTicketsPage + ProfilePage | 🟠 Cao |
| **Phase 5** | Admin Dashboard + Manage pages | 🟡 Trung bình |
| **Phase 5** | CheckInPage (QR Scanner) | 🟡 Trung bình |
| **Phase 6** | Analytics charts, Responsive polish | 🟢 Thấp |

---

## 11. Lệnh khởi tạo dự án

```bash
npm create vite@latest cinema-client -- --template react-ts
cd cinema-client
npm install

# Core
npm install react-router-dom axios zustand @tanstack/react-query

# UI
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react

# shadcn/ui (sau khi setup Tailwind)
npx shadcn-ui@latest init

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# WebSocket
npm install @stomp/stompjs sockjs-client

# Map
npm install leaflet react-leaflet @types/leaflet

# Utils
npm install date-fns
```

---

## 12. TypeScript Types cốt lõi

```typescript
// api.types.ts
interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page
  size: number;
}

// booking.types.ts
interface SeatMapItemResponse {
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: 'NORMAL' | 'VIP';
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED';
  rowIndex: number;
  colIndex: number;
  price: number;
}
```
