export default function HRDashboardLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
    </div>
  );
}
