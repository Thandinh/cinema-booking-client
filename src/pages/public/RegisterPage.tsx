import { Link, useNavigate } from 'react-router-dom';
import type { ElementType, ReactNode } from 'react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Mail, Phone, Ticket, User } from 'lucide-react';
import * as z from 'zod';
import { authApi } from '../../api/authApi';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Nhập tên'),
  lastName: z.string().min(1, 'Nhập họ'),
  username: z.string().min(4, 'Ít nhất 4 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Ít nhất 6 ký tự'),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

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
      window.setTimeout(() => navigate('/login'), 1400);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập hoặc email đã tồn tại.');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[440px_1fr] lg:px-8">
      <Helmet>
        <title>Đăng ký - CinemaBooking</title>
      </Helmet>

      <section className="flex items-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10 sm:p-8">
          <div className="mb-7">
            <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-amber-400 text-slate-950">
              <Ticket size={23} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Tạo tài khoản</h1>
            <p className="mt-2 text-sm cinema-muted">Bắt đầu đặt vé và lưu lịch sử xem phim.</p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorMsg}
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 size={17} />
              Đăng ký thành công. Đang chuyển sang đăng nhập...
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Họ" error={errors.lastName?.message}>
                <input {...register('lastName')} placeholder="Nguyễn" className="cinema-input" />
              </TextField>
              <TextField label="Tên" error={errors.firstName?.message}>
                <input {...register('firstName')} placeholder="An" className="cinema-input" />
              </TextField>
            </div>

            <TextField label="Tên đăng nhập" error={errors.username?.message} icon={User}>
              <input {...register('username')} placeholder="nguyenan" className="cinema-input pl-11" />
            </TextField>

            <TextField label="Email" error={errors.email?.message} icon={Mail}>
              <input {...register('email')} type="email" placeholder="email@example.com" className="cinema-input pl-11" />
            </TextField>

            <TextField label="Số điện thoại" error={errors.phone?.message} icon={Phone}>
              <input {...register('phone')} placeholder="090..." className="cinema-input pl-11" />
            </TextField>

            <TextField label="Mật khẩu" error={errors.password?.message}>
              <input {...register('password')} type="password" placeholder="••••••••" className="cinema-input" />
            </TextField>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Ticket size={17} />}
              {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold cinema-muted">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-black text-amber-700 hover:text-amber-600 dark:text-amber-300">
              Đăng nhập
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden items-center lg:flex">
        <div className="rounded-3xl bg-slate-950 p-10 text-white shadow-2xl dark:bg-white dark:text-slate-950">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300 dark:text-amber-600">CinemaBooking</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">Một tài khoản cho toàn bộ hành trình đặt vé.</h2>
          <div className="mt-8 grid gap-4">
            {['Chọn ghế trực quan theo từng suất chiếu', 'Theo dõi trạng thái thanh toán', 'Lưu vé và lịch sử đặt chỗ'].map(item => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-sm font-bold dark:bg-slate-100">
                <CheckCircle2 className="text-amber-300 dark:text-amber-600" size={18} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const TextField = ({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: ElementType;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-500">{label}</span>
    <span className="relative block">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />}
      {children}
    </span>
    {error && <span className="mt-1.5 block text-xs font-semibold text-red-500">{error}</span>}
  </label>
);

export default RegisterPage;
