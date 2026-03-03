import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

admin.initializeApp();
const db = admin.firestore();

/* ----------------------------------------
   STRIPE CONFIG (GEN-2 SAFE)
----------------------------------------- */

const stripeSecret =
  process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY || '';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

function getStripe() {
  if (!stripeSecret) {
    throw new Error('Stripe secret is not configured');
  }

  return new Stripe(stripeSecret, {
    apiVersion: '2025-06-30.basil' as any,
  });
}

/* ----------------------------------------
   DEFAULT ONBOARDING TASKS
----------------------------------------- */

const DEFAULT_ORG_TASKS = [
  {
    title: 'Set up work tools',
    description: 'Get access to Slack, email and workspace tools.',
    autoComplete: false,
    trigger: null,
  },
  {
    title: 'Read the company handbook',
    description: 'Review policies, code of conduct and benefits.',
    autoComplete: false,
    trigger: null,
  },
  {
    title: 'Meet your onboarding buddy',
    description: 'Get introduced to your assigned buddy.',
    autoComplete: true,
    trigger: 'buddyAssigned',
  },
  {
    title: 'Schedule your 30-day check-in',
    description: 'Book your first feedback meeting with your manager.',
    autoComplete: false,
    trigger: null,
  },
  {
    title: 'Complete your profile',
    description: 'Fill in your name, role, and contact details.',
    autoComplete: true,
    trigger: 'profileCompleted',
  },
];

/* ----------------------------------------
   ORG CREATION → SEED TASKS
----------------------------------------- */

export const seedOnboardingTasksForOrg = onDocumentCreated(
  'organizations/{orgId}',
  async (event) => {
    const orgId = event.params.orgId;

    const tasksRef = db
      .collection('organizations')
      .doc(orgId)
      .collection('onboardingTasks');

    const batch = db.batch();

    for (const task of DEFAULT_ORG_TASKS) {
      batch.set(tasksRef.doc(), {
        ...task,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    logger.info(`Seeded onboarding tasks for org ${orgId}`);
  }
);

/* ----------------------------------------
   USER CREATION → CLONE TASKS
----------------------------------------- */

export const cloneOrgTasksToUser = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userData = event.data?.data();
    const orgId = userData?.orgId;
    const userId = event.params.userId;

    if (!orgId) {
      logger.warn(`User ${userId} has no orgId`);
      return;
    }

    const orgTasksSnap = await db
      .collection('organizations')
      .doc(orgId)
      .collection('onboardingTasks')
      .get();

    if (orgTasksSnap.empty) return;

    const batch = db.batch();

    orgTasksSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const ref = db
        .collection('users')
        .doc(userId)
        .collection('onboarding')
        .doc();

      batch.set(ref, {
        title: data.title || 'Untitled task',
        description: data.description || '',
        completed: !!data.autoComplete,
        trigger: data.trigger || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        order: data.order ?? null,
      });
    });

    await batch.commit();
    logger.info(`Cloned onboarding tasks for user ${userId}`);
  }
);

/* ----------------------------------------
   LINK EMPLOYEE RECORD TO AUTH UID
----------------------------------------- */

export const linkEmployeeToCompanyRecord = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) return;

    const { role, companyId, email } = userData;

    if (role !== 'employee' || !companyId || !email) {
      return;
    }

    try {
      const employeesSnap = await db
        .collection('companies')
        .doc(companyId)
        .collection('employees')
        .where('email', '==', email.toLowerCase())
        .get();

      if (employeesSnap.empty) {
        logger.warn(
          `No matching employee found for ${email} in company ${companyId}`
        );
        return;
      }

      const employeeDoc = employeesSnap.docs[0];

      await employeeDoc.ref.update({
        uid: userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(
        `Linked employee ${employeeDoc.id} to auth user ${userId}`
      );
    } catch (error) {
      logger.error('Error linking employee to company record', error);
    }
  }
);

/* ----------------------------------------
   STRIPE WEBHOOK (GEN-2)
----------------------------------------- */

const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/handleStripeWebhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;

  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  if (!stripeWebhookSecret) {
    res.status(500).send('Stripe webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      stripeWebhookSecret
    );
  } catch (err) {
    logger.error('Webhook verification failed', err);
    res.status(400).send('Webhook verification failed');
    return;
  }

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;
      const subscriptionStatus = subscription.status;
      const priceId = subscription.items?.data?.[0]?.price?.id;

      let plan = 'free';
      if (priceId === 'price_1RhCvxD1HsOrcNPUUDdvsuV9') {
        plan = 'platinum';
      }

      const finalPlan = subscriptionStatus === 'active' ? plan : 'free';

      const q = await db
        .collection('customers')
        .where('stripeCustomerId', '==', stripeCustomerId)
        .get();

      if (!q.empty) {
        await q.docs[0].ref.update({ plan: finalPlan });
        logger.info(`Updated plan for ${q.docs[0].id}`);
      }
    }
  } catch (err) {
    logger.error('Error processing Stripe event', err);
  }

  res.json({ received: true });
});

export const handleStripeWebhook = onRequest(app);