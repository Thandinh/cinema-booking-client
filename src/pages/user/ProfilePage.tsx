import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  CalendarDays, CheckCircle2, Loader2, Lock, Mail,
  Phone, ShieldCheck, Ticket, User, UserCircle,
} from 'lucide-react';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../components/ui/Toast';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Nhập tên'),
  lastName:  z.string().min(1, 'Nhập họ'),
  phone:     z.string().optional(),
  dob:       z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { login, token, permissions } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => userApi.getMyProfile().then(r => r.data.result),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', dob: '' },
  });

  useEffect(() => {
    if (profile) reset({
      firstName: profile.firstName ?? '',
      lastName:  profile.lastName  ?? '',
      phone:     profile.phone     ?? '',
      dob:       profile.dob       ?? '',
    });
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => userApi.updateMyProfile(data),
    onSuccess: (res) => {
      const updated = res.data.result;
      if (token) login(token, {
        id: updated.id, username: updated.username,
        firstName: updated.firstName, lastName: updated.lastName, email: updated.email,
      }, permissions);
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Cập nhật hồ sơ thành công!');
    },
    onError: () => toast.error('Không thể cập nhật hồ sơ.'),
  });

  const initials = profile?.firstName
    ? `${profile.lastName?.charAt(0) ?? ''}${profile.firstName.charAt(0)}`.toUpperCase()
    : profile?.username?.substring(0, 2).toUpperCase() ?? 'U';

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
        <title>Hồ sơ cá nhân — CinemaBooking</title>
      </Helmet>

      <div className="page-container-md py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="badge-brand w-fit">
            <UserCircle size={13} /> Tài khoản
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-2 text-sm cinema-muted">
            Quản lý thông tin cá nhân và cài đặt tài khoản.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* ── Form ── */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(d => updateMutation.mutate(d))}>
              <div className="cinema-card p-6">
                <h2 className="mb-5 text-lg font-black text-slate-950 dark:text-white">
                  Thông tin cơ bản
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Họ" error={errors.lastName?.message}>
                    <input {...register('lastName')} placeholder="Nguyễn" className="cinema-input" />
                  </FormField>
                  <FormField label="Tên" error={errors.firstName?.message}>
                    <input {...register('firstName')} placeholder="An" className="cinema-input" />
                  </FormField>
                  <FormField label="Số điện thoại" icon={Phone} error={errors.phone?.message}>
                    <input {...register('phone')} placeholder="090..." className="cinema-input pl-10" />
                  </FormField>
                  <FormField label="Ngày sinh" icon={CalendarDays} error={errors.dob?.message}>
                    <input {...register('dob')} type="date" className="cinema-input pl-10" />
                  </FormField>
                </div>
              </div>

              {/* Read-only fields */}
              <div className="cinema-card mt-4 p-6">
                <h2 className="mb-5 text-lg font-black text-slate-950 dark:text-white">
                  Thông tin tài khoản
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ReadonlyField icon={User}  label="Tên đăng nhập" value={profile?.username ?? '—'} />
                  <ReadonlyField icon={Mail}  label="Email"         value={profile?.email    ?? 'Chưa cung cấp'} />
                  <ReadonlyField icon={Lock}  label="Mật khẩu"     value="••••••••" />
                  <ReadonlyField icon={Ticket} label="Vai trò"      value={profile?.roles?.map((r: any) => r.name || r).join(', ') ?? 'USER'} />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-sm cinema-muted">
                  {isDirty ? '⚠ Bạn có thay đổi chưa lưu.' : 'Thông tin đang được cập nhật.'}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || updateMutation.isPending || !isDirty}
                  className="btn-primary"
                >
                  {updateMutation.isPending
                    ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                    : <><CheckCircle2 size={16} /> Lưu thay đổi</>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            {/* Avatar card */}
            <div className="cinema-card p-5 text-center">
              {/* Avatar with initials */}
              <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-2xl font-black text-slate-950 shadow-lg">
                {initials}
              </div>
              <p className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                {profile?.firstName || profile?.lastName
                  ? `${profile.lastName ?? ''} ${profile.firstName ?? ''}`.trim()
                  : profile?.username}
              </p>
              <p className="mt-1 text-sm cinema-muted">{profile?.email ?? ''}</p>
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

            {/* Security notice */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={17} />
                <p className="text-xs font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
                  Thông tin của bạn được mã hóa. Chúng tôi không chia sẻ dữ liệu cá nhân với bên thứ ba.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

/* ── Sub-components ── */
const FormField = ({
  label, error, icon: Icon, children,
}: {
  label: string; error?: string; icon?: typeof User; children: React.ReactNode;
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

const ReadonlyField = ({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) => (
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
