import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, KeyRound, Loader2, Lock, ShieldCheck, XCircle } from 'lucide-react';
import * as z from 'zod';
import { authApi } from '../../api/authApi';
import BrandLogo from '../../components/BrandLogo';

const strongPasswordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự')
    .regex(strongPasswordRegex, 'Cần chữ hoa, chữ thường, số, ký tự đặc biệt và không có khoảng trắng'),
  confirmPassword: z.string().min(1, 'Nhập lại mật khẩu mới'),
}).refine(data => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu nhập lại không khớp',
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const getResetErrorMessage = (error: unknown) => {
  const code = (error as any)?.response?.data?.code;
  if (code === 1024) return 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
  if (code === 1023) return 'Mật khẩu nhập lại không khớp.';
  if (code === 1011) return 'Mật khẩu mới chưa đủ mạnh.';
  return 'Không thể đặt lại mật khẩu lúc này.';
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const missingToken = !token;
  const title = useMemo(() => {
    if (success) return 'Đã đặt lại mật khẩu';
    if (missingToken) return 'Link không hợp lệ';
    return 'Đặt lại mật khẩu';
  }, [missingToken, success]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setErrorMsg('');
    try {
      await authApi.resetPassword({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
    } catch (error) {
      setErrorMsg(getResetErrorMessage(error));
    }
  };

  return (
    <>
      <Helmet>
        <title>{title} — cinemabooking.vn</title>
      </Helmet>

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center">
            <BrandLogo className="text-2xl" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950">
            {success ? (
              <div className="text-center">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                  <CheckCircle2 size={34} className="text-emerald-500" />
                </div>
                <h1 className="text-xl font-black text-slate-950 dark:text-white">
                  Mật khẩu đã được cập nhật
                </h1>
                <p className="mt-2 text-sm leading-6 cinema-muted">
                  Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
                </p>
                <Link to="/login" className="btn-primary mt-6 w-full">
                  Đăng nhập
                </Link>
              </div>
            ) : missingToken ? (
              <div className="text-center">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                  <XCircle size={34} className="text-red-500" />
                </div>
                <h1 className="text-xl font-black text-slate-950 dark:text-white">
                  Link không hợp lệ
                </h1>
                <p className="mt-2 text-sm leading-6 cinema-muted">
                  Vui lòng yêu cầu link đặt lại mật khẩu mới.
                </p>
                <Link to="/forgot-password" className="btn-primary mt-6 w-full">
                  Gửi lại link
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-400/10">
                    <KeyRound size={32} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-xl font-black text-slate-950 dark:text-white">
                    Đặt lại mật khẩu
                  </h1>
                  <p className="mt-2 text-sm leading-6 cinema-muted">
                    Tạo mật khẩu mới đủ mạnh để bảo vệ tài khoản của bạn.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="cinema-label mb-2 block">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        {...register('newPassword')}
                        type="password"
                        autoComplete="new-password"
                        className="cinema-input pl-10"
                      />
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="cinema-label mb-2 block">Nhập lại mật khẩu</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        {...register('confirmPassword')}
                        type="password"
                        autoComplete="new-password"
                        className="cinema-input pl-10"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <p className="text-xs font-semibold leading-5 cinema-muted">
                    Mật khẩu cần 8-72 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    Đặt lại mật khẩu
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
