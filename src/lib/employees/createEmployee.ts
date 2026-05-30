import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

type CreateEmployeeMetadata = {
  title?: string;
  department?: string;
  status?: string;
};

export async function createEmployee(
  companyId: string,
  name: string,
  email: string,
  role: 'employee' | 'hr' = 'employee',
  metadata: CreateEmployeeMetadata = {},
) {
  const normalizedEmail = email.trim().toLowerCase();
  const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
  const snap = await getDocs(q);

  let uid: string | null = null;

  if (!snap.empty) {
    uid = snap.docs[0].id;
  }

  let employeeId: string | null = null;
  let created = false;

  //  ONLY create employee record for employees
  if (role === 'employee') {
    const employeesRef = collection(db, `companies/${companyId}/employees`);
    const existingEmployeeSnap = await getDocs(
      query(employeesRef, where('email', '==', normalizedEmail), limit(1)),
    );
    const employeePayload = {
      name,
      email: normalizedEmail,
      title: metadata.title ?? '',
      department: metadata.department ?? '',
      status: metadata.status ?? 'Active',
      uid: uid || null,
      deletedAt: null,
      endDate: metadata.status === 'Exited' ? new Date().toISOString() : null,
    };

    if (existingEmployeeSnap.empty) {
      const docRef = await addDoc(employeesRef, {
        ...employeePayload,
        createdAt: serverTimestamp(),
      });

      employeeId = docRef.id;
      created = true;
    } else {
      const existingEmployee = existingEmployeeSnap.docs[0];

      await updateDoc(existingEmployee.ref, {
        ...employeePayload,
        updatedAt: serverTimestamp(),
      });

      employeeId = existingEmployee.id;
    }
  }

  const token = uuidv4();
  const invitationsRef = collection(db, `companies/${companyId}/invitations`);
  const existingInvitesSnap = await getDocs(
    query(invitationsRef, where('email', '==', normalizedEmail)),
  );

  await Promise.all(
    existingInvitesSnap.docs
      .filter((docSnap) => {
        const invite = docSnap.data();

        return invite.role === role && invite.status === 'pending';
      })
      .map((docSnap) =>
        updateDoc(docSnap.ref, {
          status: 'superseded',
          supersededAt: serverTimestamp(),
        }),
      ),
  );

  await addDoc(invitationsRef, {
    email: normalizedEmail,
    role, //  NOW DYNAMIC
    token,
    employeeId: employeeId || null, //  null for HR
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  return { employeeId, token, created };
}
