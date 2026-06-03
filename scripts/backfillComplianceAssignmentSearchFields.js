require('dotenv').config({ path: '.env.local', quiet: true });

const admin = require('firebase-admin');

const normalizeComplianceSearch = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildComplianceSearchTokens = (values) => {
  const tokens = new Set();

  values
    .map((value) => normalizeComplianceSearch(value))
    .filter(Boolean)
    .forEach((value) => {
      value.split(' ').forEach((word) => {
        if (word.length < 2) return;

        for (let index = 2; index <= word.length; index += 1) {
          tokens.add(word.slice(0, index));
        }
      });
    });

  return Array.from(tokens).slice(0, 100);
};

const buildComplianceAssignmentSearchFields = ({ employee, module }) => {
  const employeeName = employee?.name?.trim() || '';
  const employeeDepartment = employee?.department?.trim() || '';
  const employeeTitle = employee?.title?.trim() || '';
  const moduleTitle = module?.title?.trim() || '';
  const moduleType = module?.type || null;
  const searchableText = normalizeComplianceSearch(
    [employeeName, employeeDepartment, employeeTitle, moduleTitle, moduleType]
      .filter(Boolean)
      .join(' '),
  );

  return {
    employeeName,
    employeeDepartment,
    employeeTitle,
    moduleTitle,
    moduleType,
    searchableText,
    searchTokens: buildComplianceSearchTokens([
      employeeName,
      employeeDepartment,
      employeeTitle,
      moduleTitle,
      moduleType,
    ]),
  };
};

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function commitBatch(batch, count) {
  if (count === 0) return;
  await batch.commit();
}

async function backfillCompany(companyDoc) {
  const companyRef = companyDoc.ref;
  const [employeesSnap, modulesSnap, assignmentsSnap] = await Promise.all([
    companyRef.collection('employees').get(),
    companyRef.collection('complianceModules').get(),
    companyRef.collection('complianceAssignments').get(),
  ]);

  const employees = new Map(
    employeesSnap.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]),
  );
  const modules = new Map(
    modulesSnap.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]),
  );

  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;

  for (const assignmentDoc of assignmentsSnap.docs) {
    const assignment = assignmentDoc.data();
    const employee = employees.get(assignment.employeeId);
    const module = modules.get(assignment.moduleId);

    batch.update(
      assignmentDoc.ref,
      buildComplianceAssignmentSearchFields({ employee, module }),
    );
    batchCount += 1;
    updated += 1;

    if (batchCount === 450) {
      await commitBatch(batch, batchCount);
      batch = db.batch();
      batchCount = 0;
    }
  }

  await commitBatch(batch, batchCount);

  return updated;
}

async function main() {
  const targetCompanyId = process.argv[2];
  const companiesSnap = targetCompanyId
    ? await db.collection('companies').where(admin.firestore.FieldPath.documentId(), '==', targetCompanyId).get()
    : await db.collection('companies').get();

  let totalUpdated = 0;

  for (const companyDoc of companiesSnap.docs) {
    const updated = await backfillCompany(companyDoc);
    totalUpdated += updated;
    console.log(`Backfilled ${updated} compliance assignment(s) for ${companyDoc.id}`);
  }

  console.log(`Done. Backfilled ${totalUpdated} compliance assignment(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
