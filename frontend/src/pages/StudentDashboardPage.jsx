import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts';
import { Award, Flame, Timer, TrendingUp } from 'lucide-react';
import { ChartWrapper } from '../components/charts/ChartWrapper';
import { useStudentDashboard } from '../hooks/useLearning';

const summaryItems = [
  { key: 'completion', label: 'Completion', suffix: '%', icon: TrendingUp },
  { key: 'streak', label: 'Streak', suffix: ' days', icon: Flame },
  { key: 'certificates', label: 'Certificates', suffix: '', icon: Award },
  { key: 'studyHours', label: 'Study hours', suffix: 'h', icon: Timer },
];

export default function StudentDashboardPage() {
  const { data, isLoading } = useStudentDashboard();

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Student dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Learning progress</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map(({ key, label, suffix, icon: Icon }) => (
          <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {data?.summary?.[key] ?? '—'}
              {suffix}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <ChartWrapper
          title="Progress ring"
          description="RadialBarChart bilan umumiy kurs progress"
          loading={isLoading}
          empty={!data?.radial?.length}
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="45%"
                outerRadius="100%"
                data={data?.radial}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Module completion</h2>
          <div className="mt-5 space-y-4">
            {(data?.modules ?? []).map((moduleItem) => (
              <div key={moduleItem.name}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{moduleItem.name}</span>
                  <span>{moduleItem.progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                    style={{ width: `${moduleItem.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
