import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — dùng cho /login và /register.
 * Layout 2 cột full-screen, không có Navbar hay Footer.
 */
const AuthLayout = () => (
  <div className="min-h-screen bg-stone-50 dark:bg-neutral-950">
    <Outlet />
  </div>
);

export default AuthLayout;
