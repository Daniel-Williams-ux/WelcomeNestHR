'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { AlertCircle, CheckCircle2, EyeIcon, EyeOffIcon } from 'lucide-react';
import { auth, db } from '@/lib/firebase';

type InviteDetails = {
  email: string;
  role: 'hr' | 'employee';
  companyId: string;
  companyName: string;
  expiresAt: string | null;
};

type AcceptInviteResponse = {
  companyId: string;
  employeeId: string | null;
  role: 'hr' | 'employee';
};

function getSignupErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/email-already-in-use') {
      return 'An account already exists for this email. Please sign in instead.';
    }

    if (error.code === 'auth/weak-password') {
      return 'Use a stronger password with at least 8 characters, a number, and a symbol.';
    }

    if (error.code === 'auth/popup-closed-by-user') {
      return 'Google sign-up was closed before it finished.';
    }
  }

  if (error instanceof Error) return error.message;

  return 'Account creation failed. Try again.';
}

async function waitForAuthReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsub = auth.onAuthStateChanged(
      (user) => {
        if (!user) return;
        user
          .getIdToken(true)
          .then(() => {
            unsub();
            resolve();
          })
          .catch((err) => {
            unsub();
            reject(err);
          });
      },
      (err) => reject(err),
    );
  });
}

