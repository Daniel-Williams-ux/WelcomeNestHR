import { app, auth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const db = getFirestore(app);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!idToken) {
    return NextResponse.json(
      { error: 'You must be signed in to create invitations.' },
      { status: 401 },
    );
  }

  const decoded = await auth.verifyIdToken(idToken);
  const actorSnap = await db.collection('users').doc(decoded.uid).get();
  const actor = actorSnap.data();

  if (actor?.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Only superadmins can invite company HR admins.' },
      { status: 403 },
    );
  }

  const { companyId, email, role = 'hr' } = (await request.json()) as {
    companyId?: string;
    email?: string;
    role?: 'hr' | 'employee';
  };

  const cleanEmail = email?.trim().toLowerCase();

  if (!companyId || !cleanEmail) {
    return NextResponse.json(
      { error: 'Company and email are required.' },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json(
      { error: 'Enter a valid email address.' },
      { status: 400 },
    );
  }

  const companyRef = db.collection('companies').doc(companyId);
  const companySnap = await companyRef.get();

  if (!companySnap.exists) {
    return NextResponse.json(
      { error: 'Company not found.' },
      { status: 404 },
    );
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pendingInvitesSnap = await companyRef
    .collection('invitations')
    .where('email', '==', cleanEmail)
    .get();
  const batch = db.batch();

  pendingInvitesSnap.docs.forEach((docSnap) => {
    const invite = docSnap.data();

    if (invite.role === role && invite.status === 'pending') {
      batch.update(docSnap.ref, {
        status: 'superseded',
        supersededAt: new Date(),
      });
    }
  });

  batch.set(companyRef.collection('invitations').doc(), {
    email: cleanEmail,
    role,
    token,
    status: 'pending',
    employeeId: null,
    createdAt: new Date(),
    createdBy: decoded.uid,
    expiresAt,
  });

  await batch.commit();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get('origin') ||
    request.nextUrl.origin;

  return NextResponse.json({
    link: `${baseUrl}/signup?token=${token}`,
    email: cleanEmail,
    role,
    expiresAt: expiresAt.toISOString(),
  });
}
