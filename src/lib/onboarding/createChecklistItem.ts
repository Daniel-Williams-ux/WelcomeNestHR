import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreateChecklistItemParams {
  companyId: string;
  flowId: string;
  title: string;
  description?: string | null;
  order: number;
}

export async function createChecklistItem({
  companyId,
  flowId,
  title,
  description,
  order,
}: CreateChecklistItemParams) {
  const collectionRef = collection(
    db,
    'companies',
    companyId,
    'onboardingFlows',
    flowId,
    'checklistItems', //  canonical path
  );

  //  return the created document reference
  const docRef = await addDoc(collectionRef, {
    title,
    description: description ?? null,
    order,
    createdAt: serverTimestamp(),
  });

  return docRef;
}