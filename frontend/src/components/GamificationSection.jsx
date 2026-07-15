import { Award, Flame, Sparkles, Trophy } from 'lucide-react';
import { useGamificationQuery } from '../hooks/useGamification';

const statCards = [
  {
    key: 'level',
    label: 'Level',
    icon: Trophy,
    formatValue: (value) => value,
  },
  {
    key: 'streakDays',
    label: 'Streak',
    icon: Flame,
    formatValue: (value) => `${value} days`,
  },
];

export default function GamificationSection() {
  const { data, isLoading } = useGamificationQuery();

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Gamification progress yuklanmoqda...</p>
      </section>
    );
  }

  const progressPercentage = data?.nextLevelXp
    ? Math.min(Math.round((data.currentXp / data.nextLevelXp) * 100), 100)
    : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-indigo-500">Gamification</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Momentum panel</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            XP, streak, badge va quest progress bitta query orqali yig‘ildi.
          </p>
        </div>
        <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-500">Current XP</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-700">{data?.currentXp ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, formatValue }) => (
          <div key={key} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-3 text-xl font-semibold text-slate-900">
              {formatValue(data?.[key] ?? 0)}
            </p>
          </div>
        ))}

        <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Next level progress</p>
            <span className="text-sm font-medium text-slate-700">{progressPercentage}%</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {data?.currentXp ?? 0} / {data?.nextLevelXp ?? 0} XP
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900">Active quests</h3>
          </div>
          <div className="mt-4 space-y-4">
            {(data?.quests ?? []).map((quest) => {
              const percentage = Math.min(Math.round((quest.progress / quest.total) * 100), 100);
              return (
                <div key={quest.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{quest.title}</span>
                    <span className="text-slate-500">{quest.progress}/{quest.total}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-indigo-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900">Badges</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(data?.badges ?? []).map((badge) => (
              <div
                key={badge.id}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  badge.unlocked
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <p className="font-semibold">{badge.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em]">
                  {badge.unlocked ? 'Unlocked' : 'Locked'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
