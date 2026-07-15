import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2, Film, Loader2, Lock, Mail,
  Phone, Star, Ticket, User, UserPlus,
} from 'lucide-react';
import * as z from 'zod';
import { authApi } from '../../api/authApi';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Nhập tên'),
  lastName:  z.string().min(1, 'Nhập họ'),
  username:  z.string().min(4, 'Ít nhất 4 ký tự').max(50),
  email:     z.string().email('Email không hợp lệ'),
  password:  z.string().min(6, 'Ít nhất 6 ký tự'),
  phone:     z.string().optional(),
});
type RegisterForm = z.infer<typeof registerSchema>;

const BENEFITS = [
  { icon: Ticket,       text: 'Đặt vé và giữ ghế chỉ trong 3 phút' },
  { icon: Star,         text: 'Nhận thông báo khi phim yêu thích mở vé' },
  { icon: CheckCircle2, text: 'Lưu toàn bộ lịch sử đặt vé trong tài khoản' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setErrorMsg('');
    try {
      await authApi.register(data);
      setSuccess(true);
      window.setTimeout(() => navigate('/login'), 1600);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập hoặc email đã tồn tại.',
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>Đăng ký — CinemaBooking</title>
      </Helmet>

      <div className="min-h-[calc(100vh-64px)] lg:grid lg:grid-cols-[1fr_520px]">
        {/* ── Left: Brand panel ── */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
          {/* Decorations */}
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-32 -translate-y-32 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-16 translate-y-16 rounded-full bg-amber-400/5 blur-2xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-950">
              <Film size={20} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-black tracking-tight text-white">CinemaBooking</span>
          </div>

          {/* Hero copy */}
          <div className="relative">
            <div className="badge-brand mb-5 !bg-amber-400/20 !text-amber-300 !ring-amber-400/30 w-fit">
              <UserPlus size={13} /> Thành viên mới
            </div>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Một tài khoản<br />
              <span className="text-amber-400">cho mọi trải nghiệm.</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-white/60">
              Đăng ký miễn phí để đặt vé, chọn ghế yêu thích và nhận vé điện tử ngay trong tài khoản.
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((b, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-400">
                    <b.icon size={16} />
                  </span>
                  <span className="text-sm font-semibold text-white/70">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs font-semibold text-white/30">
            © {new Date().getFullYear()} CinemaBooking — Hoàn toàn miễn phí
          </p>
        </div>

        {/* ── Right: Register form ── */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                <Film size={18} />
              </span>
              <span className="font-black text-slate-950 dark:text-white">CinemaBooking</span>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Tạo tài khoản
              </h2>
              <p className="mt-1.5 text-sm cinema-muted">
                Hoàn toàn miễn phí — chỉ mất 1 phút để bắt đầu.
              </p>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {errorMsg}
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 size={16} />
                Đăng ký thành công! Đang chuyển sang đăng nhập...
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="cinema-label mb-2 block">Họ</label>
                  <input {...register('lastName')} placeholder="Nguyễn" className="cinema-input" />
                  {errors.lastName && (
                    <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <label className="cinema-label mb-2 block">Tên</label>
                  <input {...register('firstName')} placeholder="An" className="cinema-input" />
                  {errors.firstName && (
                    <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="cinema-label mb-2 block">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input {...register('username')} autoComplete="username" placeholder="nguyenan" className="cinema-input pl-10" />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.username.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="cinema-label mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input {...register('email')} type="email" autoComplete="email" placeholder="email@example.com" className="cinema-input pl-10" />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Phone + Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="cinema-label mb-2 block">Điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input {...register('phone')} placeholder="090..." className="cinema-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="cinema-label mb-2 block">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input {...register('password')} type="password" autoComplete="new-password" placeholder="••••••••" className="cinema-input pl-10" />
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || success}
                className="btn-primary w-full mt-2"
              >
                {isSubmitting
                  ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
                  : <><UserPlus size={16} /> Tạo tài khoản miễn phí</>
                }
              </button>

              <p className="text-center text-xs font-semibold cinema-muted">
                Bằng cách đăng ký, bạn đồng ý với điều khoản sử dụng của CinemaBooking.
              </p>
            </form>

            <p className="mt-6 text-center text-sm font-semibold cinema-muted">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-black text-amber-600 hover:text-amber-500 dark:text-amber-400">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
