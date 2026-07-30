import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Building2,
  CalendarDays,
  Clock3,
  Globe2,
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
  MonitorSmartphone,
  Trash2,
  Ticket,
  User,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { authApi, type AuthSession } from '../../api/authApi';
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


const formatSessionTime = (value?: string) => {
  if (!value) return 'Chưa rõ';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Chưa rõ';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const compactUserAgent = (userAgent?: string) => {
  if (!userAgent) return 'Thiết bị không xác định';
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'Trình duyệt di động';
  if (/edg/i.test(userAgent)) return 'Microsoft Edge';
  if (/chrome/i.test(userAgent)) return 'Chrome trên máy tính';
  if (/firefox/i.test(userAgent)) return 'Firefox trên máy tính';
  if (/safari/i.test(userAgent)) return 'Safari trên máy tính';
  return userAgent.length > 72 ? `${userAgent.slice(0, 72)}...` : userAgent;
};
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


  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<AuthSession[]>({
    queryKey: ['auth-sessions'],
    queryFn: () => authApi.getSessions().then(r => r.data.result ?? []),
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


  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
      toast.success('Đã đăng xuất phiên đăng nhập đã chọn.');
    },
    onError: () => toast.error('Không thể đăng xuất phiên này.'),
  });

  const revokeOtherSessionsMutation = useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
      toast.success('Đã đăng xuất khỏi các thiết bị khác.');
    },
    onError: () => toast.error('Không thể đăng xuất các thiết bị khác.'),
  });
  const initials = profile?.firstName
    ? `${profile.lastName?.charAt(0) ?? ''}${profile.firstName.charAt(0)}`.toUpperCase()
    : profile?.username?.substring(0, 2).toUpperCase() ?? 'U';
  const isEmailVerified = profile?.emailVerified === true;
  const assignedCinemas = profile?.assignedCinemas ?? [];
  const isStaffProfile = (profile?.roles ?? []).some((role: any) => String(role?.name || role).toUpperCase() === 'STAFF');

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
        <title>Hồ sơ cá nhân - cinemabooking.vn</title>
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
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">Thiết bị đang đăng nhập</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                    Quản lý các phiên đăng nhập để bảo vệ tài khoản khi dùng chung thiết bị.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeOtherSessionsMutation.mutate()}
                  disabled={revokeOtherSessionsMutation.isPending || sessions.filter(session => !session.current && !session.revokedAt).length === 0}
                  className="btn-secondary h-9 px-3 text-xs"
                >
                  {revokeOtherSessionsMutation.isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
                    : <><ShieldCheck size={14} /> Đăng xuất thiết bị khác</>
                  }
                </button>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-neutral-950 dark:text-neutral-400">
                  <Loader2 size={16} className="animate-spin text-amber-500" /> Đang tải phiên đăng nhập...
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-neutral-950 dark:text-neutral-400">
                  Chưa có phiên đăng nhập nào được ghi nhận.
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(session => {
                    const active = !session.revokedAt;
                    return (
                      <div key={session.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                            <MonitorSmartphone size={18} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-black text-slate-950 dark:text-white">{compactUserAgent(session.userAgent)}</p>
                              {session.current && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Hiện tại</span>}
                              {!active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">Đã đăng xuất</span>}
                            </div>
                            <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500 dark:text-neutral-400 sm:grid-cols-2">
                              <span className="inline-flex items-center gap-1.5"><Globe2 size={13} /> {session.ipAddress || 'Không rõ IP'}</span>
                              <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {formatSessionTime(session.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => revokeSessionMutation.mutate(session.id)}
                          disabled={session.current || !active || revokeSessionMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                          {revokeSessionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Đăng xuất
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="cinema-card p-6">
              <h2 className="mb-5 text-lg font-black text-slate-950 dark:text-white">
                Thông tin tài khoản
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReadonlyField icon={User} label="Tên đăng nhập" value={profile?.username ?? '-'} />
                <ReadonlyField icon={Mail} label="Email" value={profile?.email ?? 'Chưa cung cấp'} />
                <ReadonlyField icon={Lock} label="Mật khẩu" value="********" />
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

            {isStaffProfile && (
              <div className="cinema-card p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-950 dark:text-white">Rạp phụ trách</h2>
                    <p className="mt-1 text-xs font-semibold cinema-muted">Phạm vi soát vé và vận hành của tài khoản staff.</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                    <Building2 size={17} />
                  </span>
                </div>
                {assignedCinemas.length > 0 ? (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {assignedCinemas.map(cinema => (
                      <div key={cinema.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
                        <p className="text-sm font-black text-slate-950 dark:text-white">{cinema.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                          {[cinema.address, cinema.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
                    Chưa được admin gán rạp phụ trách.
                  </div>
                )}
              </div>
            )}

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

