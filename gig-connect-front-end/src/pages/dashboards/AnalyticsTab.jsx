import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ComposedChart
} from 'recharts';
import { TrendingUp, Briefcase, DollarSign, Star, Award } from 'lucide-react';

/* ── colour palettes ── */
const STATUS_COLORS = {
  applied: '#3b82f6',
  shortlisted: '#f59e0b',
  accepted: '#10b981',
  rejected: '#ef4444',
};
const BAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

/* ── helpers ── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</p>
      <p className="text-xl font-heading font-black text-slate-800 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
    <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
    {subtitle && <p className="text-[11px] text-slate-400 font-medium mt-0.5 mb-4">{subtitle}</p>}
    {/* Key wrapper: w-full + overflow-hidden forces Recharts to measure correctly */}
    <div className="w-full overflow-hidden">
      {children}
    </div>
  </div>
);

const Empty = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-3">
    <Award size={36} className="stroke-[1.2]" />
    <p className="text-xs font-semibold text-slate-400 text-center">{msg}</p>
  </div>
);

/* Custom Pie label rendered inside the chart (no line overflow) */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ── main component ── */
const AnalyticsTab = ({ profile, applications, receivedReviews }) => {

  /* 1. Application funnel — Pie */
  const statusData = useMemo(() => {
    const counts = { applied: 0, shortlisted: 0, accepted: 0, rejected: 0 };
    (applications || []).forEach(a => {
      const s = (a.status || '').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name]
      }))
      .filter(d => d.value > 0);
  }, [applications]);

  /* 2. Earnings over time — ComposedChart Bar + Line */
  const earningsWithCumulative = useMemo(() => {
    const map = {};
    (applications || []).forEach(a => {
      const isCompleted =
        (a.job_status || '').toLowerCase() === 'completed' ||
        (a.status || '').toLowerCase() === 'completed';
      if (!isCompleted) return;
      const d = new Date(a.applied_date || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: label, earnings: 0 };
      map[key].earnings += parseFloat(a.job_payment || 0);
    });
    let running = 0;
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, d]) => { running += d.earnings; return { ...d, cumulative: running }; });
  }, [applications]);

  /* 3. Jobs by category — horizontal Bar */
  const categoryData = useMemo(() => {
    const map = {};
    (applications || []).forEach(a => {
      const isCompleted =
        (a.job_status || '').toLowerCase() === 'completed' ||
        (a.status || '').toLowerCase() === 'completed';
      if (!isCompleted) return;
      const cat = a.job_category || a.category || 'Other';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count], i) => ({ name, count, fill: BAR_COLORS[i % BAR_COLORS.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // cap so chart doesn't get too tall
  }, [applications]);

  /* 4. Rating trend — Line (only if 2+ reviews) */
  const ratingTrend = useMemo(() => {
    if (!receivedReviews || receivedReviews.length < 2) return [];
    let total = 0;
    return [...receivedReviews]
      .reverse()
      .map((r, i) => {
        total += parseFloat(r.score || 0);
        return { review: `#${i + 1}`, avg: parseFloat((total / (i + 1)).toFixed(2)) };
      });
  }, [receivedReviews]);

  /* KPI */
  const apps = applications || [];
  const reviews = receivedReviews || [];
  const completedCount = apps.filter(a =>
    (a.job_status || a.status || '').toLowerCase() === 'completed').length;
  const totalEarned = apps
    .filter(a => (a.job_status || a.status || '').toLowerCase() === 'completed')
    .reduce((s, a) => s + parseFloat(a.job_payment || 0), 0);
  const avgRating = parseFloat(profile?.student_details?.rating || 0);

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800 flex items-center gap-2">
          <TrendingUp size={28} className="text-primary" /> My Analytics
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          A snapshot of your performance across all gigs.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}   label="Total Applications" value={apps.length}
          sub="all time"                  color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp}  label="Jobs Completed"     value={completedCount}
          sub="finished gigs"             color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={DollarSign}  label="Total Earned"
          value={`LKR ${totalEarned.toLocaleString()}`}
          sub="from completed jobs"       color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Star}        label="Avg Rating"
          value={avgRating === 0 ? '—' : avgRating.toFixed(1)}
          sub={avgRating === 0 ? 'No reviews yet' : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
          color="bg-amber-50 text-amber-600" />
      </div>

      {/* Charts: 2-column grid on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ① Application Funnel — Donut */}
        <ChartCard
          title="Application Funnel"
          subtitle="Your applications split by current status"
        >
          {statusData.length === 0
            ? <Empty msg="Apply for jobs to see your funnel" />
            : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v, n]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    formatter={v => (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
        </ChartCard>

        {/* ② Earnings over time — ComposedChart */}
        <ChartCard
          title="Earnings Over Time"
          subtitle="Monthly income & running total (LKR)"
        >
          {earningsWithCumulative.length === 0
            ? <Empty msg="No completed jobs with earnings yet" />
            : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart
                  data={earningsWithCumulative}
                  margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month"
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={55} />
                  <Tooltip
                    formatter={(v, n) => [
                      `LKR ${Number(v).toLocaleString()}`,
                      n === 'earnings' ? 'Monthly' : 'Cumulative'
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                  />
                  <Legend
                    iconSize={8}
                    formatter={v => (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                        {v === 'earnings' ? 'Monthly' : 'Cumulative'}
                      </span>
                    )}
                  />
                  <Bar dataKey="earnings" fill="#6366f1" radius={[6, 6, 0, 0]} name="earnings" />
                  <Line
                    type="monotone" dataKey="cumulative"
                    stroke="#10b981" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    name="cumulative"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
        </ChartCard>

        {/* ③ Jobs by category — Horizontal Bar */}
        <ChartCard
          title="Jobs Completed by Category"
          subtitle="Which skill categories earned you the most gigs"
        >
          {categoryData.length === 0
            ? <Empty msg="Complete jobs to see category breakdown" />
            : (
              <ResponsiveContainer width="100%" height={Math.max(220, categoryData.length * 52)}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={100}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                  <Tooltip
                    formatter={v => [v, 'Jobs']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Jobs">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </ChartCard>

        {/* ④ Rating Trend — Line (2+ reviews only) */}
        <ChartCard
          title="Rating Trend"
          subtitle={
            ratingTrend.length === 0
              ? 'Visible once you receive 2 or more reviews'
              : 'How your average score has evolved'
          }
        >
          {ratingTrend.length === 0
            ? (
              <Empty msg={
                reviews.length === 0
                  ? 'No reviews received yet'
                  : 'Need at least 2 reviews to display trend'
              } />
            )
            : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={ratingTrend}
                  margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="review"
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={v => [`${v} ★`, 'Avg Rating']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                  />
                  <Line
                    type="monotone" dataKey="avg"
                    stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                    name="Avg Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
        </ChartCard>

      </div>

    </div>
  );
};

export default AnalyticsTab;
