import { Payslip } from './types';
import { Buffer } from 'buffer';

export function renderPayslipPdf(payslip: Payslip): Buffer {
  /**
   * Phase 2 – Step 1
   * We generate a simple PDF payload placeholder.
   * Actual HTML → PDF rendering is wired in Step 2.
   */

  const content = `
Payslip

Period: ${payslip.periodStart.toDate().toDateString()} - ${payslip.periodEnd
    .toDate()
    .toDateString()}

Gross Pay: ${payslip.grossPay}
Deductions: ${payslip.deductionsTotal}
Net Pay: ${payslip.netPay}

Status: ${payslip.status}
`;

  return Buffer.from(content);
}