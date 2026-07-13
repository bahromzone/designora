import { BarChart3, LoaderCircle } from 'lucide-react';

export function ChartWrapper({ title, description, loading, empty, children, aside }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>

      {loading ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <p className="text-sm">Ma’lumotlar yuklanmoqda...</p>
        </div>
      ) : empty ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
          <BarChart3 className="h-5 w-5" />
          <p className="text-sm">Grafik uchun ma’lumot topilmadi.</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
