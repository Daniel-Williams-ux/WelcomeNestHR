'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Briefcase, Activity } from 'lucide-react';

interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  companies: number;
  employees: number;
}

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    companies: 0,
    employees: 0,
  });

  useEffect(() => {
    async function loadUsage() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const companiesSnap = await getDocs(collection(db, 'companies'));

        let active = 0;
        let suspended = 0;

        usersSnap.forEach((doc) => {
          const status = doc.data().status ?? 'active';
          if (status === 'suspended') suspended++;
          else active++;
        });

        let employeeCount = 0;
        for (const company of companiesSnap.docs) {
          const empSnap = await getDocs(
            collection(db, 'companies', company.id, 'employees')
          );
          employeeCount += empSnap.size;
        }

        setStats({
          totalUsers: usersSnap.size,
          activeUsers: active,
          suspendedUsers: suspended,
          companies: companiesSnap.size,
          employees: employeeCount,
        });
      } catch (err) {
        console.error('Usage stats error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
  }, []);

  return (
    <main className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Platform Usage</h1>
        <p className="text-sm text-gray-500">
          High-level system usage and adoption metrics
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          aria-label="Usage metrics"
        >
          <MetricCard
            label="Total Users"
            value={stats.totalUsers}
            icon={<Users size={20} />}
          />
          <MetricCard
            label="Active Users"
            value={stats.activeUsers}
            icon={<Activity size={20} />}
          />
          <MetricCard
            label="Companies"
            value={stats.companies}
            icon={<Building2 size={20} />}
          />
          <MetricCard
            label="Employees"
            value={stats.employees}
            icon={<Briefcase size={20} />}
          />
        </section>
      )}

      {!loading && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                User Status
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.activeUsers}
                  </p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.suspendedUsers}
                  </p>
                  <p className="text-sm text-gray-500">Suspended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                Adoption Insight
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                This overview helps Superadmins understand overall platform
                adoption, growth trends, and system health at a glance.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100 text-gray-700" aria-hidden>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}