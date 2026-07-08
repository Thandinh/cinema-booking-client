import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Film, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProtectedRoute from '../components/ProtectedRoute';

const HomePage = lazy(() => import('../pages/public/HomePage'));
const MovieDetailPage = lazy(() => import('../pages/public/MovieDetailPage'));
const LoginPage = lazy(() => import('../pages/public/LoginPage'));
const RegisterPage = lazy(() => import('../pages/public/RegisterPage'));
const CinemaMapPage = lazy(() => import('../pages/public/CinemaMapPage'));
const SeatSelectionPage = lazy(() => import('../pages/user/SeatSelectionPage'));
const MyBookingsPage = lazy(() => import('../pages/user/MyBookingsPage'));
const CheckoutPage = lazy(() => import('../pages/user/CheckoutPage'));
const PaymentResultPage = lazy(() => import('../pages/user/PaymentResultPage'));
const TicketDetailPage = lazy(() => import('../pages/user/TicketDetailPage'));

const PageLoader = () => (
  <div className="flex min-h-[420px] items-center justify-center">
    <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
      <Loader2 className="animate-spin text-amber-500" size={18} />
      Đang tải trải nghiệm
    </div>
  </div>
);

const AppRouter = () => (
  <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28rem),linear-gradient(180deg,#fffaf0_0%,#f8fafc_28%,#f1f5f9_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_28rem),linear-gradient(180deg,#0a0a0a_0%,#111111_48%,#0a0a0a_100%)] dark:text-stone-50">
    <Navbar />
    <main className="flex-1">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/cinemas" element={<CinemaMapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/seat-selection/:showtimeId"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:bookingId"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/result"
            element={
              <ProtectedRoute>
                <PaymentResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my/bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my/bookings/:bookingId"
            element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
                <div className="mb-5 rounded-2xl bg-amber-100 p-4 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20">
                  <Film size={40} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Không tìm thấy trang</h2>
                <p className="mt-2 text-sm cinema-muted">Đường dẫn này không tồn tại hoặc đã được di chuyển.</p>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </main>
    <Footer />
  </div>
);

export default AppRouter;
