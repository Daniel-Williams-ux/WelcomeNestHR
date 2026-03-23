import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// =========================
// 🧩 BUDDY SYSTEM (Task 2.1)
// =========================

// Assign buddy (with constraints enforced)
export async function assignBuddy(
  companyId: string,
  employeeId: string,
  buddyId: string,
  adminId: string,
) {
  // 🔴 Constraint 1: no self assignment
  if (employeeId === buddyId) {
    throw new Error('Employee cannot be their own buddy');
  }

  const ref = collection(db, `companies/${companyId}/buddyAssignments`);

  // 🔍 Find existing active buddy
  const q = query(
    ref,
    where('employeeId', '==', employeeId),
    where('active', '==', true),
  );

  const snap = await getDocs(q);

  // 🔴 Constraint 2: deactivate existing buddy
  const updates = snap.docs.map((d) =>
    updateDoc(doc(db, d.ref.path), { active: false }),
  );

  await Promise.all(updates);

  //  Create new buddy assignment
  await addDoc(ref, {
    employeeId,
    buddyId,
    active: true,
    assignedAt: serverTimestamp(),
    assignedBy: adminId,
  });
}

// Get active buddy for employee
// export async function getEmployeeBuddy(companyId: string, employeeId: string) {
//   const ref = collection(db, `companies/${companyId}/buddyAssignments`);

//   const q = query(
//     ref,
//     where('employeeId', '==', employeeId),
//     where('active', '==', true),
//   );

//   const snap = await getDocs(q);

//   if (snap.empty) return null;

//   const docSnap = snap.docs[0];

//   return {
//     id: docSnap.id,
//     ...docSnap.data(),
//   };
// }

export async function getEmployeeBuddy(companyId: string, employeeId: string) {
  const ref = collection(db, `companies/${companyId}/buddyAssignments`);

  const snap = await getDocs(ref);

  // console.log(
  //   '📦 ALL buddyAssignments:',
  //   snap.docs.map((d) => d.data()),
  // );

  // console.log('🔍 Searching for employeeId:', employeeId);
  console.log(
    'ALL employeeIds:',
    snap.docs.map((d) => d.data().employeeId),
  );

  console.log('CURRENT employeeId:', employeeId);

  const match = snap.docs.find((d) => d.data().employeeId === employeeId);

  if (!match) {
    console.log('❌ NO MATCH FOUND');
    return null;
  }

  console.log('✅ MATCH FOUND:', match.data());

  return {
    id: match.id,
    ...match.data(),
  };
}

// ================================
//  ANNOUNCEMENTS 
// ================================

// Create announcement
export async function createAnnouncement(
  companyId: string,
  data: {
    title: string;
    message: string;
    createdBy: string;
  },
) {
  // 🔴 Constraint: required fields
  if (!data.title || !data.message) {
    throw new Error('Title and message are required');
  }

  const ref = collection(db, `companies/${companyId}/announcements`);

  await addDoc(ref, {
    title: data.title,
    message: data.message,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  });
}

// Get announcements (paginated)
export async function getAnnouncements(
  companyId: string,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
) {
  const ref = collection(db, `companies/${companyId}/announcements`);

  let q = query(ref, orderBy('createdAt', 'desc'), limit(20));

  //  Pagination support
  if (lastDoc) {
    q = query(
      ref,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(20),
    );
  }

  const snap = await getDocs(q);

  const announcements = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return {
    announcements,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  };
}


// ================================
//  ORG DATA
// ================================

// Get employees for org (flat list)
export async function getEmployeesForOrg(companyId: string) {
  const ref = collection(db, `companies/${companyId}/employees`);

  const snap = await getDocs(ref);

  const employees = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return employees;
}