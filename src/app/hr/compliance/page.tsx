'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  updateDoc,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useUserAccess } from '@/hooks/useUserAccess';
import {
  complianceTypeLabel,
  buildComplianceAssignmentSearchFields,
  formatDate,
  getComplianceSearchToken,
  getComplianceStatus,
  normalizeComplianceSearch,
  statusLabel,
  toDate,
  type ComplianceAssignment,
  type ComplianceModule,
  type ComplianceStatus,
  type ComplianceType,
} from '@/lib/compliance';

const ASSIGNMENTS_PAGE_SIZE = 25;
const EMPLOYEE_SUMMARY_LIMIT = 25;
const RISK_STATUSES: ComplianceStatus[] = ['overdue', 'due_soon', 'expiring_soon'];
const DUE_SOON_DAYS = 14;
const EXPIRING_SOON_DAYS = 60;
const ASSIGNMENT_BATCH_WRITE_LIMIT = 225;

type AssignmentStatusFilter = ComplianceStatus | 'risk' | 'all';
type AssignmentTypeFilter = ComplianceType | 'all';
type AssignmentTargetMode = 'employee' | 'department' | 'all';

const statusBadgeClass: Record<ComplianceStatus, string> = {
  completed: 'bg-green-100 text-green-700',
  submitted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-rose-100 text-rose-700',
  overdue: 'bg-red-100 text-red-700',
  due_soon: 'bg-orange-100 text-orange-700',
  expiring_soon: 'bg-orange-100 text-orange-700',
  pending: 'bg-slate-100 text-slate-700',
};

const riskPriority: Record<ComplianceStatus, number> = {
  overdue: 0,
  due_soon: 1,
  expiring_soon: 2,
  pending: 3,
  submitted: 4,
  rejected: 5,
  completed: 6,
};

const isRiskStatus = (status: ComplianceStatus) => RISK_STATUSES.includes(status);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const buildAssignment = (
  doc: QueryDocumentSnapshot<DocumentData>,
): ComplianceAssignment => {
  const data = doc.data();

  return {
    id: doc.id,
    moduleId: String(data.moduleId),
    employeeId: String(data.employeeId),
    status: data.status,
    employeeName: data.employeeName,
    employeeDepartment: data.employeeDepartment,
    employeeTitle: data.employeeTitle,
    moduleTitle: data.moduleTitle,
    moduleType: data.moduleType,
    moduleVersion: data.moduleVersion,
    searchableText: data.searchableText,
    searchTokens: data.searchTokens,
    createdAt: data.createdAt,
    assignedAt: data.assignedAt,
    assignedBy: data.assignedBy,
    assignedByName: data.assignedByName,
    dueDate: data.dueDate,
    expiresAt: data.expiresAt,
    submittedAt: data.submittedAt,
    completedAt: data.completedAt,
    acknowledgedAt: data.acknowledgedAt,
    approvedAt: data.approvedAt,
    approvedBy: data.approvedBy,
    approvedByName: data.approvedByName,
    rejectedAt: data.rejectedAt,
    rejectedBy: data.rejectedBy,
    rejectedByName: data.rejectedByName,
    rejectionNote: data.rejectionNote,
    evidenceUrl: data.evidenceUrl,
    evidenceFileName: data.evidenceFileName,
    licenseNumber: data.licenseNumber,
    completionNote: data.completionNote,
  };
};

const getDisplayName = (user: any) =>
  user?.fullName || user?.displayName || user?.email || 'HR user';

