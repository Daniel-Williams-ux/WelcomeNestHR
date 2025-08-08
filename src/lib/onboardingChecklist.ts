import { db } from "@/lib/firebase";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// ✅ Use correct subcollection name: "onboarding"
export async function getChecklist(userId: string): Promise<ChecklistItem[]> {
  const colRef = collection(db, "users", userId, "onboarding");
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ChecklistItem, "id">),
  }));
}

export async function completeChecklistItem(userId: string, itemId: string) {
  const itemRef = doc(db, "users", userId, "onboarding", itemId);
  await updateDoc(itemRef, {
    completed: true,
  });
}

export async function addChecklistItem(
  userId: string,
  item: Omit<ChecklistItem, "id"> & { id: string }
) {
  const itemRef = doc(db, "users", userId, "onboarding", item.id);
  await setDoc(itemRef, item);
}