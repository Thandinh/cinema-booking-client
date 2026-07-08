import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Film, Loader2, Lock, LogIn, User } from 'lucide-react';
import * as z from 'zod';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    try {
      const res = await authApi.login(data);
      const token = res.data.result.token;
      login(token, { id: '', username: data.username }, []);

      const profileRes = await authApi.getMyProfile();
      const user = profileRes.data.result;
      login(token, {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }, []);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu.');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
      <Helmet>
        <title>Đăng nhập - CinemaBooking</title>
      </Helmet>

      <section className="hidden items-center lg:flex">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            <Film size={14} />
            Thành viên
          </div>
          <h1 className="mt-5 max-w-2xl text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Đăng nhập để tiếp tục đặt vé và quản lý lịch sử.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 cinema-muted">
            Tài khoản giúp bạn giữ ghế, thanh toán và xem lại các vé đã đặt trong một nơi duy nhất.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {['Giữ ghế 10 phút', 'Vé điện tử', 'Lịch sử rõ ràng'].map(item => (
              <div key={item} className="rounded-2xl bg-white p-4 text-sm font-black text-slate-950 shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:text-white dark:ring-white/10">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 sm:p-8">
          <div className="mb-7">
            <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-amber-400 dark:text-slate-950">
              <LogIn size={23} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Đăng nhập</h1>
            <p className="mt-2 text-sm cinema-muted">Nhập thông tin tài khoản để tiếp tục.</p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">Tên đăng nhập</span>
              <span className="relative block">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  {...register('username')}
                  autoComplete="username"
                  placeholder="nguyenvana"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:focus:ring-amber-400/10"
                />
              </span>
              {errors.username && <span className="mt-1.5 block text-xs font-semibold text-red-500">{errors.username.message}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">Mật khẩu</span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:focus:ring-amber-400/10"
                />
              </span>
              {errors.password && <span className="mt-1.5 block text-xs font-semibold text-red-500">{errors.password.message}</span>}
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
              {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold cinema-muted">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-black text-amber-700 hover:text-amber-600 dark:text-amber-300">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
