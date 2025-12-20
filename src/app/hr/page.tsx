'use client';

export default function HRDashboardPage() {
  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back 👋
        </h1>
        <p className="text-sm text-gray-500">
          Manage employees, payroll, onboarding and compliance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Employees" value="42" subtitle="Active" />
        <DashboardCard
          title="Next Payroll"
          value="Dec 15"
          subtitle="Semi-monthly"
        />
        <DashboardCard
          title="Pending Approvals"
          value="2"
          subtitle="Requires action"
        />
        <DashboardCard
          title="Compliance"
          value="86%"
          subtitle="Training complete"
        />
      </div>

      {/* Employees + Quick Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold mb-4">Recent Employees</h2>

          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Salary</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium">Jane Doe</td>
                  <td className="px-3 py-3">Product Manager</td>
                  <td className="px-3 py-3">$8,500</td>
                  <td className="px-3 py-3 text-green-700">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Payroll actions */}
        <aside className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">Payroll Quick Actions</h3>

          <div className="flex flex-col gap-2">
            <button className="border px-3 py-2 rounded text-sm">
              Preview Payroll
            </button>
            <button className="border px-3 py-2 rounded text-sm">
              Approve Pending
            </button>
            <button className="bg-[#00ACC1] text-white px-3 py-2 rounded text-sm">
              Run Payroll
            </button>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700">Recent Runs</h4>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Nov 15</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                  Pending
                </span>
              </li>
              <li className="flex justify-between">
                <span>Oct 31</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  Completed
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
    </div>
  );
}