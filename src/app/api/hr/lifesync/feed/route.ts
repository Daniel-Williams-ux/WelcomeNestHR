import { app } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

const db = getFirestore(app);

type ServerLifeSyncEntry = Record<string, unknown> & {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function serializeTimestamp(value: unknown) {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

function canReadLifeSync(user: DocumentData | undefined) {
  return user?.role === "hr" || user?.role === "superadmin";
}

function sortByLatest(entries: ServerLifeSyncEntry[]) {
  return entries.sort((a, b) => {
    const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

function dedupeEntries(entries: ServerLifeSyncEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${String(entry.entryType ?? "entry")}-${String(
      entry.sourceEntryId ?? entry.id,
    )}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function loadCompanyFeed(companyId: string) {
  const snap = await db
    .collection("companies")
    .doc(companyId)
    .collection("lifesyncEntries")
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get();

  return snap.docs.map((doc): ServerLifeSyncEntry => {
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
    };
  });
}

async function loadLegacyEntries(companyId: string) {
  const employeesSnap = await db
    .collection("companies")
    .doc(companyId)
    .collection("employees")
    .limit(50)
    .get();

  const employees = employeesSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid as string | undefined,
        name: (data.name || data.fullName || data.email || "Employee") as string,
      };
    })
    .filter((employee) => employee.uid);

  const entries = await Promise.all(
    employees.map(async (employee) => {
      const [moodsSnap, wellnessSnap] = await Promise.all([
        db
          .collection("users")
          .doc(employee.uid!)
          .collection("lifesync")
          .doc("moodTracker")
          .collection("entries")
          .orderBy("createdAt", "desc")
          .limit(3)
          .get(),
        db
          .collection("users")
          .doc(employee.uid!)
          .collection("lifesync")
          .doc("wellnessLog")
          .collection("entries")
          .orderBy("createdAt", "desc")
          .limit(3)
          .get(),
      ]);

      const moodEntries = moodsSnap.docs
        .map((doc) => {
          const data = doc.data();
          const visibility = data.visibility ?? "hr_visible";

          if (!["hr_visible", "anonymous_hr"].includes(visibility)) return null;

          return {
            id: `legacy-mood-${doc.id}`,
            sourceEntryId: doc.id,
            entryType: "mood",
            userId: employee.uid,
            employeeId: employee.id,
            employeeName: visibility === "anonymous_hr" ? null : employee.name,
            mood: data.mood,
            note: visibility === "anonymous_hr" ? "" : data.note || "",
            confidence: data.confidence ?? null,
            supported: data.supported ?? null,
            connection: data.connection ?? null,
            workload: data.workload ?? null,
            visibility,
            followUpRequested: data.followUpRequested ?? false,
            urgentSupport: data.urgentSupport ?? false,
            createdAt: serializeTimestamp(data.createdAt),
            updatedAt: serializeTimestamp(data.updatedAt ?? data.createdAt),
          };
        })
        .filter((entry): entry is ServerLifeSyncEntry => Boolean(entry));

      const wellnessEntries = wellnessSnap.docs
        .map((doc) => {
          const data = doc.data();
          const visibility = data.visibility ?? "hr_visible";

          if (!["hr_visible", "anonymous_hr"].includes(visibility)) return null;

          return {
            id: `legacy-wellness-${doc.id}`,
            sourceEntryId: doc.id,
            entryType: "wellness",
            userId: employee.uid,
            employeeId: employee.id,
            employeeName: visibility === "anonymous_hr" ? null : employee.name,
            text: visibility === "anonymous_hr" ? "" : data.text || "",
            category: data.category ?? "reflection",
            visibility,
            followUpRequested: data.followUpRequested ?? false,
            createdAt: serializeTimestamp(data.createdAt),
            updatedAt: serializeTimestamp(data.updatedAt ?? data.createdAt),
          };
        })
        .filter((entry): entry is ServerLifeSyncEntry => Boolean(entry));

      return [...moodEntries, ...wellnessEntries];
    }),
  );

  return sortByLatest(entries.flat()).slice(0, 100);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAuth(app).verifyIdToken(token);
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const user = userSnap.data();

    if (!canReadLifeSync(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = user?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "No company assigned to this HR account" },
        { status: 400 },
      );
    }

    const [companyFeed, legacyEntries] = await Promise.all([
      loadCompanyFeed(companyId),
      loadLegacyEntries(companyId),
    ]);
    const entries = sortByLatest(dedupeEntries([...companyFeed, ...legacyEntries])).slice(0, 100);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[HR_LIFESYNC_FEED_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to load LifeSync feed" },
      { status: 500 },
    );
  }
}
