import { Timestamp } from 'firebase/firestore';

export type ComplianceType = 'policy' | 'certification' | 'training' | 'task';
export type ComplianceStatus =
  | 'pending'
  | 'due_soon'
  | 'submitted'
  | 'rejected'
  | 'completed'
  | 'overdue'
  | 'expiring_soon';

export type ComplianceModule = {
  id: string;
  title: string;
  description?: string;
  type: ComplianceType;
  documentUrl?: string;
  issuingAuthority?: string;
  version?: string;
  requiresAcknowledgment?: boolean;
  defaultDueDate?: Timestamp | string | null;
  defaultExpiresAt?: Timestamp | string | null;
};

export type ComplianceAssignment = {
  id: string;
  moduleId: string;
  employeeId: string;
  status?: ComplianceStatus;
  employeeName?: string;
  employeeDepartment?: string;
  employeeTitle?: string;
  moduleTitle?: string;
  moduleType?: ComplianceType;
  moduleVersion?: string;
  searchableText?: string;
  searchTokens?: string[];
  createdAt?: Timestamp | string | null;
  assignedAt?: Timestamp | string | null;
  assignedBy?: string | null;
  assignedByName?: string | null;
  dueDate?: Timestamp | string | null;
  expiresAt?: Timestamp | string | null;
  submittedAt?: Timestamp | string | null;
  completedAt?: Timestamp | string | null;
  acknowledgedAt?: Timestamp | string | null;
  approvedAt?: Timestamp | string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  rejectedAt?: Timestamp | string | null;
  rejectedBy?: string | null;
  rejectedByName?: string | null;
  rejectionNote?: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
  licenseNumber?: string;
  completionNote?: string;
};

export function toDate(value: Timestamp | string | null | undefined) {
  if (!value) return null;

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  const timestampLike = value as unknown as { toDate?: unknown };
  if (typeof timestampLike.toDate === 'function') {
    return (timestampLike as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: Timestamp | string | null | undefined) {
  const date = toDate(value);
  if (!date) return 'Not set';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getComplianceStatus(
  assignment: Pick<ComplianceAssignment, 'status' | 'completedAt' | 'dueDate' | 'expiresAt'>,
): ComplianceStatus {
  if (assignment.status === 'submitted') {
    return 'submitted';
  }

  if (assignment.status === 'rejected') {
    return 'rejected';
  }

  if (assignment.status === 'completed' || assignment.completedAt) {
    return 'completed';
  }

  const now = Date.now();
  const dueDate = toDate(assignment.dueDate);
  const expiresAt = toDate(assignment.expiresAt);
  const dueSoonWindowMs = 1000 * 60 * 60 * 24 * 14;
  const expiringSoonWindowMs = 1000 * 60 * 60 * 24 * 60;

  if (dueDate && dueDate.getTime() < now) {
    return 'overdue';
  }

  if (dueDate && dueDate.getTime() - now <= dueSoonWindowMs) {
    return 'due_soon';
  }

  if (expiresAt) {
    const expiresIn = expiresAt.getTime() - now;

    if (expiresIn < 0) return 'overdue';
    if (expiresIn <= expiringSoonWindowMs) return 'expiring_soon';
  }

  return 'pending';
}

export function complianceTypeLabel(type: ComplianceType) {
  const labels: Record<ComplianceType, string> = {
    policy: 'Policy acknowledgment',
    certification: 'Certification/license',
    training: 'Mandatory training',
    task: 'Compliance task',
  };

  return labels[type];
}

export function statusLabel(status: ComplianceStatus) {
  const labels: Record<ComplianceStatus, string> = {
    pending: 'Pending',
    due_soon: 'Due soon',
    submitted: 'Submitted',
    rejected: 'Needs changes',
    completed: 'Completed',
    overdue: 'Overdue',
    expiring_soon: 'Expiring soon',
  };

  return labels[status];
}

export function normalizeComplianceSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getComplianceSearchToken(value: string) {
  const normalized = normalizeComplianceSearch(value);
  return normalized.split(' ')[0] ?? '';
}

export function buildComplianceSearchTokens(values: Array<string | undefined | null>) {
  const tokens = new Set<string>();

  values
    .map((value) => normalizeComplianceSearch(value ?? ''))
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
}

export function buildComplianceAssignmentSearchFields(params: {
  employee?: {
    name?: string;
    department?: string;
    title?: string;
  } | null;
  module?: {
    title?: string;
    type?: ComplianceType;
    version?: string;
  } | null;
}) {
  const employeeName = params.employee?.name?.trim() ?? '';
  const employeeDepartment = params.employee?.department?.trim() ?? '';
  const employeeTitle = params.employee?.title?.trim() ?? '';
  const moduleTitle = params.module?.title?.trim() ?? '';
  const moduleType = params.module?.type;
  const moduleVersion = params.module?.version?.trim() ?? '1.0';
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
    moduleType: moduleType ?? null,
    moduleVersion,
    searchableText,
    searchTokens: buildComplianceSearchTokens([
      employeeName,
      employeeDepartment,
      employeeTitle,
      moduleTitle,
      moduleType,
    ]),
  };
}
