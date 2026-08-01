import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Ban,
  Building2,
  CheckCircle2,
  Edit3,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import { userApi } from '../../api/userApi';
import { toast } from '../../components/ui/toastBus';
import type { Cinema } from '../../types/domain.types';

type RoleItem = string | { id?: string; name: string };
type RoleTab = 'ALL' | 'USER' | 'STAFF' | 'ADMIN';
type UserFormMode = 'create' | 'edit';

type RoleOption = {
  id: string;
  name: string;
  description?: string;
};

type UserFormData = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  avatarUrl: string;
  roleIds: string[];
  assignedCinemaIds: string[];
};

type UserItem = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  dob?: string;
  isActive: boolean;
  roles?: RoleItem[];
  assignedCinemas?: Cinema[];
};

const EMPTY_CINEMAS: Cinema[] = [];
const EMPTY_ROLES: RoleOption[] = [];

const roleNamesOf = (roles?: RoleItem[]) =>
  (roles ?? []).map((role) => (typeof role === 'string' ? role : role.name));

const isStaffUser = (user: UserItem) => roleNamesOf(user.roles).includes('STAFF');
const isAdminUser = (user: UserItem) => roleNamesOf(user.roles).includes('ADMIN');

const ROLE_TABS: Array<{
  id: RoleTab;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    id: 'ALL',
    label: 'Tất cả',
    description: 'Toàn bộ tài khoản trong hệ thống.',
    icon: UserRound,
  },
  {
    id: 'USER',
    label: 'Người dùng',
    description: 'Khách hàng đặt vé và quản lý vé cá nhân.',
    icon: UserRound,
  },
  {
    id: 'STAFF',
    label: 'Nhân viên',
    description: 'Nhân viên rạp, soát vé và vận hành suất chiếu.',
    icon: Building2,
  },
  {
    id: 'ADMIN',
    label: 'Quản trị viên',
    description: 'Tài khoản có quyền quản trị hệ thống.',
    icon: Shield,
  },
];

const fullNameOf = (user: UserItem) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

const initialsOf = (user: UserItem) => {
  const name = fullNameOf(user);
  const chunks = name.split(' ').filter(Boolean);
  if (chunks.length >= 2) {
    return `${chunks[0].charAt(0)}${chunks[chunks.length - 1].charAt(0)}`.toUpperCase();
  }
  return user.username.substring(0, 2).toUpperCase();
};

const emptyUserForm = (): UserFormData => ({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  avatarUrl: '',
  roleIds: [],
  assignedCinemaIds: [],
});

const temporaryPassword = () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `Cinema@${new Date().getFullYear()}${suffix}`;
};

