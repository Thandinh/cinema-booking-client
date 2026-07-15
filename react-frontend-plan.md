# 🎬 CinemaBooking Frontend — Kế hoạch Thiết kế lại Toàn bộ UI

> **Mục tiêu:** Xây dựng giao diện đẹp, chuyên nghiệp, đủ tiêu chuẩn sản phẩm thật như CGV, Galaxy Cinema.
> **Nguyên tắc:** Đơn giản – Rõ ràng – Mượt mà – Nhất quán – Mobile-first.

---

## I. Design System (Chuẩn hóa)

### 1.1 Bảng màu

| Token       | Light           | Dark            | Dùng cho               |
| ----------- | --------------- | --------------- | ---------------------- |
| surface     | white           | neutral-900     | Card, Panel            |
| surface-alt | stone-50        | neutral-950     | Background trang       |
| border      | slate-200/80    | white/10        | Viền card              |
| text-primary| slate-950       | white           | Tiêu đề                |
| text-muted  | slate-500       | neutral-400     | Mô tả phụ              |
| brand       | amber-400       | amber-400       | CTA, Accent            |
| brand-dark  | slate-950       | white           | Nút chính              |
| success     | emerald-500     | emerald-400     | Thành công             |
| danger      | red-500         | red-400         | Lỗi                    |

### 1.2 Typography Scale

| Role         | Size     | Weight | Dùng cho          |
| ------------ | -------- | ------ | ----------------- |
| hero         | 5xl–6xl  | 900    | H1 trang chủ      |
| page-title   | 3xl–4xl  | 900    | H1 mỗi trang      |
| section-title| xl–2xl   | 900    | H2 section        |
| card-title   | base–lg  | 900    | Tên phim          |
| body         | sm–base  | 600    | Nội dung chính    |
| caption      | xs       | 600    | Label, meta info  |

### 1.3 Component Tokens

```
Button primary:   bg-amber-400 text-slate-950 font-black rounded-2xl px-5 h-11
Button secondary: bg-slate-950 text-white font-black rounded-2xl px-5 h-11
Button ghost:     border border-slate-200 text-slate-700 rounded-2xl
Card:             bg-white ring-1 ring-slate-200/80 rounded-3xl shadow-sm
Badge:            rounded-full px-3 py-1 text-xs font-black
Input:            h-11 rounded-2xl border border-slate-200 focus:border-amber-400
```

---

## II. Kiến trúc Trang & Trạng thái

| # | Trang             | Route                | Role   | Trạng thái              |
| - | ----------------- | -------------------- | ------ | ----------------------- |
| 1 | Trang chủ         | /                    | Public | ✅ Có → đang nâng cấp  |
| 2 | Chi tiết phim     | /movies/:id          | Public | ✅ Có → đang nâng cấp  |
| 3 | Bản đồ rạp        | /cinemas             | Public | ✅ Có                   |
| 4 | Đăng nhập         | /login               | Public | ✅ Có → đang nâng cấp  |
| 5 | Đăng ký           | /register            | Public | ✅ Có                   |
| 6 | Chọn ghế          | /seat-selection/:id  | User   | ✅ Có (phức tạp)        |
| 7 | Checkout          | /checkout/:id        | User   | ✅ Có                   |
| 8 | Kết quả TT        | /payment/result      | User   | ✅ Có                   |
| 9 | Vé của tôi        | /my/bookings         | User   | ✅ Có → đang nâng cấp  |
|10 | Chi tiết vé       | /my/bookings/:id     | User   | ✅ Có → ticket redesign |
|11 | Hồ sơ             | /profile             | User   | ✅ Có                   |
|12 | Admin Dashboard   | /admin/dashboard     | Admin  | ✅ Có → đang nâng cấp  |
|13 | Staff Scanner     | /staff/scanner       | Staff  | ✅ Có                   |

---

## III. Kế hoạch Triển khai theo Thứ tự Ưu tiên

### PHASE 1 — Design Foundation
- [x] index.css — design tokens đầy đủ, custom utilities
- [x] Navbar.tsx — nâng cấp UX
- [ ] Footer.tsx — tạo mới hoặc nâng cấp

### PHASE 2 — Core User Pages
- [x] MovieCard.tsx — redesign poster + hover
- [x] HomePage.tsx — hero mạnh, grid tối ưu
- [ ] MovieDetailPage.tsx — 2-column layout, showtime tabs
- [x] MyBookingsPage.tsx — timeline card, color status
- [x] TicketDetailPage.tsx — e-ticket design đẹp như vé thật

### PHASE 3 — Auth & Profile
- [ ] LoginPage.tsx — two-column, glassmorphism
- [ ] RegisterPage.tsx — cùng style Login
- [ ] ProfilePage.tsx — avatar initials, stats

### PHASE 4 — Staff & Admin
- [x] AdminDashboardPage.tsx — đã nâng cấp micro-animations
- [ ] StaffTicketScannerPage.tsx — fullscreen UX

### PHASE 5 — Booking Flow (polish UI)
- [ ] SeatSelectionPage.tsx — legend rõ hơn, mobile tốt hơn
- [ ] CheckoutPage.tsx — order summary rõ ràng
- [ ] PaymentResultPage.tsx — confetti khi success

---

## IV. Shared Components cần chuẩn hóa

```
src/components/
  ui/
    Button.tsx       — variants: primary, secondary, ghost, danger
    Badge.tsx        — variants: success, warning, error, neutral
    Skeleton.tsx     — loading placeholder reusable
    Toast.tsx        — ✅ đã có
    EmptyState.tsx   — icon + title + description + CTA
    PageHeader.tsx   — breadcrumb badge + h1 + description
  layout/
    Navbar.tsx       — ✅ đã có
    Footer.tsx       — cần nâng cấp
```

---

## V. Vấn đề & Giải pháp

| Vấn đề                              | Trang              | Giải pháp                              |
| ----------------------------------- | ------------------ | -------------------------------------- |
| Hero section chưa visual đủ mạnh   | HomePage           | Backdrop blurred, stats nổi bật        |
| MovieCard quá nhỏ, thiếu info       | HomePage           | Tăng kích thước, hover reveal          |
| Ticket design không như vé thật     | TicketDetailPage   | E-ticket style vé máy bay              |
| Booking list khó scan nhanh         | MyBookingsPage     | Color coding theo status               |
| Admin dashboard thiếu analytics     | AdminDashboard     | Thêm table top showtimes               |
| Không có Footer                     | Tất cả             | Tạo Footer chuẩn                      |

---
*Cập nhật: 2026-07-12 — Đang triển khai Phase 1 → 2*
