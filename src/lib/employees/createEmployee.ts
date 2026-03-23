import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function createEmployee(
  companyId: string,
  name: string,
  email: string,
) {
  // 🔍 Find user by email
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('User not found');

  const userId = snap.docs[0].id;

  //  CREATE EMPLOYEE
  const docRef = await addDoc(
    collection(db, `companies/${companyId}/employees`),
    {
      name,
      email,
      userId,
      createdAt: serverTimestamp(), //  FIXED
    },
  );

  const newEmployeeId = docRef.id;

  // 🔍 GET ALL COMPLIANCE MODULES
  const modulesSnapshot = await getDocs(
    collection(db, `companies/${companyId}/complianceModules`),
  );

  // ✅ AUTO-ASSIGN (SAFE LOOP — NO PROMISE.ALL)
  for (const moduleDoc of modulesSnapshot.docs) {
    try {
      await addDoc(
        collection(db, `companies/${companyId}/complianceAssignments`),
        {
          moduleId: moduleDoc.id,
          employeeId: newEmployeeId,
          status: 'pending',
          createdAt: serverTimestamp(), // FIXED
        },
      );
    } catch (err) {
      console.error('Failed to assign module:', moduleDoc.id, err);
    }
  }

  return newEmployeeId;
}