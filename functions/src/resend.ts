import { Resend } from 'resend';
import * as functions from 'firebase-functions';

const apiKey = process.env.RESEND_API_KEY || functions.config().resend?.key;

if (!apiKey) {
  console.warn('⚠️ RESEND_API_KEY is not set. Emails will not send.');
}

export const resend = new Resend(apiKey);