'use client';

import { useEffect, useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type Conversation = {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: string;
  updatedAt?: any;
};

export default function MessagesPage() {
  const { companyId, user } = useUserAccess();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    if (!companyId || !user) return;
    const uid = user.uid;

    let unsubscribe: any;

    const setup = async () => {
      const ref = collection(db, 'companies', companyId, 'conversations');

      const q = query(
        ref,
        where('participants', 'array-contains', uid),
        orderBy('updatedAt', 'desc'),
        limit(50),
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const mine = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];

        setConversations(mine);
      });
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [companyId, user?.uid]);

  const getName = (uid: string) => {
    return userNames[uid] || uid || 'Unknown User';
  };

  useEffect(() => {
    const missingUids = conversations
      .flatMap((conversation) => conversation.participants || [])
      .filter((uid) => uid && uid !== user?.uid && !userNames[uid]);

    Array.from(new Set(missingUids)).forEach(async (uid) => {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return;

      const data = snap.data();
      const name = data.fullName || data.displayName || data.name || data.email || uid;

      setUserNames((prev) => ({ ...prev, [uid]: name }));
    });
  }, [conversations, user?.uid, userNames]);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-2 text-slate-950 dark:text-white">Messages</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Read HR updates and continue employee support conversations.
      </p>

      {conversations.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          No conversations yet.
        </p>
      )}

      <div className="space-y-3">
        {conversations.map((c) => {
          const otherUser = c.participants.find((p) => p !== user.uid);

          const name =
            (otherUser && c.participantNames?.[otherUser]) ||
            getName(otherUser || '');

          return (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/messages/${otherUser}`)}
              className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 cursor-pointer hover:border-[#00ACC1]/40 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-slate-900 dark:text-white">{name}</p>

                {c.updatedAt && (
                  <span className="text-xs text-slate-400">
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

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                {c.lastMessage || 'No messages yet'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}