import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, CalendarClock, Loader2, MapPin, QrCode, SearchX, ShieldCheck } from 'lucide-react';
import { cinemaApi } from '../../api/cinemaApi';
import { ticketApi } from '../../api/ticketApi';
import { userApi } from '../../api/userApi';
import type { Cinema } from '../../types/domain.types';

const getRoleName = (role: unknown) => {
  if (typeof role === 'string') return role;
  if (role && typeof role === 'object' && 'name' in role) return String((role as { name?: unknown }).name ?? '');
  return '';
};

const hasRole = (roles: unknown[] | undefined, roleName: string) =>
  (roles ?? []).some(role => getRoleName(role).toUpperCase() === roleName);

const StaffAssignedCinemasPage = () => {
  const profileQuery = useQuery({
    queryKey: ['staff-check-in-profile'],
    queryFn: () => userApi.getMyProfile().then(response => response.data.result),
    staleTime: 60_000,
  });

  const profile = profileQuery.data;
  const roles = profile?.roles as unknown[] | undefined;
  const isAdminAccount = hasRole(roles, 'ADMIN');

  const allCinemasQuery = useQuery({
    queryKey: ['staff-assigned-cinemas-admin-all'],
    enabled: isAdminAccount,
    queryFn: () => cinemaApi.getAll({ page: 0, size: 300 }).then(response => response.data.result.content),
    staleTime: 5 * 60 * 1000,
  });

  const cinemas = useMemo<Cinema[]>(
    () => (isAdminAccount ? allCinemasQuery.data ?? [] : profile?.assignedCinemas ?? []),
    [allCinemasQuery.data, isAdminAccount, profile?.assignedCinemas],
  );

  const showtimeQueries = useQueries({
    queries: cinemas.map(cinema => ({
      queryKey: ['staff-assigned-cinema-open-showtimes', cinema.id],
      queryFn: () => ticketApi.getOpenCheckInShowtimes(cinema.id).then(response => response.data.result),
      enabled: Boolean(cinema.id),
      staleTime: 30_000,
      refetchInterval: 30_000,
    })),
  });

  const isLoading = profileQuery.isLoading || (isAdminAccount && allCinemasQuery.isLoading);

  return (
    <>
      <Helmet>
        <title>Rạp phụ trách | cinemabooking.vn Staff</title>
      </Helmet>

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-800 ring-1 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
              <Building2 size={13} /> Nhân viên
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              Rạp phụ trách
            </h1>
            <p className="mt-2 max-w-2xl text-sm cinema-muted">
              Danh sách rạp bạn được phép xem dữ liệu vận hành và soát vé. Nếu cần thay đổi phạm vi, hãy liên hệ admin.
            </p>
          </div>

          <Link to="/staff/scanner" className="btn-primary h-11 shrink-0 px-4 text-sm">
            <QrCode size={16} /> Mở soát vé QR
          </Link>
        </div>

        {isAdminAccount && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            Tài khoản admin có quyền toàn hệ thống, vì vậy danh sách bên dưới hiển thị toàn bộ rạp đang hoạt động.
          </div>
        )}

        {isLoading ? (
          <div className="cinema-card flex min-h-[260px] items-center justify-center">
            <div className="flex items-center gap-3 rounded-full bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 dark:bg-neutral-950 dark:text-neutral-300">
              <Loader2 className="animate-spin text-amber-500" size={18} /> Đang tải rạp phụ trách...
            </div>
          </div>
        ) : cinemas.length === 0 ? (
          <div className="cinema-card flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              <SearchX size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Chưa được gán rạp</h2>
            <p className="mt-2 max-w-md text-sm cinema-muted">
              Tài khoản staff này chưa có rạp phụ trách nên chưa thể chọn rạp để soát vé. Admin cần gán rạp trong mục Người dùng.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {cinemas.map((cinema, index) => {
              const showtimeQuery = showtimeQueries[index];
              const openShowtimes = showtimeQuery?.data ?? [];
              const isShowtimeLoading = showtimeQuery?.isLoading;

              return (
                <article key={cinema.id} className="cinema-card overflow-hidden">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                          <Building2 size={16} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-slate-950 dark:text-white">{cinema.name}</h2>
                          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">{cinema.city || 'Chưa có thành phố'}</p>
                        </div>
                      </div>

                      <p className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-600 dark:text-neutral-300">
                        <MapPin className="mt-1 shrink-0 text-amber-500" size={15} />
                        <span>{[cinema.address, cinema.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-200 dark:bg-neutral-950 dark:ring-white/10 sm:min-w-32">
                      <div className="mx-auto mb-2 grid size-9 place-items-center rounded-xl bg-white text-amber-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
                        <CalendarClock size={16} />
                      </div>
                      <p className="text-2xl font-black text-slate-950 dark:text-white">
                        {isShowtimeLoading ? <Loader2 className="mx-auto animate-spin text-amber-500" size={20} /> : openShowtimes.length}
                      </p>
                      <p className="mt-0.5 text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-neutral-500">suất mở check-in</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-white/8 dark:bg-neutral-950/50">
                    {openShowtimes.length > 0 ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="mt-0.5 shrink-0" size={14} />
                          Đang có suất trong thời gian check-in, có thể chuyển qua màn soát vé để chọn rạp và quét.
                        </div>
                        <Link to="/staff/scanner" className="btn-secondary h-9 shrink-0 px-3 text-xs">
                          <QrCode size={14} /> Soát vé
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                        Hiện chưa có suất chiếu nào của rạp này đang mở check-in.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default StaffAssignedCinemasPage;