const UserAccountModal = ({
  mode,
  user,
  roles,
  cinemas,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  mode: UserFormMode;
  user: UserItem | null;
  roles: RoleOption[];
  cinemas: Cinema[];
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) => {
  const [form, setForm] = useState<UserFormData>(() => emptyUserForm());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const roleIds = mode === 'edit'
      ? (user?.roles ?? [])
          .map(role => (typeof role === 'string' ? roles.find(item => item.name === role)?.id : role.id))
          .filter((id): id is string => Boolean(id))
      : roles.filter(role => role.name === 'USER').map(role => role.id);

    setForm({
      username: user?.username ?? '',
      password: mode === 'create' ? temporaryPassword() : '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      dob: user?.dob ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      roleIds,
      assignedCinemaIds: (user?.assignedCinemas ?? []).map(cinema => cinema.id),
    });
    setError('');
  }, [isOpen, mode, roles, user]);

  if (!isOpen) return null;

  const selectedRoleNames = roles
    .filter(role => form.roleIds.includes(role.id))
    .map(role => role.name);
  const hasStaffRole = selectedRoleNames.includes('STAFF');

  const updateField = (field: keyof UserFormData, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setForm(current => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter(id => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  };

  const toggleAssignedCinema = (cinemaId: string) => {
    setForm(current => ({
      ...current,
      assignedCinemaIds: current.assignedCinemaIds.includes(cinemaId)
        ? current.assignedCinemaIds.filter(id => id !== cinemaId)
        : [...current.assignedCinemaIds, cinemaId],
    }));
  };

  const handleSubmit = () => {
    const email = form.email.trim();
    const username = form.username.trim();
    if (!username || username.length < 4) {
      setError('Tên đăng nhập phải có ít nhất 4 ký tự.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ.');
      return;
    }
    if (mode === 'create' && form.password.length < 8) {
      setError('Mật khẩu tạm thời phải có ít nhất 8 ký tự.');
      return;
    }
    if (form.roleIds.length === 0) {
      setError('Hãy chọn ít nhất một vai trò cho tài khoản.');
      return;
    }

    const commonPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email,
      phone: form.phone.trim() || null,
      dob: form.dob || null,
      avatarUrl: form.avatarUrl.trim() || null,
      roleIds: form.roleIds,
      assignedCinemaIds: hasStaffRole ? form.assignedCinemaIds : [],
    };

    onSubmit(mode === 'create'
      ? { username, password: form.password, ...commonPayload }
      : commonPayload);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-white/10">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              {mode === 'create' ? 'Tạo tài khoản mới' : 'Sửa tài khoản'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-neutral-400">
              {mode === 'create'
                ? 'Admin tạo account vận hành với mật khẩu tạm thời, người dùng có thể đổi lại sau.'
                : 'Cập nhật thông tin, vai trò và phạm vi rạp. Mật khẩu được xử lý bằng email đặt lại riêng.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="cinema-label mb-2 block">Tên đăng nhập *</span>
              <input
                value={form.username}
                disabled={mode === 'edit'}
                onChange={event => updateField('username', event.target.value)}
                className="cinema-input disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-neutral-900"
                placeholder="staff2"
              />
            </label>

            <label className="block">
              <span className="cinema-label mb-2 block">Email *</span>
              <input
                value={form.email}
                onChange={event => updateField('email', event.target.value)}
                className="cinema-input"
                placeholder="staff@cinemabooking.vn"
              />
            </label>

            {mode === 'create' && (
              <label className="block md:col-span-2">
                <span className="cinema-label mb-2 block">Mật khẩu tạm thời *</span>
                <div className="flex gap-2">
                  <input
                    value={form.password}
                    onChange={event => updateField('password', event.target.value)}
                    className="cinema-input"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('password', temporaryPassword())}
                    className="btn-ghost shrink-0"
                  >
                    Tạo lại
                  </button>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                  Dùng để đăng nhập lần đầu. Sau đó nên gửi email đặt lại mật khẩu cho người dùng tự đổi.
                </p>
              </label>
            )}

            <label className="block">
              <span className="cinema-label mb-2 block">Họ</span>
              <input
                value={form.firstName}
                onChange={event => updateField('firstName', event.target.value)}
                className="cinema-input"
                placeholder="Nguyễn"
              />
            </label>

            <label className="block">
              <span className="cinema-label mb-2 block">Tên</span>
              <input
                value={form.lastName}
                onChange={event => updateField('lastName', event.target.value)}
                className="cinema-input"
                placeholder="An"
              />
            </label>

            <label className="block">
              <span className="cinema-label mb-2 block">Số điện thoại</span>
              <input
                value={form.phone}
                onChange={event => updateField('phone', event.target.value)}
                className="cinema-input"
                placeholder="0901234567"
              />
            </label>

            <label className="block">
              <span className="cinema-label mb-2 block">Ngày sinh</span>
              <input
                type="date"
                value={form.dob}
                onChange={event => updateField('dob', event.target.value)}
                className="cinema-input"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="cinema-label mb-2 block">Avatar URL</span>
              <input
                value={form.avatarUrl}
                onChange={event => updateField('avatarUrl', event.target.value)}
                className="cinema-input"
                placeholder="https://..."
              />
            </label>
          </div>

          <section className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <h3 className="font-black text-slate-950 dark:text-white">Vai trò</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {roles.map(role => {
                const checked = form.roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`rounded-xl px-4 py-3 text-left ring-1 transition-colors ${checked
                      ? 'bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-neutral-950 dark:ring-white'
                      : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-white hover:text-slate-950 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-black">{role.name}</span>
                    <span className={`mt-1 block text-xs font-semibold ${checked ? 'text-white/70 dark:text-neutral-500' : 'cinema-muted'}`}>
                      {role.description || 'Vai trò hệ thống'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {hasStaffRole && (
            <section className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <div className="mb-3">
                <h3 className="font-black text-slate-950 dark:text-white">Rạp phụ trách</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                  Staff chỉ được xem booking, thanh toán, suất chiếu và soát vé trong các rạp này.
                </p>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {cinemas.map(cinema => {
                  const checked = form.assignedCinemaIds.includes(cinema.id);
                  return (
                    <label
                      key={cinema.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${checked
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-950 dark:hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssignedCinema(cinema.id)}
                        className="mt-1 size-4 accent-amber-500"
                      />
                      <span>
                        <span className="block text-sm font-black text-slate-950 dark:text-white">{cinema.name}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-neutral-400">
                          {[cinema.address, cinema.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-slate-500">
            {mode === 'edit' ? 'Không sửa mật khẩu trực tiếp trong form này.' : 'Tạo account xong có thể gửi email đặt lại mật khẩu.'}
          </p>
          <div className="flex gap-2 sm:justify-end">
            <button type="button" onClick={onClose} className="btn-ghost !h-10 !px-4 !text-sm">Hủy</button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="btn-primary !h-10 !px-4 !text-sm disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminUserPage = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<RoleTab>('ALL');
  const [page, setPage] = useState(0);
  const [editingStaff, setEditingStaff] = useState<UserItem | null>(null);
  const [accountModal, setAccountModal] = useState<{ mode: UserFormMode; user: UserItem | null } | null>(null);
  const [selectedCinemaIds, setSelectedCinemaIds] = useState<string[]>([]);
  const [scopeSearch, setScopeSearch] = useState('');
  const [staffCityFilter, setStaffCityFilter] = useState('');
  const [staffCinemaFilter, setStaffCinemaFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', activeRoleTab, keyword, staffCityFilter, staffCinemaFilter, page],
    queryFn: () => userApi.getAllUsers({
      keyword,
      role: activeRoleTab === 'ALL' ? undefined : activeRoleTab,
      assignedCity: activeRoleTab === 'STAFF' && staffCityFilter && staffCinemaFilter === 'ALL'
        ? staffCityFilter
        : undefined,
      assignedCinemaId: activeRoleTab === 'STAFF' && !['ALL', 'UNASSIGNED'].includes(staffCinemaFilter)
        ? staffCinemaFilter
        : undefined,
      unassignedStaff: activeRoleTab === 'STAFF' && staffCinemaFilter === 'UNASSIGNED' ? true : undefined,
      page,
      size: 15,
    }).then(r => r.data.result),
    placeholderData: (prev) => prev,
  });

  const { data: cinemasPage, isLoading: isLoadingCinemas } = useQuery({
    queryKey: ['admin-cinemas-for-staff-scope'],
    queryFn: () => cinemaApi.getAll({ page: 0, size: 300 }).then(r => r.data.result),
    staleTime: 5 * 60 * 1000,
  });

  const { data: rolesData = [] } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: () => userApi.getRoles().then(r => r.data.result),
    staleTime: 10 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => userApi.createUser(payload),
    onSuccess: () => {
      toast.success('Đã tạo tài khoản');
      setAccountModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể tạo tài khoản'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => userApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật tài khoản');
      setAccountModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['staff-check-in-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-showtime-profile'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể cập nhật tài khoản'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userApi.requestPasswordReset(id),
    onSuccess: () => toast.success('Đã gửi email đặt lại mật khẩu'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Đã xóa mềm tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể xóa tài khoản'),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => userApi.blockUser(id),
    onSuccess: () => {
      toast.success('Đã khóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Không thể khóa tài khoản'),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => userApi.unblockUser(id),
    onSuccess: () => {
      toast.success('Đã mở khóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Không thể mở khóa tài khoản'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, assignedCinemaIds }: { userId: string; assignedCinemaIds: string[] }) =>
      userApi.updateUser(userId, { assignedCinemaIds }),
    onSuccess: () => {
      toast.success('Đã cập nhật rạp phụ trách');
      setEditingStaff(null);
      setScopeSearch('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['staff-check-in-profile'] });
    },
    onError: () => toast.error('Không thể cập nhật rạp phụ trách'),
  });

  const users: UserItem[] = data?.content ?? [];
  const cinemas: Cinema[] = cinemasPage?.content ?? EMPTY_CINEMAS;
  const roles: RoleOption[] = rolesData ?? EMPTY_ROLES;

  const staffFilterCities = useMemo(
    () => Array.from(new Set(cinemas.map(cinema => cinema.city).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)),
    [cinemas],
  );

  const staffFilterCinemas = useMemo(
    () => staffCityFilter ? cinemas.filter(cinema => cinema.city === staffCityFilter) : cinemas,
    [cinemas, staffCityFilter],
  );

  const selectedCinemas = useMemo(
    () => cinemas.filter(cinema => selectedCinemaIds.includes(cinema.id)),
    [cinemas, selectedCinemaIds],
  );

  const filteredCinemas = useMemo(() => {
    const normalized = scopeSearch.trim().toLowerCase();
    if (!normalized) return cinemas;
    return cinemas.filter(cinema =>
      [cinema.name, cinema.city, cinema.address]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(normalized)),
    );
  }, [cinemas, scopeSearch]);

  const openScopeModal = (user: UserItem) => {
    setEditingStaff(user);
    setSelectedCinemaIds((user.assignedCinemas ?? []).map(cinema => cinema.id));
    setScopeSearch('');
  };

  const closeScopeModal = () => {
    if (assignMutation.isPending) return;
    setEditingStaff(null);
    setScopeSearch('');
  };

  const toggleCinema = (cinemaId: string) => {
    setSelectedCinemaIds((current) =>
      current.includes(cinemaId)
        ? current.filter(id => id !== cinemaId)
        : [...current, cinemaId],
    );
  };

  const getRoleBadge = (roles?: RoleItem[]) => {
    const names = roleNamesOf(roles);
    if (names.length === 0) return null;
    if (names.includes('ADMIN')) return <span className="badge-brand">Admin</span>;
    if (names.includes('STAFF')) return <span className="badge-warning">Staff</span>;
    return <span className="badge-neutral">User</span>;
  };

  return (
    <>
      <Helmet><title>Quản lý người dùng - Admin Portal</title></Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý người dùng</h1>
            <p className="mt-1 text-sm cinema-muted">Tạo account, cập nhật vai trò, khóa tài khoản và gán phạm vi rạp cho nhân viên.</p>
          </div>
          <button
            type="button"
            onClick={() => setAccountModal({ mode: 'create', user: null })}
            className="btn-primary"
          >
            <Plus size={16} />
            Tạo tài khoản
          </button>
        </div>

        <div className="cinema-card mb-6 p-4">
          <div className="mb-4 grid gap-2 lg:grid-cols-4">
            {ROLE_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeRoleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveRoleTab(tab.id);
                    setPage(0);
                    if (tab.id !== 'STAFF') {
                      setStaffCityFilter('');
                      setStaffCinemaFilter('ALL');
                    }
                  }}
                  className={`rounded-2xl px-4 py-3 text-left ring-1 transition-colors ${isActive
                    ? 'bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-neutral-950 dark:ring-white'
                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-white hover:text-slate-950 dark:bg-neutral-950 dark:text-neutral-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-black">
                    <Icon size={16} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                    {tab.label}
                  </span>
                  <span className={`mt-1 block text-xs font-semibold leading-5 ${isActive ? 'text-white/70 dark:text-neutral-500' : 'cinema-muted'}`}>
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex max-w-sm items-center gap-2 rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm username, email, SĐT..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(0); }}
              className="h-10 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          {activeRoleTab === 'STAFF' && (
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">
                  Thành phố
                </span>
                <select
                  value={staffCityFilter}
                  onChange={event => {
                    setStaffCityFilter(event.target.value);
                    setStaffCinemaFilter('ALL');
                    setPage(0);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition-colors focus:border-amber-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                >
                  <option value="">Tất cả thành phố</option>
                  {staffFilterCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">
                  Rạp phụ trách
                </span>
                <select
                  value={staffCinemaFilter}
                  onChange={event => {
                    setStaffCinemaFilter(event.target.value);
                    setPage(0);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition-colors focus:border-amber-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                >
                  <option value="ALL">Tất cả rạp</option>
                  <option value="UNASSIGNED">Chưa gán rạp</option>
                  {staffFilterCinemas.map(cinema => (
                    <option key={cinema.id} value={cinema.id}>
                      {cinema.name}{cinema.city ? ` - ${cinema.city}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="cinema-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-neutral-950 dark:text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Email / SĐT</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Rạp phụ trách</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 size={24} className="mx-auto animate-spin text-amber-500" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center font-semibold text-slate-500">Không tìm thấy người dùng.</td></tr>
                ) : users.map((user) => {
                  const assignedCinemas = user.assignedCinemas ?? [];

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              referrerPolicy="no-referrer"
                              className="size-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                            />
                          ) : (
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-black text-white dark:from-neutral-600 dark:to-neutral-800">
                              {initialsOf(user)}
                            </span>
                          )}
                          <div>
                            <p className="font-black text-slate-950 dark:text-white">{fullNameOf(user)}</p>
                            <p className="mt-0.5 text-xs cinema-muted">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-700 dark:text-neutral-300">{user.email || '-'}</p>
                        {user.phone && <p className="mt-0.5 text-xs cinema-muted">{user.phone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Shield size={13} className="text-slate-400" />
                          {getRoleBadge(user.roles)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isStaffUser(user) ? (
                          <button
                            type="button"
                            onClick={() => openScopeModal(user)}
                            className="group max-w-[280px] text-left"
                          >
                            {assignedCinemas.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {assignedCinemas.slice(0, 2).map(cinema => (
                                  <span key={cinema.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition-colors group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:ring-amber-200 dark:bg-white/5 dark:text-neutral-300 dark:ring-white/10 dark:group-hover:bg-amber-500/10 dark:group-hover:text-amber-300 dark:group-hover:ring-amber-500/20">
                                    {cinema.name}
                                  </span>
                                ))}
                                {assignedCinemas.length > 2 && (
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                                    +{assignedCinemas.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-red-500">Chưa gán rạp</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive
                          ? <span className="badge-success">Hoạt động</span>
                          : <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">Đã khóa</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setAccountModal({ mode: 'edit', user })}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Edit3 size={13} /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Gửi email đặt lại mật khẩu cho "${user.username}"?`)) {
                                resetPasswordMutation.mutate(user.id);
                              }
                            }}
                            disabled={resetPasswordMutation.isPending || !user.email}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                          >
                            <KeyRound size={13} /> Đặt lại mật khẩu
                          </button>
                          {isStaffUser(user) && (
                            <button
                              onClick={() => openScopeModal(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:text-neutral-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
                            >
                              <Building2 size={13} /> Rạp phụ trách
                            </button>
                          )}
                          {user.isActive ? (
                            <button
                              onClick={() => { if (window.confirm(`Khóa tài khoản "${user.username}"?`)) blockMutation.mutate(user.id); }}
                              disabled={blockMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Ban size={13} /> Khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => unblockMutation.mutate(user.id)}
                              disabled={unblockMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                            >
                              <CheckCircle2 size={13} /> Mở khóa
                            </button>
                          )}
                          {!isAdminUser(user) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Xóa mềm tài khoản "${user.username}"?`)) {
                                  deleteMutation.mutate(user.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-white/5">
              <span className="text-sm font-semibold text-slate-500">
                Trang {page + 1} / {data?.totalPages} ({data?.totalElements} người dùng)
              </span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">Trước</button>
                <button disabled={page >= (data?.totalPages ?? 1) - 1} onClick={() => setPage(p => p + 1)} className="btn-ghost !h-8 !px-3 !text-xs disabled:opacity-50">Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingStaff && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-white/10">
              <div className="flex min-w-0 items-start gap-3">
                {editingStaff.avatarUrl ? (
                  <img
                    src={editingStaff.avatarUrl}
                    alt={editingStaff.username}
                    referrerPolicy="no-referrer"
                    className="size-12 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-950 text-sm font-black text-white">
                    {initialsOf(editingStaff)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-black text-slate-950 dark:text-white">Rạp phụ trách của {fullNameOf(editingStaff)}</h2>
                    {getRoleBadge(editingStaff.roles)}
                    {editingStaff.isActive ? <span className="badge-success">Hoạt động</span> : <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-500/10 dark:text-red-300">Đã khóa</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1.5"><UserRound size={13} /> @{editingStaff.username}</span>
                    {editingStaff.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {editingStaff.email}</span>}
                    {editingStaff.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {editingStaff.phone}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeScopeModal}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-neutral-900/60">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-950 dark:text-white">Đang phụ trách</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">Các rạp staff được phép xem dữ liệu và soát vé.</p>
                    </div>
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                      <Building2 size={16} />
                    </span>
                  </div>

                  {selectedCinemas.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      Nhân viên này chưa được gán rạp. Nếu để trống, staff sẽ không thấy rạp trong màn soát vé và các danh sách quản trị theo phạm vi rạp.
                    </div>
                  ) : (
                    <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                      {selectedCinemas.map(cinema => (
                        <div key={cinema.id} className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
                          <p className="text-sm font-black text-slate-950 dark:text-white">{cinema.name}</p>
                          <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                            <MapPin className="mt-0.5 shrink-0" size={13} />
                            <span>{[cinema.address, cinema.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950 dark:text-white">Chọn rạp được giao</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">Có thể gán nhiều rạp cho một staff.</p>
                    </div>
                    <div className="flex h-10 min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10 sm:w-64">
                      <Search size={15} className="text-slate-400" />
                      <input
                        value={scopeSearch}
                        onChange={event => setScopeSearch(event.target.value)}
                        placeholder="Tìm rạp, thành phố..."
                        className="w-full bg-transparent text-xs font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                      />
                    </div>
                  </div>

                  {isLoadingCinemas ? (
                    <div className="py-10 text-center"><Loader2 size={24} className="mx-auto animate-spin text-amber-500" /></div>
                  ) : cinemas.length === 0 ? (
                    <p className="py-8 text-center text-sm font-semibold text-slate-500">Chưa có rạp để gán.</p>
                  ) : filteredCinemas.length === 0 ? (
                    <p className="py-8 text-center text-sm font-semibold text-slate-500">Không tìm thấy rạp phù hợp.</p>
                  ) : (
                    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {filteredCinemas.map(cinema => {
                        const checked = selectedCinemaIds.includes(cinema.id);
                        return (
                          <label
                            key={cinema.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${checked
                              ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-950 dark:hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCinema(cinema.id)}
                              className="mt-1 size-4 accent-amber-500"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900 dark:text-white">{cinema.name}</span>
                              <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-neutral-400">
                                {[cinema.address, cinema.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold text-slate-500">Đã chọn {selectedCinemaIds.length} rạp cho nhân viên này</p>
              <div className="flex gap-2 sm:justify-end">
                <button type="button" onClick={closeScopeModal} className="btn-ghost !h-10 !px-4 !text-sm">Hủy</button>
                <button
                  type="button"
                  disabled={assignMutation.isPending}
                  onClick={() => assignMutation.mutate({ userId: editingStaff.id, assignedCinemaIds: selectedCinemaIds })}
                  className="btn-primary !h-10 !px-4 !text-sm disabled:opacity-60"
                >
                  {assignMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu phạm vi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserAccountModal
        isOpen={Boolean(accountModal)}
        mode={accountModal?.mode ?? 'create'}
        user={accountModal?.user ?? null}
        roles={roles}
        cinemas={cinemas}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) return;
          setAccountModal(null);
        }}
        onSubmit={(payload) => {
          if (accountModal?.mode === 'edit' && accountModal.user) {
            updateMutation.mutate({ id: accountModal.user.id, payload });
            return;
          }
          createMutation.mutate(payload);
        }}
      />
    </>
  );
};

export default AdminUserPage;
