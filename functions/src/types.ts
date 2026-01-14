import * as admin from 'firebase-admin';

export type Payslip = {
  runId: string;
  companyId: string;
  periodStart: admin.firestore.Timestamp;
  periodEnd: admin.firestore.Timestamp;
  currency: string;
  grossPay: number;
  deductionsTotal: number;
  netPay: number;
  status: 'paid';
  issuedAt: admin.firestore.Timestamp;
};