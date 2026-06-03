import { Timestamp } from 'firebase/firestore';

export type ComplianceType = 'policy' | 'certification' | 'training' | 'task';
export type ComplianceStatus = 'pending' | 'completed' | 'overdue' | 'expiring_soon';

export type ComplianceModule = {
  id: string;
  title: string;
  description?: string;
  type: ComplianceType;
  documentUrl?: string;
  issuingAuthority?: string;
  requiresAcknowledgment?: boolean;
  defaultDueDate?: Timestamp | string | null;
  defaultExpiresAt?: Timestamp | string | null;
};

export type ComplianceAssignment = {
  id: string;
  moduleId: string;
  employeeId: string;
  status?: ComplianceStatus;
  dueDate?: Timestamp | string | null;
  expiresAt?: Timestamp | string | null;
  completedAt?: Timestamp | string | null;
  acknowledgedAt?: Timestamp | string | null;
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
  if (assignment.status === 'completed' || assignment.completedAt) {
    return 'completed';
  }

  const now = Date.now();
  const dueDate = toDate(assignment.dueDate);
  const expiresAt = toDate(assignment.expiresAt);
  const warningWindowMs = 1000 * 60 * 60 * 24 * 60;

  if (dueDate && dueDate.getTime() < now) {
    return 'overdue';
  }

  if (expiresAt) {
    const expiresIn = expiresAt.getTime() - now;

    if (expiresIn < 0) return 'overdue';
    if (expiresIn <= warningWindowMs) return 'expiring_soon';
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
    completed: 'Completed',
    overdue: 'Overdue',
    expiring_soon: 'Expiring soon',
  };

  return labels[status];
}
