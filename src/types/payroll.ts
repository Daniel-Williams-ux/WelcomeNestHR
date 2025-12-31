// src/types/payroll.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Supported payroll frequencies.
 * This MUST remain explicit — never infer from dates.
 */
export type PayrollFrequency = 'weekly' | 'biweekly' | 'monthly';

/**
 * Payroll run lifecycle.
 * Once approved, data is immutable.
 */
export type PayrollRunStatus = 'draft' | 'approved' | 'paid';

/**
 * Company-level payroll configuration.
 * Stored once and referenced when creating runs.
 */
export interface CompanyPayrollSettings {
  frequency: PayrollFrequency;

  /**
   * ISO weekday (1 = Monday, 7 = Sunday)
   * Used for weekly / biweekly payrolls.
   */
  payrollWeekday?: number;

  /**
   * Day of month for monthly payroll (1–28 recommended).
   */
  payrollDayOfMonth?: number;

  currency: 'USD' | 'NGN' | 'GBP';

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Represents ONE payroll cycle for a company.
 * This is the core payroll document.
 */
export interface PayrollRun {
  id: string;
  companyId: string;

  frequency: PayrollFrequency;

  periodStart: Timestamp;
  periodEnd: Timestamp;

  status: PayrollRunStatus;

  totalEmployees: number;
  grossTotal: number;
  deductionsTotal: number;
  netTotal: number;

  createdBy: string; // HR userId
  approvedBy?: string;
  paidBy?: string;

  createdAt: Timestamp;
  approvedAt?: Timestamp;
  paidAt?: Timestamp;
}

/**
 * Allowance or deduction line item.
 */
export interface PayrollAdjustment {
  label: string;
  amount: number;
}

/**
 * Immutable snapshot of an employee's payroll for a run.
 */
export interface EmployeePayrollItem {
  runId: string;
  employeeId: string;

  baseSalary: number;

  allowances?: PayrollAdjustment[];
  deductions?: PayrollAdjustment[];

  grossPay: number;
  netPay: number;

  status: 'pending' | 'paid';

  createdAt: Timestamp;
}

/**
 * Employee-facing payslip.
 * Read-only view derived from payroll items.
 */
export interface Payslip {
  runId: string;
  companyId: string;

  periodStart: Timestamp;
  periodEnd: Timestamp;

  currency: string;

  grossPay: number;
  deductionsTotal: number;
  netPay: number;

  status: 'paid';

  issuedAt: Timestamp;
}