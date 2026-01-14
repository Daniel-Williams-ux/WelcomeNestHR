import { resend } from './resend';
import { renderPayslipPdf } from './renderPayslipPdf';
import { Payslip } from './types';

type EmailPayload = {
  to: string;
  employeeName: string;
  payslip: Payslip;
};

export async function emailPayslip({
  to,
  employeeName,
  payslip,
}: EmailPayload) {
  if (!to) {
    throw new Error('Missing recipient email');
  }

  const pdfBuffer = renderPayslipPdf(payslip);

  await resend.emails.send({
    from: 'WelcomeNestHR <onboarding@resend.dev>',
    to,
    subject: `Your Payslip`,
    text: `Hello ${employeeName},\n\nYour payslip is attached.`,
    attachments: [
      {
        filename: 'payslip.pdf',
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
}