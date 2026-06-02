export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
        <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
      </div>
    </div>
  );
}
