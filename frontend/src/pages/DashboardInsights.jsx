import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartWrapper } from '../components/charts/ChartWrapper';
import { useDashboardInsights } from '../hooks/useLearning';

export default function DashboardInsights() {
  const { data, isLoading } = useDashboardInsights();

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Composed insights</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard insights</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Impressions, clicks, va conversions bitta ComposedChart ichida jamlandi.
        </p>
      </div>

      <ChartWrapper
        title="Acquisition overview"
        description="Bir xil panelda campaign reach va conversion signalari"
        loading={isLoading}
        empty={!data?.length}
      >
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#c7d2fe" radius={[8, 8, 0, 0]} />
              <Bar dataKey="clicks" fill="#7dd3fc" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="conversions" stroke="#22c55e" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    </div>
  );
}