async function cloneOnboardingTemplate(userId: string) {
  const templateRef = collection(db, 'onboardingTemplates');
  const snapshot = await getDocs(templateRef);

  await Promise.all(
    snapshot.docs.map((docSnap) =>
      setDoc(doc(db, `users/${userId}/onboarding`, docSnap.id), {
        ...docSnap.data(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
    ),
  );

  await setDoc(
    doc(db, 'users', userId),
    { milestonesSeeded: true },
    { merge: true },
  );
}

async function acceptInvitation(token: string, user: User) {
  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/invitations/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to accept invitation.');
  }

  return payload as AcceptInviteResponse;
}

function formatInviteExpiry(expiresAt: string | null) {
  if (!expiresAt) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(expiresAt));
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const resolveInvite = async () => {
      setPageError('');
      setInvite(null);

      if (!token) {
        setPageError('Open the sign up page from the invitation link sent by your company admin.');
        setLoadingInvite(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/invitations/validate?token=${encodeURIComponent(token)}`,
        );
        const payload = await response.json();

        if (!response.ok) {
          setPageError(payload.error || 'This invitation link is not valid.');
          return;
        }

        setInvite(payload as InviteDetails);
      } catch {
        setPageError('We could not validate this invitation. Please try again.');
      } finally {
        setLoadingInvite(false);
      }
    };

    resolveInvite();
  }, [token]);

  const signupSchema = useMemo(
    () =>
      Yup.object().shape({
        fullName: Yup.string().trim().required('Full name is required'),
        email: Yup.string()
          .email('Enter a valid email address')
          .required('Email is required')
          .test(
            'matches-invite',
            `Use the invited email address: ${invite?.email ?? ''}`,
            (value) =>
              !invite ||
              value?.trim().toLowerCase() === invite.email.toLowerCase(),
          ),
        password: Yup.string()
          .min(8, 'Use at least 8 characters')
          .matches(/[A-Z]/, 'Add an uppercase letter')
          .matches(/[a-z]/, 'Add a lowercase letter')
          .matches(/[0-9]/, 'Add a number')
          .matches(/[^a-zA-Z0-9]/, 'Add a symbol')
          .required('Password is required'),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref('password')], 'Passwords must match')
          .required('Confirm your password'),
        acceptedTerms: Yup.boolean().oneOf(
          [true],
          'Accept the terms and privacy policy',
        ),
      }),
    [invite],
  );

  const finishSignup = async (user: User, fullName: string) => {
    if (!invite || !token) {
      throw new Error('This signup must start from a valid invitation link.');
    }

    const acceptedInvite = await acceptInvitation(token, user);

    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email,
        fullName: fullName || user.displayName || '',
        companyId: acceptedInvite.companyId,
        employeeId: acceptedInvite.employeeId,
        role: acceptedInvite.role,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );

    if (acceptedInvite.role === 'hr') {
      await setDoc(
        doc(db, 'customers', user.uid),
        {
          email: user.email,
          name: fullName || user.displayName || '',
          stripeCustomerId: '',
          plan: 'trial',
          companyId: acceptedInvite.companyId,
          role: acceptedInvite.role,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (acceptedInvite.role === 'employee') {
      await cloneOnboardingTemplate(user.uid);
    }

    router.replace(acceptedInvite.role === 'hr' ? '/hr' : '/dashboard');
  };

  const handleGoogleSignup = async () => {
    setFormError('');

    if (!invite) {
      setFormError('Use a valid invitation link to create your account.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: invite.email });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        await signOut(auth);
        setFormError(`This invite was sent to ${invite.email}. Choose that Google account.`);
        return;
      }

      await waitForAuthReady();
      await finishSignup(user, user.displayName || '');
    } catch (err) {
      setFormError(getSignupErrorMessage(err));
    }
  };

  if (loadingInvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={132}
            height={58}
            className="mx-auto mb-5 h-auto w-32"
            priority
          />
          <p className="text-sm font-medium text-slate-600">
            Validating your invitation...
          </p>
        </div>
      </main>
    );
  }

  if (pageError || !invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-[#FB8C00]" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Invitation needed
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{pageError}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-gradient-to-r from-[#FFB300] to-[#FB8C00] px-5 py-2 text-sm font-bold text-white"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  const expiresOn = formatInviteExpiry(invite.expiresAt);

  return (
    <main className="min-h-screen bg-[#FFFDF6] px-4 py-10 text-slate-950 dark:bg-[#121212] dark:text-white sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={190}
            height={84}
            className="h-auto w-40"
            priority
          />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-[#008FA1]">
            Company invitation
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight">
            Join {invite.companyName} on WelcomeNestHR.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
            Create your account with the invited email address and we will link
            you to the right company workspace automatically.
          </p>
          <div className="mt-8 space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
              Invited as {invite.role === 'hr' ? 'HR admin' : 'employee'}
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
              Email locked to {invite.email}
            </p>
            {expiresOn && (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
                Link expires {expiresOn}
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-orange-500/5 dark:border-white/10 dark:bg-[#152226] sm:p-8">
          <div className="mb-6 text-center lg:hidden">
            <Image
              src="/welcomenesthr.png"
              alt="WelcomeNestHR"
              width={140}
              height={62}
              className="mx-auto h-auto w-32"
              priority
            />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#FB8C00]">
            Invitation accepted
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            You are joining <strong>{invite.companyName}</strong> as{' '}
            <strong>{invite.role === 'hr' ? 'HR admin' : 'employee'}</strong>.
          </p>

          <Formik
            enableReinitialize
            initialValues={{
              fullName: '',
              email: invite.email,
              password: '',
              confirmPassword: '',
              acceptedTerms: false,
            }}
            validationSchema={signupSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setFormError('');

              try {
                const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  values.email.trim(),
                  values.password,
                );
                const user = userCredential.user;

                await updateProfile(user, { displayName: values.fullName.trim() });
                await waitForAuthReady();
                await finishSignup(user, values.fullName.trim());
              } catch (err) {
                setFormError(getSignupErrorMessage(err));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Full name
                  </label>
                  <Field
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <ErrorMessage
                    name="fullName"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Invited email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    readOnly
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="w-full rounded-md border border-slate-300 px-4 py-3 pr-11 text-sm text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Use 8+ characters with uppercase, lowercase, a number, and a symbol.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="w-full rounded-md border border-slate-300 px-4 py-3 pr-11 text-sm text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500"
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon size={18} />
                      ) : (
                        <EyeIcon size={18} />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Field
                    id="acceptedTerms"
                    type="checkbox"
                    name="acceptedTerms"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#00ACC1]"
                  />
                  <label htmlFor="acceptedTerms">
                    I agree to the Terms and Privacy Policy.
                  </label>
                </div>
                <ErrorMessage
                  name="acceptedTerms"
                  component="div"
                  className="text-sm text-red-600"
                />

                {formError && (
                  <div
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-md bg-gradient-to-r from-[#FFB300] to-[#FB8C00] px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </button>
              </Form>
            )}
          </Formik>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-medium text-slate-500">
              or continue with
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <Image src="/google-logo.svg" alt="" width={20} height={20} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#00ACC1]">
              Sign in instead
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
          <p className="text-sm font-medium text-slate-600">
            Preparing sign up...
          </p>
        </main>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
