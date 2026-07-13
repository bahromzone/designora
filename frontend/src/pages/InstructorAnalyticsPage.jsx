import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DollarSign, GraduationCap, Star, TrendingUp } from 'lucide-react';
import { ChartWrapper } from '../components/charts/ChartWrapper';
import { useInstructorAnalytics } from '../hooks/useInstructor';

const summaryItems = [
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'enrollments', label: 'Enrollments', icon: GraduationCap },
  { key: 'completionRate', label: 'Completion', icon: TrendingUp },
  { key: 'averageRating', label: 'Rating', icon: Star },
];

export default function InstructorAnalyticsPage() {
  const { data, isLoading } = useInstructorAnalytics();
  const empty = !data?.revenueSeries?.length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Recharts integration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Instructor analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Revenue, enrollment, va course performance ko‘rinishlari React Query bilan yuklanadi.
        </p>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartWrapper
          title="Revenue trend"
          description="LineChart orqali kunlik revenue va enrollments oqimi"
          loading={isLoading}
          empty={empty}
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} />
                <Line type="monotone" dataKey="enrollments" stroke="#0ea5e9" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        <ChartWrapper
          title="Course performance"
          description="BarChart orqali completion rate va satisfaction ko‘rsatkichlari"
          loading={isLoading}
          empty={!data?.coursePerformance?.length}
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="completionRate" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="satisfaction" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
}
