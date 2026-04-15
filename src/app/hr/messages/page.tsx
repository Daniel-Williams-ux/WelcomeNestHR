'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt?: any;
};

export default function HRMessagesPage() {
  const { companyId, user } = useUserAccess();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!companyId) return;
    if (!user || !user.uid) return;

    const uid = user.uid;

    console.log('FINAL UID USED:', uid);

    const q = collection(db, 'companies', companyId, 'conversations');

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Conversation[] = [];

      snapshot.forEach((doc) => {
        const convo = doc.data() as Conversation;

        console.log('CHECKING:', convo.participants);

        const participants = Object.values(convo.participants || {}).map((p) =>
          String(p).trim(),
        );

        const normalize = (val: any) =>
          String(val).normalize('NFC').replace(/\s+/g, '').trim();

        const cleanUid = normalize(uid);

        const match = participants.some((p) => normalize(p) === cleanUid);
        console.log('UID LENGTH:', cleanUid.length);
        console.log(
          'PARTICIPANTS LENGTHS:',
          participants.map((p) => String(p).length),
        );

        console.log('UID:', uid);
        console.log('PARTICIPANTS (normalized):', participants);
        console.log('MATCH?', match);

        if (match) {
          data.push({
            ...convo,
            participants, // normalized array
            id: doc.id,
          });
        }
      });

      console.log('FINAL DATA:', data);
      setConversations(data);
    });

    return () => unsub();
  }, [companyId, user?.uid]);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Messages</h1>

      {/*  Safe UI condition (no hook break) */}
      {!user || !companyId ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-gray-500">No conversations yet</p>
      ) : (
        conversations.map((convo) => {
          const otherUser = convo.participants.find((p) => p !== user.uid);

          return (
            <div
              key={convo.id}
              onClick={() => router.push(`/hr/messages/${otherUser}`)}
              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <p className="text-sm font-medium break-all">
                {otherUser || 'Unknown user'}
              </p>
              <p className="text-xs text-gray-500">
                {convo.lastMessage || 'No messages yet'}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}