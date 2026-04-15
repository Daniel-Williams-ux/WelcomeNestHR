import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPrimerPlan } from '@/lib/primer';
import { doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
const isDev = process.env.NODE_ENV === 'development';

export async function createEmployee(
  companyId: string,
  name: string,
  email: string,
  role: 'employee' | 'hr' = 'employee', //  NEW
) {
  if (isDev) console.log(' createEmployee called', { companyId, email, role });

  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);

  let uid: string | null = null;

  if (!snap.empty) {
    uid = snap.docs[0].id;
  }

  let employeeId: string | null = null;

  //  ONLY create employee record for employees
  if (role === 'employee') {
    const docRef = await addDoc(
      collection(db, `companies/${companyId}/employees`),
      {
        name,
        email,
        uid: uid || null,
        createdAt: serverTimestamp(),
      },
    );

    employeeId = docRef.id;

    if (isDev) console.log(' Employee created:', employeeId);
  }

  const token = uuidv4();

  await addDoc(collection(db, `companies/${companyId}/invitations`), {
    email,
    role, //  NOW DYNAMIC
    token,
    employeeId: employeeId || null, //  null for HR
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  if (isDev) {
    console.log(`🔗 Invite Link: http://localhost:3000/signup?token=${token}`);
  }

  return token;
}