'use client';

export default function StatCard({
  title,
  value,
  delta,
  icon,
}: {
  title: string;
  value: string | number;
  delta?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        {icon && <div className="text-[#FFB300]">{icon}</div>}
      </div>
      {delta && (
        <p className="text-xs mt-2 text-green-600 dark:text-green-400 font-medium">
          {delta} this month
        </p>
      )}
    </div>
  );
}