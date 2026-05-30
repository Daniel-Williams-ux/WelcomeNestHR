import { app, auth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

const db = getFirestore(app);

function toDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate() as Date;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return null;
}

function isExpired(expiresAt: unknown) {
  if (!expiresAt) return false;
  const expiry = toDate(expiresAt);

  return expiry ? expiry.getTime() < Date.now() : false;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!idToken) {
    return NextResponse.json(
      { error: 'You must be signed in to accept this invitation.' },
      { status: 401 },
    );
  }

  const { token } = (await request.json()) as { token?: string };

  if (!token?.trim()) {
    return NextResponse.json(
      { error: 'Invitation token is required.' },
      { status: 400 },
    );
  }

  const decoded = await auth.verifyIdToken(idToken);
  const userEmail = decoded.email?.toLowerCase();

  if (!userEmail) {
    return NextResponse.json(
      { error: 'Your account must have an email address.' },
      { status: 400 },
    );
  }

  const inviteSnap = await db
    .collectionGroup('invitations')
    .where('token', '==', token.trim())
    .limit(1)
    .get();

  if (inviteSnap.empty) {
    return NextResponse.json(
      { error: 'This invitation link is invalid.' },
      { status: 404 },
    );
  }

  const inviteDoc = inviteSnap.docs[0];
  const invite = inviteDoc.data();
  const inviteEmail = String(invite.email ?? '').toLowerCase();
  const companyRef = inviteDoc.ref.parent.parent;

  if (!companyRef) {
    return NextResponse.json(
      { error: 'This invitation is not connected to a company.' },
      { status: 404 },
    );
  }

  if (invite.status !== 'pending' || isExpired(invite.expiresAt)) {
    return NextResponse.json(
      { error: 'This invitation has expired or already been used.' },
      { status: 410 },
    );
  }

  if (inviteEmail !== userEmail) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email}. Sign up with that email.` },
      { status: 403 },
    );
  }

  const role = invite.role === 'hr' ? 'hr' : 'employee';
  const employeeId = role === 'employee' ? invite.employeeId ?? null : null;
  const batch = db.batch();

  batch.update(inviteDoc.ref, {
    status: 'accepted',
    acceptedAt: new Date(),
    acceptedBy: decoded.uid,
    acceptedEmail: decoded.email,
  });

  batch.set(
    db.collection('users').doc(decoded.uid),
    {
      uid: decoded.uid,
      email: decoded.email,
      companyId: companyRef.id,
      employeeId,
      role,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  if (role === 'employee' && employeeId) {
    batch.set(
      companyRef.collection('employees').doc(employeeId),
      {
        uid: decoded.uid,
        email: decoded.email,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  return NextResponse.json({
    companyId: companyRef.id,
    employeeId,
    role,
  });
}
