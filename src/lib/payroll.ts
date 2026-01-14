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
  Payslip,
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
   APPROVE PAYROLL RUN
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
   MARK PAYROLL AS PAID + GENERATE PAYSLIPS
----------------------------------------- */

export async function markPayrollPaid(
  companyId: string,
  runId: string,
  paidBy: string
) {
  const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);

  const itemsRef = collection(
    db,
    'companies',
    companyId,
    'payrollRuns',
    runId,
    'items'
  );

  const itemsSnap = await getDocs(itemsRef);

  await runTransaction(db, async (tx) => {
    const runSnap = await tx.get(runRef);
    if (!runSnap.exists()) throw new Error('Payroll run not found.');

    const run = runSnap.data() as PayrollRun;
    assertStatus(run.status, 'approved');

    for (const itemSnap of itemsSnap.docs) {
      const item = itemSnap.data() as EmployeePayrollItem;

      const payslipId = `${runId}_${item.employeeId}`;

      // Canonical payslip (company scope)
      const payslipRef = doc(
        db,
        'companies',
        companyId,
        'payrollRuns',
        runId,
        'payslips',
        item.employeeId
      );

      const payslip: Payslip = {
        runId,
        companyId,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        currency: 'NGN',
        grossPay: item.grossPay,
        deductionsTotal:
          item.deductions?.reduce((sum, d) => sum + d.amount, 0) ?? 0,
        netPay: item.netPay,
        status: 'paid',
        issuedAt: Timestamp.now(),
      };

      tx.set(payslipRef, payslip);

      // 🔹 MIRROR FOR EMPLOYEE (Option A)
      const userPayslipRef = doc(
        db,
        'users',
        item.employeeId,
        'payslips',
        payslipId
      );

      tx.set(userPayslipRef, {
        id: payslipId,
        runId,
        companyId,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        currency: 'NGN',
        grossPay: item.grossPay,
        deductionsTotal:
          item.deductions?.reduce((sum, d) => sum + d.amount, 0) ?? 0,
        netPay: item.netPay,
        status: 'paid',
        issuedAt: Timestamp.now(),
      });
    }

    tx.update(runRef, {
      status: 'paid',
      paidBy,
      paidAt: Timestamp.now(),
    });
  });
}


/* ----------------------------------------
   SNAPSHOT EMPLOYEES INTO PAYROLL RUN ITEMS
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
  let totalEmployees = 0;

  for (const docSnap of snapshot.docs) {
    const emp = docSnap.data();

    if (
      emp.status?.toLowerCase() !== 'active' ||
      typeof emp.salary !== 'number' ||
      emp.payFrequency !== frequency
    ) {
      continue;
    }

    const grossPay = emp.salary;
    const deductions = 0;
    const netPay = grossPay - deductions;

    totalGross += grossPay;
    totalNet += netPay;
    totalEmployees++;

    const itemRef = doc(
      db,
      'companies',
      companyId,
      'payrollRuns',
      runId,
      'items',
      docSnap.id
    );

    await setDoc(itemRef, {
      runId,
      employeeId: docSnap.id,
      employeeName: emp.name,
      baseSalary: emp.salary,
      payFrequency: emp.payFrequency,
      grossPay,
      deductions,
      netPay,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
  }

  const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);

  await setDoc(
    runRef,
    {
      totalEmployees,
      grossTotal: totalGross,
      netTotal: totalNet,
    },
    { merge: true }
  );
}
