import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * ✅ Automatically assign `superadmin` to the very first registered user.
 */
export const assignFirstSuperadmin = functions.auth
  .user()
  .onCreate(async (user) => {
    const list = await admin.auth().listUsers(2); // fetch first two users

    // If this is the very first user, make them superadmin
    if (list.users.length === 1 && list.users[0].uid === user.uid) {
      await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });
      console.log(`✅ ${user.email} is now SUPERADMIN (first user)`);
    } else {
      console.log(
        `User ${user.email} created (no superadmin assigned automatically)`
      );
    }
  });

/**
 * ✅ Secure function to add another superadmin manually
 * Only existing superadmins can use it.
 */
export const addSuperadmin = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.superadmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only superadmins can grant superadmin access.'
    );
  }

  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email is required.'
    );
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });

    return { message: `✅ ${email} has been granted superadmin privileges.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Error granting superadmin:', message);
    throw new functions.https.HttpsError('internal', message);
  }
});