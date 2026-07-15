export default function RouteFallback() {
  return (
    <main className="container py-12" aria-busy="true" aria-label="Sahifa yuklanmoqda">
      <div className="skeleton h-8 w-48 mb-6" />
      <div className="skeleton h-4 w-full max-w-2xl mb-3" />
      <div className="skeleton h-4 w-4/5 max-w-xl mb-8" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
      <span className="sr-only">Sahifa yuklanmoqda</span>
    </main>
  );
}
