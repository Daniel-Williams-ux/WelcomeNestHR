'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

type UserStatus = 'active' | 'suspended';
type UserRole = 'employee' | 'hr' | 'superadmin';

export default function UsersPage() {
  const router = useRouter();
  const { user: actor, role: actorRole } = useUserAccess();

  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const PAGE_SIZE = 10;
  const [page] = useState(1);

  // -----------------------
  // LOAD USERS + COMPANIES
  // -----------------------
  useEffect(() => {
    (async () => {
      setLoading(true);

      const usersSnap = await getDocs(collection(db, 'users'));
      const companiesSnap = await getDocs(collection(db, 'companies'));

      const companyMap: Record<string, string> = {};
      companiesSnap.forEach((doc) => {
        companyMap[doc.id] = doc.data().name;
      });

      const userList = usersSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          status: data.status ?? 'active',
          ...data,
          companyName:
            data.companyId && companyMap[data.companyId]
              ? companyMap[data.companyId]
              : '—',
        };
      });

      setUsers(userList);
      setCompanies(
        companiesSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );

      setLoading(false);
    })();
  }, []);

  // -----------------------
  // FILTER + PAGINATION
  // -----------------------
  useEffect(() => {
    let data = [...users];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s)
      );
    }

    if (roleFilter) data = data.filter((u) => u.role === roleFilter);
    if (companyFilter) data = data.filter((u) => u.companyId === companyFilter);

    const start = (page - 1) * PAGE_SIZE;
    setFiltered(data.slice(start, start + PAGE_SIZE));
  }, [users, search, roleFilter, companyFilter, page]);

  // -----------------------
  // STATUS BADGE
  // -----------------------
  const StatusBadge = ({ status }: { status: UserStatus }) => {
    const isActive = status !== 'suspended';

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
          ${
            isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}
      >
        {isActive ? 'Active' : 'Suspended'}
      </span>
    );
  };

  // -----------------------
  // SUSPEND / REACTIVATE + AUDIT
  // -----------------------
  const toggleUserStatus = async (user: any) => {
    if (!actor || actorRole !== 'superadmin') return;

    if (user.role === 'superadmin') {
      alert('Superadmin accounts cannot be suspended.');
      return;
    }

    const newStatus: UserStatus =
      user.status === 'suspended' ? 'active' : 'suspended';

    if (
      !confirm(
        newStatus === 'suspended'
          ? 'Suspend this user? Access will be revoked.'
          : 'Reactivate this user?'
      )
    )
      return;

    await updateDoc(doc(db, 'users', user.id), { status: newStatus });

    await addDoc(collection(db, 'auditLogs'), {
      action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole,
      targetUserId: user.id,
      targetUserEmail: user.email,
      oldStatus: user.status,
      newStatus,
      createdAt: serverTimestamp(),
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
  };

  // -----------------------
  // ROLE CHANGE + AUDIT
  // -----------------------
  const changeRole = async (user: any, newRole: UserRole) => {
    if (!actor || actorRole !== 'superadmin') return;
    if (user.id === actor.uid) {
      alert('You cannot change your own role.');
      return;
    }

    if (!confirm(`Change role to ${newRole}?`)) return;

    await updateDoc(doc(db, 'users', user.id), { role: newRole });

    await addDoc(collection(db, 'auditLogs'), {
      action: 'ROLE_CHANGED',
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole,
      targetUserId: user.id,
      targetUserEmail: user.email,
      oldRole: user.role,
      newRole,
      createdAt: serverTimestamp(),
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
  };

  // -----------------------
  // EXPORT CSV
  // -----------------------
  const exportCSV = (rows: any[]) => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Company', 'Created'],
      ...rows.map((u) => [
        u.fullName ?? '',
        u.email ?? '',
        u.role ?? '',
        u.status ?? 'active',
        u.companyName ?? '',
        u.createdAt?.seconds
          ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
          : '',
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  // -----------------------
  // UI (UNCHANGED STRUCTURE)
  // -----------------------
  return (
    <main className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">User Management</h1>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm w-full">
          <Search size={16} className="text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border rounded-md p-2"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="hr">HR</option>
          <option value="superadmin">Super Admin</option>
        </select>

        <select
          className="border rounded-md p-2"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <Button variant="outline" onClick={() => exportCSV(filtered)}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* DESKTOP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Company</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td
                          className="px-6 py-3 cursor-pointer"
                          onClick={() =>
                            router.push(`/superadmin/users/${u.id}`)
                          }
                        >
                          {u.fullName || '—'}
                        </td>
                        <td className="px-6 py-3">{u.email}</td>
                        <td className="px-6 py-3">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              changeRole(u, e.target.value as UserRole)
                            }
                          >
                            <option value="employee">Employee</option>
                            <option value="hr">HR</option>
                            {u.role === 'superadmin' && (
                              <option value="superadmin">Super Admin</option>
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-3">{u.companyName}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserStatus(u)}
                          >
                            {u.status === 'suspended'
                              ? 'Reactivate'
                              : 'Suspend'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE (UNCHANGED) */}
              <div className="md:hidden divide-y">
                {filtered.map((u) => (
                  <div key={u.id} className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{u.fullName || '—'}</div>
                        <div className="text-sm text-gray-600">{u.email}</div>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => toggleUserStatus(u)}
                    >
                      {u.status === 'suspended'
                        ? 'Reactivate User'
                        : 'Suspend User'}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}