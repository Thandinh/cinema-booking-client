import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Film, Loader2 } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import AuthLayout from '../components/layout/AuthLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

/* ── Lazy pages ── */
const HomePage             = lazy(() => import('../pages/public/HomePage'));
const MovieDetailPage      = lazy(() => import('../pages/public/MovieDetailPage'));
const CinemaMapPage        = lazy(() => import('../pages/public/CinemaMapPage'));
const CinemaDetailPage     = lazy(() => import('../pages/public/CinemaDetailPage'));
const LoginPage            = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage         = lazy(() => import('../pages/public/RegisterPage'));
const SeatSelectionPage    = lazy(() => import('../pages/user/SeatSelectionPage'));
const MyBookingsPage       = lazy(() => import('../pages/user/MyBookingsPage'));
const CheckoutPage         = lazy(() => import('../pages/user/CheckoutPage'));
const PaymentResultPage    = lazy(() => import('../pages/user/PaymentResultPage'));
const TicketDetailPage     = lazy(() => import('../pages/user/TicketDetailPage'));
const ProfilePage          = lazy(() => import('../pages/user/ProfilePage'));
const AdminDashboardPage   = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminMoviePage       = lazy(() => import('../pages/admin/AdminMoviePage'));
const AdminCinemaPage      = lazy(() => import('../pages/admin/AdminCinemaPage'));
const AdminShowtimePage    = lazy(() => import('../pages/admin/AdminShowtimePage'));
const AdminUserPage        = lazy(() => import('../pages/admin/AdminUserPage'));
const StaffTicketScannerPage = lazy(() => import('../pages/staff/StaffTicketScannerPage'));

/* ── Page loader ── */
const PageLoader = () => (
  <div className="flex min-h-[420px] items-center justify-center">
    <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
      <Loader2 className="animate-spin text-amber-500" size={18} />
      Đang tải...
    </div>
  </div>
);

/* ── Not found page ── */
const NotFoundPage = () => (
  <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
    <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-400/10">
      <Film size={28} className="text-amber-600 dark:text-amber-400" />
    </div>
    <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
      Không tìm thấy trang
    </h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">
      Đường dẫn này không tồn tại hoặc đã được di chuyển.
    </p>
  </div>
);

const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ══ AUTH — clean layout, no navbar/footer ══ */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* ══ ADMIN / STAFF — sidebar layout ══ */}
      <Route element={<AdminLayout />}>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute permission="DASHBOARD_VIEW">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/movies"
          element={
            <ProtectedRoute permission="MOVIE_CREATE">
              <AdminMoviePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cinemas"
          element={
            <ProtectedRoute permission="CINEMA_CREATE">
              <AdminCinemaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/showtimes"
          element={
            <ProtectedRoute permission="SHOWTIME_CREATE">
              <AdminShowtimePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute permission="USER_VIEW">
              <AdminUserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/scanner"
          element={
            <ProtectedRoute permission="TICKET_CHECKIN">
              <StaffTicketScannerPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ══ PUBLIC / USER — navbar + footer layout ══ */}
      <Route element={<PublicLayout />}>
        {/* Public */}
        <Route path="/"          element={<HomePage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/cinemas"   element={<CinemaMapPage />} />
        <Route path="/cinemas/:id" element={<CinemaDetailPage />} />

        {/* Protected user routes */}
        <Route
          path="/seat-selection/:showtimeId"
          element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>}
        />
        <Route
          path="/checkout/:bookingId"
          element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
        />
        <Route
          path="/payment/result"
          element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>}
        />
        <Route
          path="/my/bookings"
          element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>}
        />
        <Route
          path="/my/bookings/:bookingId"
          element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;
