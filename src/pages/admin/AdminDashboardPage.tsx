import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  BarChart3, CalendarDays, Clapperboard, DollarSign,
  Loader2, Ticket, TrendingUp, Users, AlertCircle
} from 'lucide-react';
import { analyticsApi } from '../../api/analyticsApi';
import { useAuthStore } from '../../stores/authStore';
import { formatMoney } from '../../utils/format';

const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary().then(r => r.data.result),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['analytics-revenue', period],
    queryFn: () =>
      period === 'daily'
        ? analyticsApi.getDailyRevenue().then(r => r.data.result)
        : analyticsApi.getMonthlyRevenue().then(r => r.data.result),
  });

  const { data: topMovies, isLoading: loadingTopMovies } = useQuery({
    queryKey: ['analytics-top-movies'],
    queryFn: () => analyticsApi.getTopMovies().then(r => r.data.result),
  });

  if (loadingSummary || loadingRevenue || loadingTopMovies) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10">
          <Loader2 className="animate-spin text-amber-500" size={18} />
          Đang tải dữ liệu tổng quan
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 text-slate-400" size={48} />
        <p className="text-lg font-black">Không có dữ liệu</p>
        <p className="mt-2 text-sm cinema-muted">Không thể tải dữ liệu tổng quan từ máy chủ.</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Tổng doanh thu', value: formatMoney(summary.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { label: 'Số vé bán ra', value: summary.totalTickets.toLocaleString('vi-VN'), icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    { label: 'Số suất chiếu', value: summary.totalShowtimes.toLocaleString('vi-VN'), icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    { label: 'Người dùng', value: summary.totalUsers.toLocaleString('vi-VN'), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/20' },
  ];

  return (
    <>
      <Helmet>
        <title>Tổng quan - CinemaBooking</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            <BarChart3 size={14} />
            Tổng quan
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Chào mừng trở lại, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">{user?.firstName || user?.username || 'Admin'}</span>! 👋
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-neutral-400">
            Dưới đây là tổng quan hiệu suất hệ thống CinemaBooking của bạn hôm nay.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-slate-300 dark:bg-neutral-900 dark:ring-white/10 dark:hover:ring-white/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-500">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                    {kpi.value}
                  </p>
                </div>
                <div className={`grid size-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Biểu đồ doanh thu */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-500 hover:shadow-md dark:bg-neutral-900 dark:ring-white/10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-slate-950 text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                  <TrendingUp size={20} />
                </div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Biểu đồ doanh thu</h2>
              </div>
              
              <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-neutral-950">
                <button
                  onClick={() => setPeriod('daily')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${period === 'daily' ? 'bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'}`}
                >
                  30 ngày qua
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${period === 'monthly' ? 'bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'}`}
                >
                  12 tháng qua
                </button>
              </div>
            </div>

            <div className="h-[340px] w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor' }} 
                    className="text-slate-500 dark:text-neutral-400" 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor' }} 
                    className="text-slate-500 dark:text-neutral-400" 
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatMoney(value as number), 'Doanh thu']}
                    labelStyle={{ fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Phim doanh thu cao nhất */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-500 hover:shadow-md dark:bg-neutral-900 dark:ring-white/10">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300">
                <Clapperboard size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Top phim có doanh thu cao nhất</h2>
            </div>
            
            <div className="space-y-2">
              {(topMovies ?? []).map((movie, idx) => (
                <div key={movie.movieId} className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-500 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700 dark:bg-white/5 dark:text-neutral-400 dark:group-hover:bg-amber-400/20 dark:group-hover:text-amber-300">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-950 dark:text-white">{movie.movieTitle}</p>
                    <p className="mt-0.5 text-xs font-semibold cinema-muted">{movie.totalBookings} đơn đặt vé</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-amber-700 dark:text-amber-400">{formatMoney(movie.totalRevenue)}</p>
                  </div>
                </div>
              ))}
              
              {(!topMovies || topMovies.length === 0) && (
                <p className="text-center text-sm cinema-muted">Chưa có dữ liệu</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
