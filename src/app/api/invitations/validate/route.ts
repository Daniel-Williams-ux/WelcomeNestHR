import { app } from '@/lib/firebase-admin';
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

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')?.trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required.' },
        { status: 400 },
      );
    }

    const inviteSnap = await db
      .collectionGroup('invitations')
      .where('token', '==', token)
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
    const companyRef = inviteDoc.ref.parent.parent;
    const companySnap = companyRef ? await companyRef.get() : null;

    if (!companyRef || !companySnap?.exists) {
      return NextResponse.json(
        { error: 'This invitation is not connected to a valid company.' },
        { status: 404 },
      );
    }

    if (invite.status !== 'pending' || isExpired(invite.expiresAt)) {
      return NextResponse.json(
        { error: 'This invitation has expired or already been used.' },
        { status: 410 },
      );
    }

    const company = companySnap.data() ?? {};

    return NextResponse.json({
      email: invite.email ?? '',
      role: invite.role ?? 'employee',
      companyId: companyRef.id,
      companyName: company.name ?? 'your company',
      expiresAt: toDate(invite.expiresAt)?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Invitation validation failed:', error);

    return NextResponse.json(
      { error: 'We could not validate this invitation. Please try again.' },
      { status: 500 },
    );
  }
}
