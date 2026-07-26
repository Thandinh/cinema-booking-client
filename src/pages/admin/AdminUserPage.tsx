import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Ban,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Shield,
  UserRound,
  X,
} from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import { userApi } from '../../api/userApi';
import { toast } from '../../components/ui/toastBus';
import type { Cinema } from '../../types/domain.types';

type RoleItem = string | { id?: string; name: string };

type UserItem = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  roles?: RoleItem[];
  assignedCinemas?: Cinema[];
};

const roleNamesOf = (roles?: RoleItem[]) =>
  (roles ?? []).map((role) => (typeof role === 'string' ? role : role.name));

const isStaffUser = (user: UserItem) => roleNamesOf(user.roles).includes('STAFF');

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

const AdminUserPage = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [editingStaff, setEditingStaff] = useState<UserItem | null>(null);
  const [selectedCinemaIds, setSelectedCinemaIds] = useState<string[]>([]);
  const [scopeSearch, setScopeSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', keyword, page],
    queryFn: () => userApi.getAllUsers({ keyword, page, size: 15 }).then(r => r.data.result),
    placeholderData: (prev) => prev,
  });

  const { data: cinemasPage, isLoading: isLoadingCinemas } = useQuery({
    queryKey: ['admin-cinemas-for-staff-scope'],
    queryFn: () => cinemaApi.getAll({ page: 0, size: 300 }).then(r => r.data.result),
    staleTime: 5 * 60 * 1000,
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
  const cinemas: Cinema[] = cinemasPage?.content ?? [];

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
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý người dùng</h1>
          <p className="mt-1 text-sm cinema-muted">Xem danh sách, tìm kiếm, khóa tài khoản và gán phạm vi rạp cho nhân viên.</p>
        </div>

        <div className="cinema-card mb-6 p-4">
          <div className="flex max-w-sm items-center gap-2 rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm username, email..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(0); }}
              className="h-10 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
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
                        <div className="flex justify-end gap-2">
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
    </>
  );
};

export default AdminUserPage;