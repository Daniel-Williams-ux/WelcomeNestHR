'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type AuditLog = {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  targetUserEmail: string;
  oldStatus?: string;
  newStatus?: string;
  oldRole?: string;
  newRole?: string;
  createdAt?: any;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);

      const q = query(
        collection(db, 'auditLogs'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snap = await getDocs(q);

      setLogs(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );

      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter((log) =>
    search
      ? log.actorEmail?.toLowerCase().includes(search.toLowerCase()) ||
        log.targetUserEmail?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const exportCSV = () => {
    const csv = [
      ['Action', 'Actor', 'Target', 'Old', 'New', 'Date'],
      ...filtered.map((l) => [
        l.action,
        l.actorEmail,
        l.targetUserEmail,
        l.oldStatus || l.oldRole || '',
        l.newStatus || l.newRole || '',
        l.createdAt?.seconds
          ? new Date(l.createdAt.seconds * 1000).toISOString()
          : '',
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'audit-logs.csv';
    a.click();
  };

  return (
    <main className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search by actor, target, or action…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No audit logs found.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left">Action</th>
                      <th className="px-6 py-3 text-left">Actor</th>
                      <th className="px-6 py-3 text-left">Target</th>
                      <th className="px-6 py-3 text-left">Change</th>
                      <th className="px-6 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="px-6 py-3 font-medium">{log.action}</td>
                        <td className="px-6 py-3">{log.actorEmail}</td>
                        <td className="px-6 py-3">{log.targetUserEmail}</td>
                        <td className="px-6 py-3 text-xs">
                          {log.oldStatus || log.oldRole} →{' '}
                          {log.newStatus || log.newRole}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {log.createdAt?.seconds
                            ? new Date(
                                log.createdAt.seconds * 1000
                              ).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y">
                {filtered.map((log) => (
                  <div key={log.id} className="p-4 text-sm">
                    <div className="font-semibold">{log.action}</div>
                    <div>Actor: {log.actorEmail}</div>
                    <div>Target: {log.targetUserEmail}</div>
                    <div className="text-xs mt-1">
                      {log.oldStatus || log.oldRole} →{' '}
                      {log.newStatus || log.newRole}
                    </div>
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