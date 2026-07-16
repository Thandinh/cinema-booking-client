import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Ban, CheckCircle2, Loader2, Search, Shield } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { toast } from '../../components/ui/Toast';

type UserItem = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  roles?: string[];
};

const AdminUserPage = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', keyword, page],
    queryFn: () => userApi.getAllUsers({ keyword, page, size: 15 }).then(r => r.data.result),
    placeholderData: (prev) => prev,
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => userApi.blockUser(id),
    onSuccess: () => { toast.success('Đã khóa tài khoản'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Không thể khóa tài khoản'),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => userApi.unblockUser(id),
    onSuccess: () => { toast.success('Đã mở khóa tài khoản'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Không thể mở khóa tài khoản'),
  });

  const users: UserItem[] = data?.content ?? [];

  const getRoleBadge = (roles?: string[]) => {
    if (!roles || roles.length === 0) return null;
    if (roles.includes('ADMIN')) return <span className="badge-brand">Admin</span>;
    if (roles.includes('STAFF')) return <span className="badge-warning">Staff</span>;
    return <span className="badge-neutral">User</span>;
  };

  return (
    <>
      <Helmet><title>Quản lý Người dùng — Admin Portal</title></Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Quản lý Người dùng</h1>
          <p className="mt-1 text-sm cinema-muted">Xem danh sách, tìm kiếm và khóa/mở khóa tài khoản người dùng.</p>
        </div>

        <div className="cinema-card mb-6 p-4">
          <div className="flex max-w-sm items-center gap-2 rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Tìm username, email..." value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(0); }}
              className="h-10 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none dark:text-white placeholder:text-slate-400" />
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
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-10 text-center"><Loader2 size={24} className="mx-auto animate-spin text-amber-500" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center font-semibold text-slate-500">Không tìm thấy người dùng.</td></tr>
                ) : users.map((user) => {
                  const initials = user.firstName
                    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
                    : user.username.substring(0, 2).toUpperCase();
                  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

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
                              {initials}
                            </span>
                          )}
                          <div>
                            <p className="font-black text-slate-950 dark:text-white">{fullName}</p>
                            <p className="mt-0.5 text-xs cinema-muted">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-700 dark:text-neutral-300">{user.email || '—'}</p>
                        {user.phone && <p className="mt-0.5 text-xs cinema-muted">{user.phone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Shield size={13} className="text-slate-400" />
                          {getRoleBadge(user.roles)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive
                          ? <span className="badge-success">Hoạt động</span>
                          : <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">Đã khóa</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.isActive ? (
                          <button
                            onClick={() => { if (window.confirm(`Khóa tài khoản "${user.username}"?`)) blockMutation.mutate(user.id); }}
                            disabled={blockMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            <Ban size={13} /> Khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => unblockMutation.mutate(user.id)}
                            disabled={unblockMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors dark:text-neutral-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                          >
                            <CheckCircle2 size={13} /> Mở khóa
                          </button>
                        )}
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
    </>
  );
};

export default AdminUserPage;