export default function HRCompliancePage() {
  const { user, companyId, loading: authLoading } = useUserAccess();
  
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ComplianceType | ''>('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [version, setVersion] = useState('1.0');
  const [defaultDueDate, setDefaultDueDate] = useState('');
  const [defaultExpiresAt, setDefaultExpiresAt] = useState('');

  const [modules, setModules] = useState<ComplianceModule[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [assignmentTargetMode, setAssignmentTargetMode] =
    useState<AssignmentTargetMode>('employee');
  const [assignmentDepartment, setAssignmentDepartment] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<ComplianceAssignment[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AssignmentTypeFilter>('all');
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentCursors, setAssignmentCursors] = useState<
    QueryDocumentSnapshot<DocumentData>[]
  >([]);
  const [hasNextAssignmentsPage, setHasNextAssignmentsPage] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [matchingAssignmentCount, setMatchingAssignmentCount] = useState(0);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [assignmentMetrics, setAssignmentMetrics] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    dueSoon: 0,
    expiringSoon: 0,
  });

  const toTimestamp = (value: string) =>
    value ? Timestamp.fromDate(new Date(`${value}T12:00:00`)) : null;

  // =========================
  // FETCH DATA
  // =========================
  const fetchModules = async (companyId: string) => {
    const snapshot = await getDocs(
      collection(db, 'companies', companyId, 'complianceModules'),
    );

    setModules(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ComplianceModule, 'id'>),
      })),
    );
  };

  const fetchEmployees = async (companyId: string) => {
    const snapshot = await getDocs(
      collection(db, 'companies', companyId, 'employees'),
    );

    const employeeRows: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setEmployees(employeeRows);
  };

  const fetchAuditEvents = async (companyId: string) => {
    const snapshot = await getDocs(
      query(
        collection(db, 'companies', companyId, 'complianceAuditEvents'),
        orderBy('createdAt', 'desc'),
        limit(150),
      ),
    );

    setAuditEvents(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    );
  };

  const fetchAssignmentMetrics = async (companyId: string) => {
    const assignmentsRef = collection(
      db,
      'companies',
      companyId,
      'complianceAssignments',
    );
    const now = new Date();
    const dueSoonDate = addDays(now, DUE_SOON_DAYS);
    const expiringSoonDate = addDays(now, EXPIRING_SOON_DAYS);

    const [
      totalSnap,
      completedSnap,
      overdueSnap,
      dueSoonSnap,
      expiringSoonSnap,
    ] = await Promise.all([
      getCountFromServer(assignmentsRef),
      getCountFromServer(query(assignmentsRef, where('status', '==', 'completed'))),
      getCountFromServer(
        query(
          assignmentsRef,
          where('status', '==', 'pending'),
          where('dueDate', '<', Timestamp.fromDate(now)),
        ),
      ),
      getCountFromServer(
        query(
          assignmentsRef,
          where('status', '==', 'pending'),
          where('dueDate', '>=', Timestamp.fromDate(now)),
          where('dueDate', '<=', Timestamp.fromDate(dueSoonDate)),
        ),
      ),
      getCountFromServer(
        query(
          assignmentsRef,
          where('status', '==', 'pending'),
          where('expiresAt', '>=', Timestamp.fromDate(now)),
          where('expiresAt', '<=', Timestamp.fromDate(expiringSoonDate)),
        ),
      ),
    ]);

    setAssignmentMetrics({
      total: totalSnap.data().count,
      completed: completedSnap.data().count,
      overdue: overdueSnap.data().count,
      dueSoon: dueSoonSnap.data().count,
      expiringSoon: expiringSoonSnap.data().count,
    });
  };

  const buildAssignmentQueryConstraints = () => {
    const constraints: QueryConstraint[] = [];
    const orderConstraints: QueryConstraint[] = [];
    const searchToken = getComplianceSearchToken(assignmentSearch);
    const now = new Date();
    const dueSoonDate = addDays(now, DUE_SOON_DAYS);
    const expiringSoonDate = addDays(now, EXPIRING_SOON_DAYS);

    if (searchToken.length >= 2) {
      constraints.push(where('searchTokens', 'array-contains', searchToken));
    }

    if (typeFilter !== 'all') {
      constraints.push(where('moduleType', '==', typeFilter));
    }

    if (statusFilter === 'completed') {
      constraints.push(where('status', '==', 'completed'));
      orderConstraints.push(orderBy('createdAt', 'desc'));
    } else if (statusFilter === 'submitted' || statusFilter === 'rejected') {
      constraints.push(where('status', '==', statusFilter));
      orderConstraints.push(orderBy('createdAt', 'desc'));
    } else if (statusFilter === 'overdue') {
      constraints.push(
        where('status', '==', 'pending'),
        where('dueDate', '<', Timestamp.fromDate(now)),
      );
      orderConstraints.push(orderBy('dueDate', 'asc'));
    } else if (statusFilter === 'due_soon') {
      constraints.push(
        where('status', '==', 'pending'),
        where('dueDate', '>=', Timestamp.fromDate(now)),
        where('dueDate', '<=', Timestamp.fromDate(dueSoonDate)),
      );
      orderConstraints.push(orderBy('dueDate', 'asc'));
    } else if (statusFilter === 'expiring_soon') {
      constraints.push(
        where('status', '==', 'pending'),
        where('expiresAt', '>=', Timestamp.fromDate(now)),
        where('expiresAt', '<=', Timestamp.fromDate(expiringSoonDate)),
      );
      orderConstraints.push(orderBy('expiresAt', 'asc'));
    } else if (statusFilter === 'risk') {
      constraints.push(
        where('status', '==', 'pending'),
        where('dueDate', '<=', Timestamp.fromDate(dueSoonDate)),
      );
      orderConstraints.push(orderBy('dueDate', 'asc'));
    } else {
      if (statusFilter === 'pending') {
        constraints.push(where('status', '==', 'pending'));
      }

      orderConstraints.push(orderBy('createdAt', 'desc'));
    }

    return {
      countConstraints: constraints,
      pageConstraints: [...constraints, ...orderConstraints],
      hasSearch: searchToken.length >= 2,
    };
  };

  const fetchAssignmentsPage = async (companyId: string, page: number) => {
    setAssignmentsLoading(true);
    setAssignments([]);

    try {
      const assignmentsRef = collection(
        db,
        'companies',
        companyId,
        'complianceAssignments',
      );
      const { countConstraints, pageConstraints } = buildAssignmentQueryConstraints();
      const previousPageCursor = page > 1 ? assignmentCursors[page - 2] : null;
      const assignmentQuery = previousPageCursor
        ? query(
            assignmentsRef,
            ...pageConstraints,
            startAfter(previousPageCursor),
            limit(ASSIGNMENTS_PAGE_SIZE + 1),
          )
        : query(
            assignmentsRef,
            ...pageConstraints,
            limit(ASSIGNMENTS_PAGE_SIZE + 1),
          );
      const [snapshot, countSnapshot] = await Promise.all([
        getDocs(assignmentQuery),
        getCountFromServer(query(assignmentsRef, ...countConstraints)),
      ]);
      const visibleDocs = snapshot.docs.slice(0, ASSIGNMENTS_PAGE_SIZE);

      setAssignments(visibleDocs.map(buildAssignment));
      setMatchingAssignmentCount(countSnapshot.data().count);
      setHasNextAssignmentsPage(snapshot.docs.length > ASSIGNMENTS_PAGE_SIZE);
      setAssignmentPage(page);

      if (visibleDocs.length > 0) {
        setAssignmentCursors((current) => {
          const next = [...current];
          next[page - 1] = visibleDocs[visibleDocs.length - 1];
          return next.slice(0, page);
        });
      }
    } catch (error) {
      console.error('Error loading assignment page:', error);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!companyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setAssignmentCursors([]);

    Promise.all([
      fetchModules(companyId),
      fetchEmployees(companyId),
      fetchAssignmentMetrics(companyId),
      fetchAssignmentsPage(companyId, 1),
      fetchAuditEvents(companyId),
    ])
      .catch((error) => {
        console.error('Error loading compliance data:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, companyId]);

  useEffect(() => {
    if (!companyId || authLoading) return;

    setAssignmentCursors([]);
    fetchAssignmentsPage(companyId, 1);
  }, [assignmentSearch, statusFilter, typeFilter, companyId, authLoading]);

  // =========================
  // SAVE MODULE
  // =========================
  const handleSave = async () => {
    if (!title || !type || !companyId) return;

    await addDoc(collection(db, 'companies', companyId, 'complianceModules'), {
      title: title.trim(),
      description: description.trim(),
      type,
      documentUrl: documentUrl.trim(),
      issuingAuthority: issuingAuthority.trim(),
      version: version.trim() || '1.0',
      requiresAcknowledgment: type === 'policy',
      defaultDueDate: toTimestamp(defaultDueDate),
      defaultExpiresAt: type === 'certification' ? toTimestamp(defaultExpiresAt) : null,
      createdAt: serverTimestamp(),
    });

    setTitle('');
    setDescription('');
    setType('');
    setDocumentUrl('');
    setIssuingAuthority('');
    setVersion('1.0');
    setDefaultDueDate('');
    setDefaultExpiresAt('');
    setShowForm(false);

    fetchModules(companyId);
  };

  // =========================
  // ASSIGN
  // =========================
  const getAssignmentTargets = (moduleId: string) => {
    const selectedEmployees =
      assignmentTargetMode === 'all'
        ? employees
        : assignmentTargetMode === 'department'
          ? employees.filter(
              (employee) =>
                employee.department &&
                employee.department === assignmentDepartment,
            )
          : employees.filter((employee) => employee.id === employeeId);
    const alreadyAssignedIds = new Set(
      assignments
        .filter((assignment) => assignment.moduleId === moduleId)
        .map((assignment) => assignment.employeeId),
    );
    const uniqueTargets = Array.from(
      new Map(selectedEmployees.map((employee) => [employee.id, employee])).values(),
    );
    const assignableTargets = uniqueTargets.filter(
      (employee) => !alreadyAssignedIds.has(employee.id),
    );

    return {
      selectedEmployees: uniqueTargets,
      assignableTargets,
      skippedCount: uniqueTargets.length - assignableTargets.length,
    };
  };

  const handleAssign = async (moduleId: string) => {
    if (!companyId) {
      return;
    }

    try {
      setAssigning(true);

      const moduleItem = modules.find((module) => module.id === moduleId);
      if (!moduleItem) return;

      const existingAssignmentsSnap = await getDocs(
        query(
          collection(db, 'companies', companyId, 'complianceAssignments'),
          where('moduleId', '==', moduleId),
        ),
      );
      const alreadyAssignedIds = new Set(
        existingAssignmentsSnap.docs.map((assignment) => assignment.data().employeeId),
      );
      const { assignableTargets } = getAssignmentTargets(moduleId);
      const targets = assignableTargets.filter(
        (employee) => !alreadyAssignedIds.has(employee.id),
      );

      if (targets.length === 0) {
        return;
      }

      const assignmentsRef = collection(
        db,
        'companies',
        companyId,
        'complianceAssignments',
      );
      const auditRef = collection(db, 'companies', companyId, 'complianceAuditEvents');
      const actorName = getDisplayName(user);

      for (let index = 0; index < targets.length; index += ASSIGNMENT_BATCH_WRITE_LIMIT) {
        const batch = writeBatch(db);
        const chunk = targets.slice(index, index + ASSIGNMENT_BATCH_WRITE_LIMIT);

        chunk.forEach((employee) => {
          const assignmentRef = doc(assignmentsRef);
          const assignmentPayload = {
            moduleId,
            employeeId: employee.id,
            status: 'pending',
            ...buildComplianceAssignmentSearchFields({
              employee,
              module: moduleItem,
            }),
            dueDate: moduleItem.defaultDueDate ?? null,
            expiresAt: moduleItem.defaultExpiresAt ?? null,
            assignedAt: serverTimestamp(),
            assignedBy: user?.uid ?? null,
            assignedByName: actorName,
            createdAt: serverTimestamp(),
          };

          batch.set(assignmentRef, assignmentPayload);
          batch.set(doc(auditRef), {
            action: 'assigned',
            assignmentId: assignmentRef.id,
            moduleId,
            moduleTitle: moduleItem.title,
            employeeId: employee.id,
            employeeName: employee.name ?? '',
            actorId: user?.uid ?? null,
            actorName,
            createdAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      setEmployeeId('');
      setAssignmentDepartment('');
      setAssignmentTargetMode('employee');
      setAssigningId(null);
      setAssignmentCursors([]);
      await Promise.all([
        fetchAssignmentMetrics(companyId),
        fetchAssignmentsPage(companyId, 1),
      ]);

    } catch (error) {
      console.error('Assignment failed:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleReviewAssignment = async (
    assignment: ComplianceAssignment,
    decision: 'approved' | 'rejected',
  ) => {
    if (!companyId) return;

    const actorName = getDisplayName(user);
    const note = rejectionNotes[assignment.id]?.trim() ?? '';
    const assignmentRef = doc(
      db,
      'companies',
      companyId,
      'complianceAssignments',
      assignment.id,
    );
    const auditRef = doc(collection(db, 'companies', companyId, 'complianceAuditEvents'));
    const batch = writeBatch(db);

    if (decision === 'approved') {
      batch.update(assignmentRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid ?? null,
        approvedByName: actorName,
        rejectionNote: '',
      });
    } else {
      batch.update(assignmentRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user?.uid ?? null,
        rejectedByName: actorName,
        rejectionNote: note || 'Please review and resubmit.',
      });
    }

    batch.set(auditRef, {
      action: decision,
      assignmentId: assignment.id,
      moduleId: assignment.moduleId,
      moduleTitle: assignment.moduleTitle ?? '',
      employeeId: assignment.employeeId,
      employeeName: assignment.employeeName ?? '',
      actorId: user?.uid ?? null,
      actorName,
      note: decision === 'rejected' ? note || 'Please review and resubmit.' : '',
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    setRejectionNotes((current) => ({ ...current, [assignment.id]: '' }));
    setAssignmentCursors([]);
    await Promise.all([
      fetchAssignmentMetrics(companyId),
      fetchAssignmentsPage(companyId, 1),
      fetchAuditEvents(companyId),
    ]);
  };

  const exportComplianceReport = async () => {
    if (!companyId) return;

    const assignmentsRef = collection(
      db,
      'companies',
      companyId,
      'complianceAssignments',
    );
    const { pageConstraints } = buildAssignmentQueryConstraints();
    const snapshot = await getDocs(
      query(assignmentsRef, ...pageConstraints, limit(1000)),
    );
    const rows = snapshot.docs.map((assignmentDoc) => {
      const assignment = buildAssignment(assignmentDoc);
      const module = modules.find((item) => item.id === assignment.moduleId);
      const employee = employees.find((item) => item.id === assignment.employeeId);
      const status = getComplianceStatus(assignment);

      return [
        assignment.moduleTitle || module?.title || 'Unknown requirement',
        assignment.moduleVersion || module?.version || '1.0',
        assignment.employeeName || employee?.name || 'Unknown employee',
        assignment.employeeDepartment || employee?.department || '',
        statusLabel(status),
        formatDate(assignment.dueDate),
        formatDate(assignment.expiresAt),
        assignment.evidenceUrl || '',
        assignment.completionNote || '',
      ];
    });
    const csv = [
      [
        'Requirement',
        'Version',
        'Employee',
        'Department',
        'Status',
        'Due date',
        'Expires at',
        'Evidence URL',
        'Note',
      ],
      ...rows,
    ]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const validAssignments = assignments.filter((a) =>
    modules.some((m) => m.id === a.moduleId),
  );
  const moduleMap = new Map(modules.map((module) => [module.id, module]));
  const assignmentsWithStatus = validAssignments.map((assignment) => ({
    ...assignment,
    status: getComplianceStatus(assignment),
    module:
      moduleMap.get(assignment.moduleId) ??
      (assignment.moduleTitle && assignment.moduleType
        ? {
            id: assignment.moduleId,
            title: assignment.moduleTitle,
            type: assignment.moduleType,
          }
        : undefined),
    employee:
      employees.find((employee) => employee.id === assignment.employeeId) ??
      (assignment.employeeName
        ? {
            id: assignment.employeeId,
            name: assignment.employeeName,
            department: assignment.employeeDepartment,
            title: assignment.employeeTitle,
          }
        : undefined),
  }));
  const sortedAssignments = [...assignmentsWithStatus].sort((a, b) => {
    const priorityDiff = riskPriority[a.status] - riskPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    const dueA = toDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const dueB = toDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return dueA - dueB;
  });
  const riskAssignments = assignmentsWithStatus.filter((assignment) =>
    isRiskStatus(assignment.status),
  );
  const pageMetrics = {
    total: assignmentsWithStatus.length,
    completed: assignmentsWithStatus.filter(
      (assignment) => assignment.status === 'completed',
    ).length,
    overdue: assignmentsWithStatus.filter((assignment) => assignment.status === 'overdue')
      .length,
    dueSoon: assignmentsWithStatus.filter((assignment) => assignment.status === 'due_soon')
      .length,
    expiringSoon: assignmentsWithStatus.filter(
      (assignment) => assignment.status === 'expiring_soon',
    ).length,
  };
  const effectiveMetrics =
    assignmentMetrics.total > 0 || pageMetrics.total === 0
      ? assignmentMetrics
      : pageMetrics;
  const filteredAssignments = sortedAssignments.filter((assignment) => {
    const searchValue = normalizeComplianceSearch(assignmentSearch);
    const moduleTitle = assignment.module?.title?.toLowerCase() ?? '';
    const employeeName = assignment.employee?.name?.toLowerCase() ?? '';
    const department = assignment.employee?.department?.toLowerCase() ?? '';
    const searchableText = assignment.searchableText ?? '';

    const matchesSearch =
      !searchValue ||
      searchableText.includes(searchValue) ||
      moduleTitle.includes(searchValue) ||
      employeeName.includes(searchValue) ||
      department.includes(searchValue);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'risk'
        ? isRiskStatus(assignment.status)
        : assignment.status === statusFilter);
    const matchesType =
      typeFilter === 'all' || assignment.module?.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });
  const currentAssignmentPage = assignmentPage;
  const paginatedAssignments = filteredAssignments;
  const totalRiskCount =
    effectiveMetrics.overdue +
    effectiveMetrics.dueSoon +
    effectiveMetrics.expiringSoon;
  const riskScore =
    effectiveMetrics.total === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            100 -
              ((effectiveMetrics.overdue * 2 +
                effectiveMetrics.dueSoon +
                effectiveMetrics.expiringSoon) /
                effectiveMetrics.total) *
                50,
          ),
        );
  const complianceRate =
    effectiveMetrics.total === 0
      ? 0
      : Math.round((effectiveMetrics.completed / effectiveMetrics.total) * 100);
  
  const employeeCompliance = employees.map((emp) => {
    const empAssignments = assignments.filter((a) => a.employeeId === emp.id);

    const validAssignments = empAssignments.filter((a) =>
      modules.some((m) => m.id === a.moduleId),
    );

    const uniqueModules = Array.from(
      new Set(validAssignments.map((a) => a.moduleId)),
    );

    const completedModules = uniqueModules.filter((moduleId) => {
      const moduleAssignments = validAssignments.filter(
        (a) => a.moduleId === moduleId,
      );

      return moduleAssignments.some((a) => getComplianceStatus(a) === 'completed');
    });


    const percent =
      uniqueModules.length === 0
        ? 0
        : Math.round((completedModules.length / uniqueModules.length) * 100);

    return {
      employee: emp,
      percent,
      total: uniqueModules.length,
      completed: completedModules.length,
    };
  });
  const employeesWithCompliance = employeeCompliance.filter((ec) => ec.total > 0);
  const visibleEmployeeCompliance = employeesWithCompliance.slice(
    0,
    EMPLOYEE_SUMMARY_LIMIT,
  );
  const complianceRiskEmployees = employees
    .map((emp) => {
      const employeeRisks = riskAssignments.filter(
        (assignment) => assignment.employeeId === emp.id,
      );

      return {
        employee: emp,
        risks: employeeRisks,
        highestRisk:
          employeeRisks
            .map((assignment) => assignment.status)
            .sort((a, b) => riskPriority[a] - riskPriority[b])[0] ?? null,
      };
    })
    .filter((ec) => ec.risks.length > 0)
    .sort((a, b) => {
      if (!a.highestRisk || !b.highestRisk) return 0;
      return riskPriority[a.highestRisk] - riskPriority[b.highestRisk];
    });
  const departments = Array.from(
    new Set(
      employees
        .map((employee) => employee.department)
        .filter((department): department is string => Boolean(department)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Compliance</h1>
          <p className="text-sm text-gray-600 mt-1 dark:text-slate-300">
            Manage policy acknowledgments, certifications, training, and audit readiness.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00ACC1] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
        >
          {showForm ? 'Close' : 'Create Requirement'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Risk score
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {riskScore}%
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {riskScore >= 85 ? 'Green' : riskScore >= 60 ? 'Yellow' : 'Red'} readiness
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Completed
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {effectiveMetrics.completed}
          </p>
          <p className="mt-1 text-xs text-gray-500">documented records</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Overdue
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {effectiveMetrics.overdue}
          </p>
          <p className="mt-1 text-xs text-gray-500">needs HR follow-up</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Due or expiring soon
          </p>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {effectiveMetrics.dueSoon + effectiveMetrics.expiringSoon}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            due in 14 days or expires in 60
          </p>
        </div>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="border rounded-2xl p-4 bg-white space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-gray-900 dark:text-white">
            New compliance requirement
          </h2>

          <input
            type="text"
            placeholder="Title, e.g. Employee Handbook Acknowledgment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as ComplianceType | '')}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">Select type</option>
            <option value="policy">Policy acknowledgment</option>
            <option value="certification">Certification/license</option>
            <option value="training">Mandatory training</option>
            <option value="task">Compliance task</option>
          </select>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="url"
              placeholder="Document or training URL (optional)"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <input
              type="text"
              placeholder="Issuing authority (optional)"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <input
              type="text"
              placeholder="Version, e.g. 1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
              Due date
              <input
                type="date"
                value={defaultDueDate}
                onChange={(e) => setDefaultDueDate(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
              Expiration date for certification/license
              <input
                type="date"
                value={defaultExpiresAt}
                onChange={(e) => setDefaultExpiresAt(e.target.value)}
                disabled={type !== 'certification'}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            className="bg-[#004d59] text-white px-4 py-2 rounded-lg text-sm"
          >
            Save requirement
          </button>
        </div>
      )}

      {/* ================= MODULES ================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Compliance Requirements</h2>

        {modules.length === 0 && (
          <div className="text-sm text-gray-500">
            No compliance requirements yet. Create your first policy,
            certification, training, or task to begin compliance tracking.
          </div>
        )}

        {modules.map((module) => (
          <div
            key={module.id}
            className="border rounded-xl p-4 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 dark:text-slate-300">
                  {module.description || 'No description added.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Due: {formatDate(module.defaultDueDate)}</span>
                  <span>Version: {module.version || '1.0'}</span>
                  {module.type === 'certification' && (
                    <span>Expires: {formatDate(module.defaultExpiresAt)}</span>
                  )}
                  {module.issuingAuthority && (
                    <span>Issuer: {module.issuingAuthority}</span>
                  )}
                  {module.documentUrl && (
                    <a
                      href={module.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#008FA1] underline"
                    >
                      Open document
                    </a>
                  )}
                </div>
              </div>

              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {complianceTypeLabel(module.type)}
              </span>
            </div>

            <div className="flex items-center justify-end mt-3">
              <button
                onClick={() => setAssigningId(module.id)}
                className="bg-[#00ACC1] text-white px-3 py-1 rounded text-xs"
              >
                Assign
              </button>
            </div>

            {assigningId === module.id &&
              (() => {
                const { selectedEmployees, assignableTargets, skippedCount } =
                  getAssignmentTargets(module.id);
                const canAssign = assignableTargets.length > 0 && !assigning;

                return (
                  <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="text-xs font-medium text-slate-600">
                        Assign to
                        <select
                          value={assignmentTargetMode}
                          onChange={(event) => {
                            setAssignmentTargetMode(
                              event.target.value as AssignmentTargetMode,
                            );
                            setEmployeeId('');
                            setAssignmentDepartment('');
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="employee">One employee</option>
                          <option value="department">Department</option>
                          <option value="all">Everyone</option>
                        </select>
                      </label>

                      {assignmentTargetMode === 'employee' && (
                        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                          Employee
                          <select
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          >
                            <option value="">Select employee</option>

                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} — {emp.title || 'Employee'}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {assignmentTargetMode === 'department' && (
                        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                          Department
                          <select
                            value={assignmentDepartment}
                            onChange={(e) => setAssignmentDepartment(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          >
                            <option value="">Select department</option>

                            {departments.map((department) => (
                              <option key={department} value={department}>
                                {department}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>

                    <div className="rounded-lg bg-white p-3 text-xs text-slate-600 dark:bg-slate-900">
                      {selectedEmployees.length === 0 ? (
                        <span>Select a target to preview who will receive this.</span>
                      ) : (
                        <span>
                          {assignableTargets.length} will be assigned
                          {skippedCount > 0
                            ? `, ${skippedCount} already assigned and skipped`
                            : ''}
                          .
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAssign(module.id)}
                        disabled={!canAssign}
                        className="rounded bg-[#00ACC1] px-3 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {assigning ? 'Assigning...' : 'Confirm assign'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningId(null);
                          setEmployeeId('');
                          setAssignmentDepartment('');
                          setAssignmentTargetMode('employee');
                        }}
                        className="rounded border border-slate-200 px-3 py-1 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assignment Register
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Track every policy, certification, training, and task assigned to employees.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {effectiveMetrics.total} active record
            {effectiveMetrics.total === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={exportComplianceReport}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <input
            type="search"
            value={assignmentSearch}
            onChange={(event) => setAssignmentSearch(event.target.value)}
            placeholder="Search all assignments"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AssignmentStatusFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="all">All statuses</option>
            <option value="risk">Risk only</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="rejected">Needs changes</option>
            <option value="due_soon">Due soon</option>
            <option value="overdue">Overdue</option>
            <option value="expiring_soon">Expiring soon</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as AssignmentTypeFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="all">All types</option>
            <option value="policy">Policy</option>
            <option value="certification">Certification/license</option>
            <option value="training">Training</option>
            <option value="task">Task</option>
          </select>
        </div>

        {assignmentsLoading && (
          <p className="mt-3 text-xs text-slate-500">Loading assignment page...</p>
        )}

        {effectiveMetrics.total === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No compliance assignments yet. Assign a requirement to an employee to
            start building audit-ready records.
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No assignments match those filters.
          </div>
        ) : (
          <>
            <div className="mt-3 text-xs text-slate-500">
              Showing {paginatedAssignments.length} matching records on page{' '}
              {currentAssignmentPage}. Global matches: {matchingAssignmentCount}.
              Total records: {effectiveMetrics.total}.
            </div>

            <div className="mt-4 grid gap-3">
              {paginatedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {assignment.module?.title || 'Missing requirement'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Assigned to{' '}
                      <span className="font-medium text-gray-700">
                        {assignment.employee?.name || 'Unknown employee'}
                      </span>
                      {assignment.employee?.department
                        ? ` · ${assignment.employee.department}`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Assigned {formatDate(assignment.assignedAt || assignment.createdAt)}
                      {assignment.assignedByName ? ` by ${assignment.assignedByName}` : ''}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass[assignment.status]}`}
                  >
                    {statusLabel(assignment.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-gray-600 sm:grid-cols-3">
                  <div>
                    <p className="font-medium uppercase tracking-wide text-gray-400">
                      Type
                    </p>
                    <p className="mt-1">
                      {assignment.module
                        ? complianceTypeLabel(assignment.module.type)
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wide text-gray-400">
                      Due
                    </p>
                    <p className="mt-1">{formatDate(assignment.dueDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium uppercase tracking-wide text-gray-400">
                      Expires
                    </p>
                    <p className="mt-1">
                      {assignment.module?.type === 'certification'
                        ? formatDate(assignment.expiresAt)
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Version: {assignment.moduleVersion || assignment.module?.version || '1.0'}</span>
                  {assignment.submittedAt && (
                    <span>Submitted: {formatDate(assignment.submittedAt)}</span>
                  )}
                  {assignment.evidenceUrl && (
                    <a
                      href={assignment.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#008FA1] underline"
                    >
                      Evidence: {assignment.evidenceFileName || 'Open file'}
                    </a>
                  )}
                </div>

                {assignment.completionNote && (
                  <p className="mt-3 rounded-lg bg-white p-2 text-xs text-gray-500 dark:bg-slate-900">
                    Note: {assignment.completionNote}
                  </p>
                )}

                {assignment.rejectionNote && (
                  <p className="mt-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                    Review note: {assignment.rejectionNote}
                  </p>
                )}

                {assignment.status === 'submitted' && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-800">
                      Awaiting HR review
                    </p>
                    <textarea
                      value={rejectionNotes[assignment.id] ?? ''}
                      onChange={(event) =>
                        setRejectionNotes((current) => ({
                          ...current,
                          [assignment.id]: event.target.value,
                        }))
                      }
                      placeholder="Optional note if rejecting"
                      className="mt-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleReviewAssignment(assignment, 'approved')}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewAssignment(assignment, 'rejected')}
                        className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {auditEvents.some((event) => event.assignmentId === assignment.id) && (
                  <details className="mt-3 rounded-lg bg-white p-2 text-xs text-gray-500 dark:bg-slate-900">
                    <summary className="cursor-pointer font-medium text-gray-700">
                      View history
                    </summary>
                    <div className="mt-2 space-y-1">
                      {auditEvents
                        .filter((event) => event.assignmentId === assignment.id)
                        .slice(0, 5)
                        .map((event) => (
                          <p key={event.id}>
                            {String(event.action).replace('_', ' ')} by{' '}
                            {event.actorName || 'System'} on {formatDate(event.createdAt)}
                          </p>
                        ))}
                    </div>
                  </details>
                )}
              </div>
              ))}
            </div>

            {(currentAssignmentPage > 1 || hasNextAssignmentsPage) && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Firestore loads {ASSIGNMENTS_PAGE_SIZE} records per page to keep
                  large companies responsive.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!companyId) return;
                      fetchAssignmentsPage(companyId, Math.max(1, assignmentPage - 1));
                    }}
                    disabled={assignmentsLoading || currentAssignmentPage === 1}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!companyId) return;
                      fetchAssignmentsPage(companyId, assignmentPage + 1);
                    }}
                    disabled={assignmentsLoading || !hasNextAssignmentsPage}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Compliance Coverage Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Assignment completion rate: {complianceRate}% across{' '}
            {effectiveMetrics.total} active record
            {effectiveMetrics.total === 1 ? '' : 's'}.
          </p>

          <div className="mt-4 space-y-2">
            {visibleEmployeeCompliance.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No employees have compliance assignments yet.
              </div>
            ) : (
              visibleEmployeeCompliance.map((ec) => (
                <div
                  key={ec.employee.id}
                  className="flex items-center justify-between rounded-lg border bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ec.employee.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ec.completed}/{ec.total} requirements completed
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      ec.percent === 100
                        ? 'bg-green-100 text-green-700'
                        : ec.percent > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ec.percent}%
                  </span>
                </div>
              ))
            )}
          </div>

          {employeesWithCompliance.length > EMPLOYEE_SUMMARY_LIMIT && (
            <p className="mt-3 text-xs text-slate-500">
              Showing first {EMPLOYEE_SUMMARY_LIMIT} employees from the loaded
              assignment page. Use the Assignment Register pages for detailed lookup.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Compliance Risk Queue
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Loaded-page employees with overdue, due-soon, or expiring compliance
            items. Total company risk records: {totalRiskCount}.
          </p>

          <div className="mt-4 space-y-2">
            {complianceRiskEmployees.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                No compliance risks right now. Assigned employees are up to date.
              </div>
            ) : (
              complianceRiskEmployees.map((ec) => (
                <div
                  key={ec.employee.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    ec.highestRisk === 'overdue'
                      ? 'border-red-100 bg-red-50'
                      : 'border-orange-100 bg-orange-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ec.employee.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ec.risks.length} item{ec.risks.length === 1 ? '' : 's'}{' '}
                      {ec.risks.length === 1 ? 'needs' : 'need'} attention
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      ec.highestRisk === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {ec.highestRisk ? statusLabel(ec.highestRisk) : 'Risk'}
                  </span>
                  {ec.employee.email && (
                    <a
                      href={`mailto:${ec.employee.email}?subject=Compliance reminder&body=Hi ${encodeURIComponent(ec.employee.name || '')},%0D%0A%0D%0AThis is a friendly reminder to complete your pending compliance requirement in WelcomeNestHR.%0D%0A%0D%0AThank you.`}
                      className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700 underline"
                    >
                      Send reminder
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}