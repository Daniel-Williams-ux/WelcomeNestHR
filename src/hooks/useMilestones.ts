import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  writeBatch,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";

export interface Milestone {
  id?: string; // optional when writing to Firestore
  title: string;
  description: string;
  status: "complete" | "in_progress" | "upcoming";
  order: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

const DEFAULT_MILESTONES: Omit<Milestone, "id">[] = [
  {
    title: "Welcome",
    description: "Get to know the platform",
    status: "upcoming",
    order: 1,
  },
  {
    title: "Profile Setup",
    description: "Complete your profile information",
    status: "upcoming",
    order: 2,
  },
  {
    title: "First Task",
    description: "Complete your first task",
    status: "upcoming",
    order: 3,
  },
  {
    title: "Feedback",
    description: "Provide feedback on your experience",
    status: "upcoming",
    order: 4,
  },
];

const milestoneConverter: FirestoreDataConverter<Milestone> = {
  toFirestore: ({ id, ...data }) => data, // drop id on write
  fromFirestore: (snap: QueryDocumentSnapshot<DocumentData>) => ({
    id: snap.id,
    ...(snap.data() as Omit<Milestone, "id">),
  }),
};

export function useMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const milestonesRef = collection(
      db,
      "users",
      user.uid,
      "milestones"
    ).withConverter(milestoneConverter);

    async function init() {
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists()
        ? (userSnap.data() as { milestonesSeeded?: boolean })
        : {};
      const seededFlag = userData.milestonesSeeded ?? false;

      const snap = await getDocs(milestonesRef);

      if (snap.empty) {
        console.log("🆕 No milestones found — seeding defaults");
        const batch = writeBatch(db);
        const now = new Date();

        DEFAULT_MILESTONES.forEach((m, i) => {
          const start = new Date(now);
          start.setDate(now.getDate() + i * 8);
          const end = new Date(start);
          end.setDate(start.getDate() + 7);

          const ref = doc(milestonesRef);
          batch.set(ref, {
            ...m,
            startDate: Timestamp.fromDate(start),
            endDate: Timestamp.fromDate(end),
          });
        });

        batch.update(userRef, { milestonesSeeded: true });
        await batch.commit();
      } else {
        let needsUpdate = false;
        const batch = writeBatch(db);

        snap.docs.forEach((docSnap, i) => {
          const data = docSnap.data();
          const updates: Partial<Milestone> = {};

          if (data.order == null) updates.order = i + 1;
          if (!data.startDate) {
            const start = new Date();
            start.setDate(start.getDate() + i * 8);
            updates.startDate = Timestamp.fromDate(start);
          }
          if (!data.endDate && updates.startDate) {
            const end = new Date((updates.startDate as Timestamp).toDate());
            end.setDate(end.getDate() + 7);
            updates.endDate = Timestamp.fromDate(end);
          }

          if (Object.keys(updates).length > 0) {
            needsUpdate = true;
            batch.update(docSnap.ref, updates);
          }
        });

        if (!seededFlag) {
          batch.update(userRef, { milestonesSeeded: true });
        }

        if (needsUpdate || !seededFlag) {
          await batch.commit();
        }
      }

      const q = query(milestonesRef);
      const unsub = onSnapshot(q, (snapshot) => {
        setMilestones(snapshot.docs.map((d) => d.data()));
        setLoading(false);
      });

      return unsub;
    }

    const unsubPromise = init();

    return () => {
      unsubPromise.then((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, [user]);

  return { milestones, loading };
}
