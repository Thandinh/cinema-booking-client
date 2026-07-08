# CinemaBooking React Frontend - Product Implementation Plan

Tài liệu này phản ánh trạng thái frontend hiện tại của `cinema-client` và roadmap để nâng lên mức product thật. Đây không còn là plan khởi tạo cũ, mà là tài liệu triển khai sống dùng để đối chiếu với code.

## 1. Trạng Thái Hiện Tại

Frontend hiện đã có một luồng khách hàng tương đối hoàn chỉnh:

1. Xem danh sách phim đang chiếu/sắp chiếu.
2. Tìm kiếm phim.
3. Xem chi tiết phim và lịch chiếu theo rạp.
4. Đăng nhập/đăng ký.
5. Chọn ghế theo suất chiếu.
6. Giữ ghế tạm thời.
7. Tạo booking.
8. Checkout và chọn phương thức thanh toán.
9. Xem kết quả thanh toán.
10. Xem danh sách vé/booking của tôi.
11. Xem chi tiết vé điện tử.
12. Xem bản đồ rạp và mở chỉ đường.

## 2. Tech Stack Thực Tế

| Layer | Đang dùng | Ghi chú |
| --- | --- | --- |
| Framework | React 19 + Vite 8 | App SPA, lazy route loading |
| Language | TypeScript | `tsc -b` trong build |
| Routing | React Router 7 | Public route + protected route |
| Server State | TanStack Query 5 | Fetch/cache/loading/error states |
| Client State | Zustand 5 | Auth và theme |
| HTTP Client | Axios | Interceptor tự gắn JWT |
| Styling | Tailwind CSS 4 | Dùng Vite plugin `@tailwindcss/vite` |
| Forms | React Hook Form + Zod | Login/register validation |
| Icons | Lucide React | Icon system thống nhất |
| Map | Leaflet | Dùng trực tiếp Leaflet trong `CinemaMapPage` |
| SEO | react-helmet-async | Per-page title/meta |
| Lint | oxlint | `npm run lint` |

Chưa cài và chưa dùng: shadcn/ui, STOMP/SockJS, Recharts, toast library, date-fns.

## 3. Cấu Trúc Thư Mục Hiện Tại

```txt
src/
  api/
    authApi.ts
    axiosClient.ts
    bookingApi.ts
    cinemaApi.ts
    movieApi.ts
    paymentApi.ts
  components/
    layout/
      Footer.tsx
      Navbar.tsx
    MovieCard.tsx
    MovieCardSkeleton.tsx
    ProtectedRoute.tsx
  pages/
    public/
      CinemaMapPage.tsx
      HomePage.tsx
      LoginPage.tsx
      MovieDetailPage.tsx
      RegisterPage.tsx
    user/
      CheckoutPage.tsx
      MyBookingsPage.tsx
      PaymentResultPage.tsx
      SeatSelectionPage.tsx
      TicketDetailPage.tsx
  router/
    AppRouter.tsx
  stores/
    authStore.ts
    themeStore.ts
  types/
    api.types.ts
    domain.types.ts
```

## 4. Routes Hiện Tại

### Public

| Route | Page | Mục đích |
| --- | --- | --- |
| `/` | `HomePage` | Danh sách phim, search, tab đang chiếu/sắp chiếu |
| `/movies/:id` | `MovieDetailPage` | Chi tiết phim, metadata, trailer, lịch chiếu |
| `/cinemas` | `CinemaMapPage` | Bản đồ rạp, tìm rạp, vị trí gần tôi |
| `/login` | `LoginPage` | Đăng nhập |
| `/register` | `RegisterPage` | Đăng ký |

### User Protected

| Route | Page | Mục đích |
| --- | --- | --- |
| `/seat-selection/:showtimeId` | `SeatSelectionPage` | Chọn ghế và giữ ghế |
| `/checkout/:bookingId` | `CheckoutPage` | Kiểm tra booking và thanh toán |
| `/payment/result` | `PaymentResultPage` | Hiển thị trạng thái thanh toán |
| `/my/bookings` | `MyBookingsPage` | Danh sách vé/booking |
| `/my/bookings/:bookingId` | `TicketDetailPage` | Vé điện tử và mã check-in |

## 5. API Mapping Hiện Tại

### Auth

| Action | API |
| --- | --- |
| Đăng nhập | `POST /auth/token` |
| Lấy profile | `GET /api/v1/users/my-profile` |
| Đăng ký | `POST /api/v1/users/register` |
| Đăng xuất | `POST /auth/logout` |

### Movie/Cinema

| Action | API |
| --- | --- |
| Danh sách phim | `GET /api/v1/movies` |
| Chi tiết phim | `GET /api/v1/movies/{id}` |
| Lịch chiếu theo phim | `GET /api/v1/showtimes/movie/{movieId}` |
| Bản đồ rạp | `GET /api/v1/cinemas/map` |
| Rạp gần tôi | `GET /api/v1/cinemas/nearest` |

