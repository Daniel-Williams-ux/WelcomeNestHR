'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';
import { db } from '@/lib/firebase';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getEmployeesForOrg, type CollaborateEmployee } from '@/lib/collaborate';

type Conversation = {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: string;
  updatedAt?: any;
};

export default function HRMessagesPage() {
  const { companyId, user } = useUserAccess();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [employees, setEmployees] = useState<CollaborateEmployee[]>([]);

  useEffect(() => {
    if (!companyId) return;
    if (!user || !user.uid) return;

    const uid = user.uid;

    getEmployeesForOrg(companyId).then(setEmployees).catch((error) => {
      console.error('Failed to load message recipients:', error);
    });

    const q = query(
      collection(db, 'companies', companyId, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc'),
      limit(50),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const convo = doc.data() as Conversation;
        const participants = Object.values(convo.participants || {}).map((p) =>
          String(p).trim(),
        );

        return {
          ...convo,
          participants,
          id: doc.id,
        };
      });

      setConversations(data);
    });

    return () => unsub();
  }, [companyId, user?.uid]);

  const getDisplayName = (uid?: string) => {
    if (!uid) return 'Unknown user';
    return employees.find((employee) => employee.uid === uid)?.name || uid;
  };

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Messages</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Continue HR conversations and start new employee threads.
        </p>
      </div>

      {/*  Safe UI condition (no hook break) */}
      {!user || !companyId ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      ) : conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          No conversations yet.
        </p>
      ) : (
        conversations.map((convo) => {
          const otherUser = convo.participants.find((p) => p !== user.uid);
          const otherName =
            (otherUser && convo.participantNames?.[otherUser]) ||
            getDisplayName(otherUser);

          return (
            <button
              type="button"
              key={convo.id}
              onClick={() => router.push(`/hr/messages/${otherUser}`)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#00ACC1]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-[#00ACC1]/50"
            >
              <p className="text-sm font-semibold break-all text-slate-900 dark:text-white">{otherName}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {convo.lastMessage || 'No messages yet'}
              </p>
            </button>
          );
        })
      )}

      {user && companyId && (
        <section className="pt-4">
          <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Start a conversation
          </h2>
          <div className="space-y-2">
            {employees
              .filter((employee) => employee.uid)
              .map((employee) => (
                <button
                  type="button"
                  key={employee.id}
                  onClick={() => router.push(`/hr/messages/${employee.uid}`)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-800 shadow-sm transition hover:border-[#00ACC1]/40 hover:bg-cyan-50/40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-[#00ACC1]/50 dark:hover:bg-slate-900"
                >
                  {employee.name || employee.email || employee.uid}
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}