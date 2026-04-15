'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { getEmployeesForOrg } from '@/lib/collaborate';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MessagePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { companyId, user } = useUserAccess();

  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  //  conversationId (stable)
  const conversationId =
    user?.uid && userId ? [user.uid, userId].sort().join('_') : null;

  //  fetch buddy name
  useEffect(() => {
    const fetchUser = async () => {
      if (!companyId || !userId) return;

      const employees = await getEmployeesForOrg(companyId);
      const found = employees.find((emp: any) => emp.uid === userId);

      if (found) setUserData(found);
    };

    fetchUser();
  }, [companyId, userId]);

  //  subscribe to messages (real-time)
  useEffect(() => {
    if (!companyId || !conversationId) return;

    const messagesRef = collection(
      db,
      'companies',
      companyId,
      'conversations',
      conversationId,
      'messages',
    );

      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [companyId, conversationId]);

  // 🔥 send message
  const handleSend = async () => {
    if (!input.trim() || !companyId || !conversationId) return;

    const convoRef = doc(
      db,
      'companies',
      companyId,
      'conversations',
      conversationId,
    );

    // ensure conversation exists
    await setDoc(
      convoRef,
      {
        participants: [String(user.uid), String(userId)].sort(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const messagesRef = collection(convoRef, 'messages');

    await addDoc(messagesRef, {
      text: input,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] p-4">
      {/* Header */}
      <div className="border-b pb-3 mb-3">
        <h1 className="text-xl font-semibold">
          {userData?.name || 'Loading...'}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === user?.uid ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl text-sm ${
                msg.senderId === user?.uid
                  ? 'bg-[#00ACC1] text-white'
                  : 'bg-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t pt-3 mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none"
        />

        <button
          onClick={handleSend}
          className="px-4 py-2 bg-[#00ACC1] text-white rounded-lg text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}