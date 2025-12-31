// src/lib/payroll.ts

import {
  Timestamp,
  doc,
  setDoc,
  runTransaction,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  PayrollRun,
  PayrollRunStatus,
  EmployeePayrollItem,
  PayrollFrequency,
} from '@/types/payroll';

/* ----------------------------------------
   INTERNAL HELPERS
----------------------------------------- */

function assertStatus(current: PayrollRunStatus, expected: PayrollRunStatus) {
  if (current !== expected) {
    throw new Error(
      `Invalid payroll state transition. Expected "${expected}", got "${current}".`
    );
  }
}

/* ----------------------------------------
   CREATE PAYROLL RUN (DRAFT)
----------------------------------------- */

export async function createPayrollRun(
  companyId: string,
  runId: string,
  payload: Omit<
    PayrollRun,
    'id' | 'companyId' | 'status' | 'createdAt' | 'approvedAt' | 'paidAt'
  >
) {
  const ref = doc(db, 'companies', companyId, 'payrollRuns', runId);

  await setDoc(ref, {
    ...payload,
    id: runId,
    companyId,
    status: 'draft',
    createdAt: Timestamp.now(),
  });
}

/* ----------------------------------------
   APPROVE PAYROLL RUN (LOCK DATA)
----------------------------------------- */

export async function approvePayrollRun(
  companyId: string,
  runId: string,
  approvedBy: string
) {
  const ref = doc(db, 'companies', companyId, 'payrollRuns', runId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Payroll run not found.');

    const data = snap.data() as PayrollRun;
    assertStatus(data.status, 'draft');

    tx.update(ref, {
      status: 'approved',
      approvedBy,
      approvedAt: Timestamp.now(),
    });
  });
}

/* ----------------------------------------
   MARK PAYROLL AS PAID
----------------------------------------- */

export async function markPayrollPaid(
  companyId: string,
  runId: string,
  paidBy: string
) {
  const ref = doc(db, 'companies', companyId, 'payrollRuns', runId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Payroll run not found.');

    const data = snap.data() as PayrollRun;
    assertStatus(data.status, 'approved');

    tx.update(ref, {
      status: 'paid',
      paidBy,
      paidAt: Timestamp.now(),
    });
  });
}

/* ----------------------------------------
   CREATE EMPLOYEE PAYROLL ITEM
----------------------------------------- */

export async function createEmployeePayrollItem(
  companyId: string,
  employeeId: string,
  runId: string,
  item: EmployeePayrollItem
) {
  const ref = doc(
    db,
    'companies',
    companyId,
    'employees',
    employeeId,
    'payrollItems',
    runId
  );

  await setDoc(ref, {
    ...item,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
}

/* ----------------------------------------
   SNAPSHOT EMPLOYEES INTO PAYROLL RUN
----------------------------------------- */

export async function snapshotPayrollRunEmployees(
  companyId: string,
  runId: string,
  frequency: PayrollFrequency
) {
  const employeesRef = collection(db, 'companies', companyId, 'employees');
  const snapshot = await getDocs(employeesRef);

  let totalGross = 0;
  let totalNet = 0;

  for (const docSnap of snapshot.docs) {
    const emp = docSnap.data();

    // Skip employees without active compensation
    if (
      !emp.salary ||
      !emp.payFrequency ||
      emp.payFrequency !== frequency ||
      emp.status !== 'active'
    ) {
      continue;
    }

    const grossPay = emp.salary;
    const deductions = 0; // placeholder for taxes/benefits later
    const netPay = grossPay - deductions;

    totalGross += grossPay;
    totalNet += netPay;

    await createEmployeePayrollItem(companyId, docSnap.id, runId, {
      employeeId: docSnap.id,
      employeeName: emp.name,
      baseSalary: emp.salary,
      payFrequency: emp.payFrequency,
      grossPay,
      deductions,
      netPay,
    });
  }

  // Persist totals on payroll run
  const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
  await setDoc(
    runRef,
    {
      totalGross,
      totalNet,
    },
    { merge: true }
  );
}