import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CircleDollarSign, Percent, Users } from 'lucide-react';
import { ChartWrapper } from '../components/charts/ChartWrapper';
import { useAdminDashboard } from '../hooks/useAdmin';

const summaryItems = [
  { key: 'monthlyRevenue', label: 'Monthly revenue', icon: CircleDollarSign },
  { key: 'conversionRate', label: 'Conversion', icon: Percent },
  { key: 'activeUsers', label: 'Active users', icon: Users },
  { key: 'churn', label: 'Churn', icon: Activity },
];

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#22c55e'];

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Admin dashboards</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Platform performance</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{data?.summary?.[key] ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartWrapper
          title="Revenue and active users"
          description="AreaChart bilan growth va usage signalari"
          loading={isLoading}
          empty={!data?.growthSeries?.length}
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.growthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="#c7d2fe" />
                <Area type="monotone" dataKey="activeUsers" stroke="#0ea5e9" fill="#bae6fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        <ChartWrapper
          title="User mix"
          description="PieChart orqali platforma segmentlari"
          loading={isLoading}
          empty={!data?.userDistribution?.length}
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.userDistribution} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4}>
                  {(data?.userDistribution ?? []).map((item, index) => (
                    <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
}
