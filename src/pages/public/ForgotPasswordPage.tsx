import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import * as z from 'zod';
import { authApi } from '../../api/authApi';
import BrandLogo from '../../components/BrandLogo';

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    await authApi.forgotPassword({ email: data.email.trim() });
    setSubmittedEmail(data.email.trim());
  };

  return (
    <>
      <Helmet>
        <title>Quên mật khẩu — cinemabooking.vn</title>
      </Helmet>

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center">
            <BrandLogo className="text-2xl" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950">
            {submittedEmail ? (
              <div className="text-center">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                  <CheckCircle2 size={34} className="text-emerald-500" />
                </div>
                <h1 className="text-xl font-black text-slate-950 dark:text-white">
                  Kiểm tra email của bạn
                </h1>
                <p className="mt-2 text-sm leading-6 cinema-muted">
                  Nếu <strong>{submittedEmail}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.
                </p>
                <Link to="/login" className="btn-primary mt-6 w-full">
                  <ArrowLeft size={16} />
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-400/10">
                    <Mail size={32} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-xl font-black text-slate-950 dark:text-white">
                    Quên mật khẩu?
                  </h1>
                  <p className="mt-2 text-sm leading-6 cinema-muted">
                    Nhập email đã đăng ký để nhận link đặt lại mật khẩu.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="cinema-label mb-2 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        {...register('email')}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="cinema-input pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Gửi link đặt lại
                  </button>
                </form>

                <Link
                  to="/login"
                  className="mt-5 flex items-center justify-center gap-2 text-sm font-black text-amber-600 hover:text-amber-500 dark:text-amber-400"
                >
                  <ArrowLeft size={15} />
                  Quay lại đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
