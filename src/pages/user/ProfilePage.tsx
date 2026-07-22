import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  MailWarning,
  Phone,
  Send,
  ShieldCheck,
  Ticket,
  User,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../components/ui/toastBus';

const phoneRegex = /^(\+84|0)[3-9][0-9]{8}$/;
const strongPasswordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Nhập tên'),
  lastName: z.string().trim().min(1, 'Nhập họ'),
  phone: z.string().trim().optional().refine(
    value => !value || phoneRegex.test(value),
    'Số điện thoại không hợp lệ',
  ),
  dob: z.string().optional().refine((value) => {
    if (!value) return true;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Number.isFinite(selectedDate.getTime()) && selectedDate < today;
  }, 'Ngày sinh phải nhỏ hơn ngày hiện tại'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword: z.string()
    .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự')
    .regex(strongPasswordRegex, 'Cần chữ hoa, chữ thường, số, ký tự đặc biệt và không có khoảng trắng'),
  confirmPassword: z.string().min(1, 'Nhập lại mật khẩu mới'),
}).refine(data => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu nhập lại không khớp',
}).refine(data => data.currentPassword !== data.newPassword, {
  path: ['newPassword'],
  message: 'Mật khẩu mới nên khác mật khẩu hiện tại',
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const getPasswordErrorMessage = (error: unknown) => {
  const code = (error as any)?.response?.data?.code;
  if (code === 1022) return 'Mật khẩu hiện tại không đúng.';
  if (code === 1023) return 'Mật khẩu nhập lại không khớp.';
  if (code === 1011) return 'Mật khẩu mới chưa đủ mạnh.';
  return 'Không thể đổi mật khẩu lúc này.';
};

const ProfilePage = () => {
  const { login, token, permissions } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => userApi.getMyProfile().then(r => r.data.result),
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', dob: '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        dob: profile.dob ?? '',
      });
    }
  }, [profile, profileForm]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => userApi.updateMyProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      dob: data.dob || undefined,
    }),
    onSuccess: (res) => {
      const updated = res.data.result;
      if (token) {
        login(token, {
          id: updated.id,
          username: updated.username,
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          avatarUrl: updated.avatarUrl,
          emailVerified: updated.emailVerified,
        }, permissions);
      }
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Cập nhật hồ sơ thành công!');
    },
    onError: () => toast.error('Không thể cập nhật hồ sơ.'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) => userApi.changeMyPassword(data),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Đổi mật khẩu thành công!');
    },
    onError: (error) => toast.error(getPasswordErrorMessage(error)),
  });

  const resendMutation = useMutation({
    mutationFn: () => userApi.resendEmailVerification({ email: profile?.email ?? '' }),
    onSuccess: () => toast.success('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.'),
    onError: () => toast.error('Không thể gửi lại email xác thực.'),
  });

  const initials = profile?.firstName
    ? `${profile.lastName?.charAt(0) ?? ''}${profile.firstName.charAt(0)}`.toUpperCase()
    : profile?.username?.substring(0, 2).toUpperCase() ?? 'U';
  const isEmailVerified = profile?.emailVerified === true;

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải hồ sơ...
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hồ sơ cá nhân — cinemabooking.vn</title>
      </Helmet>

      <div className="page-container-md py-8">
        <div className="mb-8">
          <div className="badge-brand w-fit">
            <UserCircle size={13} /> Tài khoản
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-2 text-sm cinema-muted">
            Quản lý thông tin cá nhân và bảo mật tài khoản.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <form onSubmit={profileForm.handleSubmit(data => updateMutation.mutate(data))}>
              <div className="cinema-card p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">
                    Thông tin cơ bản
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-neutral-400">
                    Hồ sơ
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Họ" error={profileForm.formState.errors.lastName?.message}>
                    <input {...profileForm.register('lastName')} placeholder="Nguyễn" className="cinema-input" />
                  </FormField>
                  <FormField label="Tên" error={profileForm.formState.errors.firstName?.message}>
                    <input {...profileForm.register('firstName')} placeholder="An" className="cinema-input" />
                  </FormField>
                  <FormField label="Số điện thoại" icon={Phone} error={profileForm.formState.errors.phone?.message}>
                    <input {...profileForm.register('phone')} placeholder="0901234567" className="cinema-input pl-10" />
                  </FormField>
                  <FormField label="Ngày sinh" icon={CalendarDays} error={profileForm.formState.errors.dob?.message}>
                    <input {...profileForm.register('dob')} type="date" className="cinema-input pl-10" />
                  </FormField>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-sm cinema-muted">
                  {profileForm.formState.isDirty ? 'Bạn có thay đổi chưa lưu.' : 'Thông tin đang được cập nhật.'}
                </p>
                <button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting || updateMutation.isPending || !profileForm.formState.isDirty}
                  className="btn-primary"
                >
                  {updateMutation.isPending
                    ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                    : <><CheckCircle2 size={16} /> Lưu thay đổi</>
                  }
                </button>
              </div>
            </form>

            <form onSubmit={passwordForm.handleSubmit(data => passwordMutation.mutate(data))}>
              <div className="cinema-card p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">
                    Bảo mật tài khoản
                  </h2>
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    <KeyRound size={17} />
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Mật khẩu hiện tại" icon={Lock} error={passwordForm.formState.errors.currentPassword?.message}>
                    <input
                      {...passwordForm.register('currentPassword')}
                      type="password"
                      autoComplete="current-password"
                      className="cinema-input pl-10"
                    />
                  </FormField>
                  <FormField label="Mật khẩu mới" icon={KeyRound} error={passwordForm.formState.errors.newPassword?.message}>
                    <input
                      {...passwordForm.register('newPassword')}
                      type="password"
                      autoComplete="new-password"
                      className="cinema-input pl-10"
                    />
                  </FormField>
                  <FormField label="Nhập lại mật khẩu" icon={ShieldCheck} error={passwordForm.formState.errors.confirmPassword?.message}>
                    <input
                      {...passwordForm.register('confirmPassword')}
                      type="password"
                      autoComplete="new-password"
                      className="cinema-input pl-10"
                    />
                  </FormField>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-neutral-400">
                    Mật khẩu cần 8-72 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                  <button
                    type="submit"
                    disabled={passwordMutation.isPending || !passwordForm.formState.isDirty}
                    className="btn-secondary shrink-0"
                  >
                    {passwordMutation.isPending
                      ? <><Loader2 size={16} className="animate-spin" /> Đang đổi...</>
                      : <><KeyRound size={16} /> Đổi mật khẩu</>
                    }
                  </button>
                </div>
              </div>
            </form>

            <div className="cinema-card p-6">
              <h2 className="mb-5 text-lg font-black text-slate-950 dark:text-white">
                Thông tin tài khoản
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReadonlyField icon={User} label="Tên đăng nhập" value={profile?.username ?? '—'} />
                <ReadonlyField icon={Mail} label="Email" value={profile?.email ?? 'Chưa cung cấp'} />
                <ReadonlyField icon={Lock} label="Mật khẩu" value="••••••••" />
                <ReadonlyField icon={Ticket} label="Vai trò" value={profile?.roles?.map((r: any) => r.name || r).join(', ') ?? 'USER'} />
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="cinema-card p-5 text-center">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile?.username ?? 'Avatar'}
                  referrerPolicy="no-referrer"
                  className="mx-auto size-20 rounded-2xl object-cover shadow-lg ring-1 ring-slate-200 dark:ring-white/10"
                />
              ) : (
                <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-2xl font-black text-slate-950 shadow-lg">
                  {initials}
                </div>
              )}
              <p className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                {profile?.firstName || profile?.lastName
                  ? `${profile.lastName ?? ''} ${profile.firstName ?? ''}`.trim()
                  : profile?.username}
              </p>
              <p className="mt-1 truncate text-sm cinema-muted">{profile?.email ?? ''}</p>
              {profile?.roles && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {profile.roles.map((r: any, i: number) => (
                    <span key={i} className="badge-brand text-[11px]">
                      {r.name || r}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-4 ${
              isEmailVerified
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
            }`}>
              <div className="flex items-start gap-3">
                {isEmailVerified ? (
                  <MailCheck className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={18} />
                ) : (
                  <MailWarning className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={18} />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-black ${
                    isEmailVerified ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    {isEmailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}
                  </p>
                  <p className={`mt-1 text-xs font-semibold leading-5 ${
                    isEmailVerified ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {isEmailVerified
                      ? 'Tài khoản của bạn đã sẵn sàng để nhận vé và thông báo.'
                      : 'Xác thực email để nhận vé điện tử và bảo vệ tài khoản tốt hơn.'}
                  </p>
                  {!isEmailVerified && profile?.email && (
                    <button
                      type="button"
                      onClick={() => resendMutation.mutate()}
                      disabled={resendMutation.isPending}
                      className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-black text-amber-700 shadow-sm ring-1 ring-amber-200 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-950 dark:text-amber-300 dark:ring-amber-500/20 dark:hover:bg-neutral-900"
                    >
                      {resendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Gửi lại xác thực
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={17} />
                <p className="text-xs font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
                  Thông tin của bạn được bảo vệ và chỉ dùng cho đặt vé, nhận vé điện tử, hỗ trợ giao dịch.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

const FormField = ({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) => (
  <div>
    <label className="cinema-label mb-2 block">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />}
      {children}
    </div>
    {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
  </div>
);

const ReadonlyField = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-neutral-950">
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-neutral-800 dark:ring-white/10">
      <Icon size={14} />
    </span>
    <div className="min-w-0">
      <p className="cinema-label leading-none">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
