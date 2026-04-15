'use client';

import { useEffect, useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getEmployeesForOrg } from '@/lib/collaborate';

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt?: any;
};

export default function MessagesPage() {
  const { companyId, user } = useUserAccess();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!companyId || !user) return;

    let unsubscribe: any;

    const setup = async () => {
      // 1. Load employees (for names)
      const emps = await getEmployeesForOrg(companyId);
      setEmployees(emps);

      // 2. Real-time conversations
      const ref = collection(db, 'companies', companyId, 'conversations');

      const q = query(ref, orderBy('updatedAt', 'desc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];

        // filter only mine
        const mine = data.filter((c) => c.participants?.includes(user.uid));

        setConversations(mine);
      });
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [companyId, user]);

  const getName = (uid: string) => {
    const found = employees.find((emp) => emp.uid === uid);
    return found?.name || 'Unknown User';
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Messages</h1>

      {conversations.length === 0 && (
        <p className="text-sm text-gray-500">No conversations yet.</p>
      )}

      <div className="space-y-3">
        {conversations.map((c) => {
          const otherUser = c.participants.find((p) => p !== user.uid);

          const name = getName(otherUser || '');

          return (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/messages/${otherUser}`)}
              className="p-4 rounded-xl border bg-white dark:bg-gray-900 cursor-pointer hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{name}</p>

                {c.updatedAt && (
                  <span className="text-xs text-gray-400">
                    {new Date(c.updatedAt.seconds * 1000).toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1 truncate">
                {c.lastMessage || 'No messages yet'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}