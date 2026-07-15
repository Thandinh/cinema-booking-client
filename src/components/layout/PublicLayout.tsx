import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * PublicLayout — dùng cho toàn bộ trang public và user:
 * Navbar trên + Footer dưới + <main> chiếm phần giữa.
 */
const PublicLayout = () => (
  <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
