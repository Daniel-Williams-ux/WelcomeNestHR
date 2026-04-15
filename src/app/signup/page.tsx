'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { query, where } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';
import { collectionGroup } from 'firebase/firestore';

setLogLevel('debug');

/** Wait until Firebase Auth is fully ready */
async function waitForAuthReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsub = auth.onAuthStateChanged(
      (u) => {
        if (!u) return;
        u.getIdToken(true)
          .then(() => {
            unsub();
            resolve();
          })
          .catch((err) => {
            unsub();
            reject(err);
          });
      },
      (err) => reject(err)
    );
  });
}

/** Clone onboarding tasks */
async function cloneOnboardingTemplate(userId: string) {
  const templateRef = collection(db, 'onboardingTemplates');
  const snapshot = await getDocs(templateRef);

  const promises = snapshot.docs.map((docSnap) =>
    setDoc(doc(db, `users/${userId}/onboarding`, docSnap.id), {
      ...docSnap.data(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  );

  await Promise.all(promises);

  await setDoc(
    doc(db, 'users', userId),
    { milestonesSeeded: true },
    { merge: true }
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /** --- INVITE PARAMETERS --- */
  const token = searchParams.get('token');

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteDocRef, setInviteDocRef] = useState<any>(null);

  useEffect(() => {
    const resolveInvite = async () => {
      try {
        console.log('🔍 Token from URL:', token);

        if (!token) {
          setLoadingInvite(false);
          return;
        }

        //  DIRECT query (SSOT-compliant)
        const inviteQuery = query(
          collectionGroup(db, 'invitations'),
          where('token', '==', token),
        );

        const inviteSnap = await getDocs(inviteQuery);

        if (inviteSnap.empty) {
          setFirebaseError('Invalid invitation link');
          setLoadingInvite(false);
          return;
        }

        const inviteDoc = inviteSnap.docs[0];
        const foundInvite = inviteDoc.data();
        const foundInviteRef = inviteDoc.ref;

        // VERY IMPORTANT: extract companyId from path
        const foundCompanyId = inviteDoc.ref.parent.parent?.id;

        //  set values (same as before)
        setInviteDocRef(foundInviteRef);
        setInviteEmployeeId(foundInvite.employeeId || null);

        const now = Date.now();
        const expiresAt =
          foundInvite.expiresAt?.toMillis?.() ??
          new Date(foundInvite.expiresAt).getTime();

        if (foundInvite.status !== 'pending' || now > expiresAt) {
          setFirebaseError('Invitation expired or already used');
          setLoadingInvite(false);
          return;
        }

        setCompanyId(foundCompanyId);
        setInviteRole(foundInvite.role);
        setLoadingInvite(false);

        
      } catch (err) {
        console.error('❌ Invite resolution error:', err);
        setFirebaseError('Something went wrong');
        setLoadingInvite(false);
      }
    };

    resolveInvite();
  }, [token]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');
  const [inviteEmployeeId, setInviteEmployeeId] = useState<string | null>(null);
  

  const togglePasswordVisibility = () => setShowPassword((p) => !p);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((p) => !p);

  
  const getDefaultUserData = (user: any, fullName: string | null = null) => {
    return {
      uid: user.uid,
      email: user.email,
      fullName: fullName || user.displayName || '',
      companyId,
      role: companyId ? inviteRole : 'unassigned',
      createdAt: new Date().toISOString(),
    };
  };

  /** Validate company exists */
  const ensureCompanyExists = async (id: string | null) => {
    if (!id) return false;
    try {
      const compRef = doc(db, 'companies', id);
      const compSnap = await getDoc(compRef);
      return compSnap.exists();
    } catch {
      return false;
    }
  };

  /** Google signup */
  const handleGoogleSignup = async () => {
    setFirebaseError('');

    if (!companyId) {
      setFirebaseError('You must use a company invitation link.');
      return;
    }

    if (!(await ensureCompanyExists(companyId))) {
      setFirebaseError('Invalid company invitation link.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await waitForAuthReady();

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, getDefaultUserData(user, user.displayName));

        await setDoc(doc(db, 'customers', user.uid), {
          email: user.email,
          name: user.displayName || '',
          stripeCustomerId: '',
          plan: 'trial',
          createdAt: serverTimestamp(),
        });

        await cloneOnboardingTemplate(user.uid);

        // Link employee record to auth UID
        if (companyId && inviteRole === 'employee') {
          const employeesRef = collection(
            db,
            'companies',
            companyId,
            'employees',
          );
          const snapshot = await getDocs(employeesRef);

          const matching = snapshot.docs.find(
            (d) => d.data().email?.toLowerCase() === user.email?.toLowerCase(),
          );

          if (matching) {
            await setDoc(
              doc(db, 'companies', companyId, 'employees', matching.id),
              { uid: user.uid },
              { merge: true },
            );
          }
        }
      }

      await new Promise((res) => setTimeout(res, 500));
      router.push('/route-router');
    } catch (err) {
      console.error(err);
      setFirebaseError('Google sign-up failed. Please try again.');
    }
  };

  /** Validation schema */
  const SignupSchema = Yup.object().shape({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email required'),
    password: Yup.string()
      .min(8, 'At least 8 characters')
      .matches(/[A-Z]/, 'Uppercase letter required')
      .matches(/[a-z]/, 'Lowercase letter required')
      .matches(/[0-9]/, 'Number required')
      .matches(/[^a-zA-Z0-9]/, 'Symbol required')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm your password'),
    acceptedTerms: Yup.boolean().oneOf(
      [true],
      'Please accept terms and privacy policy'
    ),
  });

  if (loadingInvite) {
    return <div className="p-6 text-center">Validating invitation...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f7fa] to-[#f4f9fb] dark:from-[#0c1b1f] dark:to-[#1c2b2f] px-4">
      <div className="w-full max-w-lg p-8 bg-white dark:bg-[#152226] rounded-3xl shadow-xl space-y-6 mt-28">
        <div className="flex justify-center mb-2">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={120}
            height={40}
          />
        </div>

        <h2 className="text-3xl font-bold text-center text-[#004d59] dark:text-white">
          Welcome Home 👋
        </h2>

        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            acceptedTerms: false,
          }}
          validationSchema={SignupSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setFirebaseError('');

            // 🔗 LINK EMPLOYEE TO USER (CRITICAL)
            if (!companyId) {
              setFirebaseError('You must use your company invitation link.');
              setSubmitting(false);
              return;
            }

            if (!(await ensureCompanyExists(companyId))) {
              setFirebaseError('Invalid company invitation link.');
              setSubmitting(false);
              return;
            }

            try {
              const userCredential = await createUserWithEmailAndPassword(
                auth,
                values.email,
                values.password,
              );
              const user = userCredential.user;

              await updateProfile(user, { displayName: values.fullName });
              await waitForAuthReady();


              const userRef = doc(db, 'users', user.uid);
              await setDoc(userRef, getDefaultUserData(user, values.fullName), {
                merge: true,
              });

              await setDoc(doc(db, 'customers', user.uid), {
                email: user.email,
                name: values.fullName,
                stripeCustomerId: '',
                plan: 'trial',
                createdAt: serverTimestamp(),
              });

              await cloneOnboardingTemplate(user.uid);

              //  LINK EMPLOYEE (SSOT: use invite.employeeId)
              if (companyId && inviteRole === 'employee' && inviteEmployeeId) {
                await setDoc(
                  doc(
                    db,
                    'companies',
                    companyId,
                    'employees',
                    inviteEmployeeId,
                  ),
                  {
                    uid: user.uid,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true },
                );
              }

              //  ALWAYS MARK INVITE AS USED
              if (inviteDocRef) {
                await updateDoc(inviteDocRef, {
                  status: 'accepted',
                  acceptedAt: serverTimestamp(),
                }).catch((err) => {
                  console.error('❌ Invite update failed:', err);
                  throw err;
                });
              }
              //  THEN REDIRECT
              await new Promise((res) => setTimeout(res, 500));
              router.push('/route-router');
            } catch (err) {
              console.error(err);
              setFirebaseError(
                'Account creation failed. Try a different email.',
              );
            }

            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {/* FULL NAME */}
              <div>
                <Field
                  name="fullName"
                  type="text"
                  placeholder="Full name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
                <ErrorMessage
                  name="fullName"
                  component="div"
                  className="text-sm text-red-600"
                />
              </div>

              {/* EMAIL */}
              <div>
                <Field
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-sm text-red-600"
                />
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <Field
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute top-2 right-3"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-sm text-red-600"
                />
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <Field
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute top-2 right-3"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-sm text-red-600"
                />
              </div>

              {/* TERMS */}
              <div className="flex items-center gap-2 text-sm">
                <Field type="checkbox" name="acceptedTerms" />
                <label htmlFor="acceptedTerms">
                  I agree to the Terms & Privacy Policy
                </label>
              </div>

              {firebaseError && (
                <div className="text-sm text-red-600">{firebaseError}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00ACC1] text-white py-2 rounded-lg"
              >
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </Form>
          )}
        </Formik>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-xs text-gray-500">or continue with</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full border border-gray-300 flex items-center justify-center gap-3 py-2 rounded-lg"
        >
          <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
          Continue with Google
        </button>

        <p className="text-center text-sm mt-2">
          Already have an account?{' '}
          <a href="/login" className="text-[#00ACC1] font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}