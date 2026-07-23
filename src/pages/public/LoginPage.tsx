import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Film, Lock, LogIn, Loader2, ShieldCheck, Ticket, User } from 'lucide-react';
import * as z from 'zod';
import { authApi, getAccessToken } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import BrandLogo from '../../components/BrandLogo';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type LoginForm = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Ticket,      text: 'Đặt vé và giữ ghế trong 5 phút' },
  { icon: ShieldCheck, text: 'Vé điện tử bảo mật, dùng mã QR vào rạp' },
  { icon: Film,        text: 'Theo dõi lịch sử và quản lý booking dễ dàng' },
];

const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [errorMsg, setErrorMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    try {
      const res = await authApi.login(data);
      const authResult = res.data.result;
      const token = getAccessToken(authResult);
      if (!token) throw new Error('Missing access token');

      const profileRes = await authApi.getMyProfile(token);
      const user = profileRes.data.result;

      const allPermissions = new Set<string>();
      if ((user as any).roles) {
        (user as any).roles.forEach((role: any) => {
          role.permissions?.forEach((perm: any) => allPermissions.add(perm.name));
        });
      }

      login(token, {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      }, Array.from(allPermissions), authResult.refreshToken);

      navigate(from, { replace: true });
    } catch (err: any) {
      const code = err.response?.data?.code;
      const message = String(err.response?.data?.message || '').toLowerCase();
      if (code === 1020 || message.includes('verify your email')) {
        setErrorMsg('Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư hoặc email xác thực mới nhất.');
        return;
      }
      setErrorMsg('Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại.');
    }
  };

  const completeGoogleLogin = useCallback(async (token: string, refreshToken?: string | null) => {
    const profileRes = await authApi.getMyProfile(token);
    const user = profileRes.data.result;

    const allPermissions = new Set<string>();
    if ((user as any).roles) {
      (user as any).roles.forEach((role: any) => {
        role.permissions?.forEach((perm: any) => allPermissions.add(perm.name));
      });
    }

    login(token, {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    }, Array.from(allPermissions), refreshToken);

    navigate(from, { replace: true });
  }, [from, login, navigate]);

  const handleGoogleCredential = useCallback(async (idToken?: string) => {
    if (!idToken) {
      setErrorMsg('Không nhận được thông tin đăng nhập Google. Vui lòng thử lại.');
      return;
    }

    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const res = await authApi.googleLogin({ idToken });
      const authResult = res.data.result;
      const token = getAccessToken(authResult);
      if (!token) throw new Error('Missing access token');
      await completeGoogleLogin(token, authResult.refreshToken);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setGoogleLoading(false);
    }
  }, [completeGoogleLogin]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: response => void handleGoogleCredential(response.credential),
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
      const script = existingScript ?? document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      if (!existingScript) document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <>
      <Helmet>
        <title>Đăng nhập — cinemabooking.vn</title>
      </Helmet>

      <div className="min-h-[calc(100vh-64px)] lg:grid lg:grid-cols-[1fr_480px]">
        {/* ── Left: Brand panel ── */}
        <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
          {/* Background gradient decoration */}
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-32 -translate-y-32 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-16 translate-y-16 rounded-full bg-amber-400/5 blur-2xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <BrandLogo className="text-2xl" inverted />
          </div>

          {/* Hero copy */}
          <div className="relative">
            <div className="badge-brand mb-5 !bg-amber-400/20 !text-amber-300 !ring-amber-400/30 w-fit">
              <ShieldCheck size={13} /> Thành viên
            </div>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Chào mừng<br />
              <span className="text-amber-400">trở lại!</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-white/60">
              Đăng nhập để truy cập lịch sử vé, đặt ghế nhanh và nhận thông báo suất chiếu mới nhất.
            </p>

            <ul className="mt-8 space-y-4">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-400">
                    <f.icon size={16} />
                  </span>
                  <span className="text-sm font-semibold text-white/70">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom quote */}
          <p className="relative text-xs font-semibold text-white/30">
            © {new Date().getFullYear()} cinemabooking.vn
          </p>
        </div>

        {/* ── Right: Login form ── */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandLogo className="text-xl" />
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Đăng nhập
              </h2>
              <p className="mt-1.5 text-sm cinema-muted">
                Nhập thông tin tài khoản của bạn để tiếp tục.
              </p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="mb-5 space-y-4">
              {googleClientId ? (
                <div className="relative min-h-11">
                  <div ref={googleButtonRef} className="flex justify-center" />
                  {googleLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 dark:bg-neutral-950/70">
                      <Loader2 size={18} className="animate-spin text-slate-500" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-400 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-600"
                >
                  Google login chưa cấu hình
                </button>
              )}

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-[11px] font-black uppercase tracking-[0.16em] cinema-muted">hoặc</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username */}
              <div>
                <label className="cinema-label mb-2 block">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    {...register('username')}
                    autoComplete="username"
                    placeholder="nguyenvana"
                    className="cinema-input pl-10"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="cinema-label block">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-xs font-black text-amber-600 hover:text-amber-500 dark:text-amber-400">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="cinema-input pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || googleLoading}
                className="btn-primary w-full mt-2"
              >
                {isSubmitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LogIn size={17} />
                )}
                {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-semibold cinema-muted">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-black text-amber-600 hover:text-amber-500 dark:text-amber-400">
                Đăng ký miễn phí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
