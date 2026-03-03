import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';

export async function linkEmployeeToAuth(
  companyId: string,
  email: string,
  uid: string,
) {
  const q = query(
    collection(db, 'companies', companyId, 'employees'),
    where('email', '==', email),
  );

  const snap = await getDocs(q);

  if (snap.empty) return;

  const employeeDoc = snap.docs[0];

  // Only update if uid not already set
  if (!employeeDoc.data().uid) {
    await updateDoc(
      doc(db, 'companies', companyId, 'employees', employeeDoc.id),
      { uid },
    );
  }
}