### Booking/Payment

| Action | API |
| --- | --- |
| Sơ đồ ghế | `GET /api/v1/bookings/showtimes/{showtimeId}/seats` |
| Giữ ghế | `POST /api/v1/bookings/hold` |
| Tạo booking | `POST /api/v1/bookings` |
| Chi tiết booking | `GET /api/v1/bookings/{id}` |
| Booking của tôi | `GET /api/v1/bookings/my` |
| Hủy booking | `PATCH /api/v1/bookings/{id}/cancel` |
| Khởi tạo thanh toán | `POST /api/v1/payments/initiate` |
| Thanh toán của tôi | `GET /api/v1/payments/my` |

## 6. Luồng Product Chính

```txt
HomePage
  -> MovieDetailPage
  -> chọn showtime
  -> ProtectedRoute
  -> SeatSelectionPage
  -> POST hold seats
  -> POST create booking
  -> CheckoutPage
  -> POST initiate payment
  -> payment gateway hoặc PaymentResultPage
  -> MyBookingsPage
  -> TicketDetailPage
```

Điểm quan trọng đã làm đúng product:

- User không thể chọn ghế nếu chưa đăng nhập.
- Sau khi chọn ghế không dừng ở alert/demo, mà tạo booking thật.
- Booking có màn checkout riêng.
- Payment result có route riêng để nhận callback/query params.
- MyBookings có CTA thanh toán tiếp nếu booking còn `PENDING`.
- Ticket detail có thông tin phim, rạp, suất chiếu, ghế, tổng tiền và secure token/check-in code.

## 7. UX/Product Standard Đã Áp Dụng

- Layout responsive cho desktop/mobile.
- Loading, empty state và error state cho các màn chính.
- CTA rõ theo hành trình người dùng.
- Không dùng link ảo trong navbar.
- Theme sáng/tối.
- Card phim có poster fallback và hover affordance.
- Seat map có màn hình, legend, trạng thái ghế và summary thanh toán.
- Auth flow có validation và giữ redirect sau login.
- ProtectedRoute dùng `<Navigate />`, không điều hướng trong render bằng side effect.

## 8. Khoảng Trống Cần Làm Tiếp Để Production Hơn

### Ưu tiên cao

1. Realtime seat updates bằng WebSocket.
   - Cài `@stomp/stompjs` và `sockjs-client` nếu backend dùng STOMP.
   - Subscribe theo showtime: `/topic/showtimes/{id}/seats`.
   - Khi seat đổi trạng thái, update query cache của TanStack Query.

2. Toast/notification system.
   - Thay `alert()` trong booking flow.
   - Gợi ý: Sonner hoặc một toast component tự viết.

3. QR thật cho vé điện tử.
   - Hiện `TicketDetailPage` hiển thị `secureToken` và icon QR.
   - Nên render QR bitmap/canvas từ `secureToken` hoặc dùng QR endpoint từ backend.

4. Payment callback chuẩn hóa.
   - Xác nhận backend trả params nào: `bookingId`, `vnp_TxnRef`, `vnp_ResponseCode`, `resultCode`.
   - Sau callback nên refetch booking/payment để hiển thị trạng thái thật từ server.

### Ưu tiên trung bình

1. Hủy booking từ MyBookings/TicketDetail.
2. Profile page.
3. My payments page hoặc payment history trong ticket detail.
4. Admin/staff dashboard:
   - Manage movies
   - Manage cinemas
   - Manage showtimes
   - Manage bookings
   - Check-in QR
5. Permission guard theo role/permission thay vì chỉ kiểm tra token.

### Ưu tiên thấp

1. Unit/integration tests cho auth, booking, checkout.
2. Visual regression hoặc Playwright smoke test.
3. Skeleton polish theo từng màn.
4. Tách `SeatMap`, `BookingSummary`, `StatusBadge` thành component dùng lại.

## 9. Lệnh Kiểm Tra

```bash
npm.cmd run lint
npm.cmd run build
```

Khi chạy dev trên Windows PowerShell nếu bị chặn `npm.ps1`, dùng:

```bash
npm.cmd run dev
```

Hoặc:

```bash
node_modules\.bin\vite.cmd --host 127.0.0.1
```

## 10. Definition Of Done Cho Product Frontend

Một tính năng frontend chỉ được coi là đạt chuẩn product khi có đủ:

1. Route thật và có thể truy cập bằng URL.
2. Loading state.
3. Empty state nếu dữ liệu rỗng.
4. Error state nếu API lỗi.
5. Auth guard nếu cần đăng nhập.
6. CTA tiếp theo rõ ràng.
7. Responsive mobile/desktop.
8. Không có link chết trong UI chính.
9. TypeScript build pass.
10. Lint pass.
