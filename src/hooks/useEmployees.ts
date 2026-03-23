// src/hooks/useEmployees.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  serverTimestamp,
  addDoc,
  updateDoc,
  doc,
  increment,
  getCountFromServer,
} from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  title?: string;
  department?: string;
  email?: string;
  status?: 'Active' | 'On Leave' | 'Exited' | string;
  startDate?: string;
  endDate?: string | null;
  createdAt?: unknown;
  deletedAt?: unknown;
}

type SortOption = { field: 'createdAt' | 'name'; direction: 'asc' | 'desc' };

export function useEmployees(companyId?: string, pageSize = 10) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const cursorsRef = useRef<
    Map<number, QueryDocumentSnapshot<DocumentData> | null>
  >(new Map());

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');

  // Sorting
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'createdAt',
    direction: 'desc',
  });

  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);

  // --- Helper: validate companyId (treat "null"/"undefined"/empty as invalid)
  const isValidCompany = !!(
    companyId &&
    typeof companyId === 'string' &&
    companyId.trim().length > 0 &&
    companyId.trim().toLowerCase() !== 'null' &&
    companyId.trim().toLowerCase() !== 'undefined'
  );

  // -------------------------
  // Query builder for listing
  // -------------------------
  const buildListQuery = useCallback(
    (
      cursor?: QueryDocumentSnapshot<DocumentData> | null,
      customLimit?: number
    ) => {
      if (!isValidCompany) return null;
      const collRef = collection(db, 'companies', companyId!, 'employees');
      const limitVal = customLimit ?? pageSize;

      // Search by name prefix
      if (searchName.trim().length > 0) {
        const s = searchName.trim();
        let qRef = query(
          collRef,
          where('name', '>=', s),
          where('name', '<=', s + '\uf8ff'),
          orderBy('name', 'asc'),
          limit(limitVal)
        );
        if (cursor) qRef = query(qRef, startAfter(cursor));
        return qRef;
      }

      const filters: any[] = [];
      if (statusFilter) filters.push(where('status', '==', statusFilter));
      if (departmentFilter)
        filters.push(where('department', '==', departmentFilter));

      let qRef = query(
        collRef,
        ...filters,
        orderBy(sortOption.field, sortOption.direction),
        limit(limitVal)
      );
      if (cursor) qRef = query(qRef, startAfter(cursor));
      return qRef;
    },
    [
      companyId,
      pageSize,
      searchName,
      statusFilter,
      departmentFilter,
      sortOption,
      isValidCompany,
    ]
  );

  // -------------------------
  // Query builder for full export or counts
  // -------------------------
  const buildFullQuery = useCallback(() => {
    if (!isValidCompany) return null;
    const collRef = collection(db, 'companies', companyId!, 'employees');

    if (searchName.trim().length > 0) {
      const s = searchName.trim();
      return query(
        collRef,
        where('name', '>=', s),
        where('name', '<=', s + '\uf8ff'),
        orderBy('name', 'asc')
      );
    }

    const filters: any[] = [];
    if (statusFilter) filters.push(where('status', '==', statusFilter));
    if (departmentFilter)
      filters.push(where('department', '==', departmentFilter));

    return query(
      collRef,
      ...filters,
      orderBy(sortOption.field, sortOption.direction)
    );
  }, [companyId, searchName, statusFilter, departmentFilter, sortOption, isValidCompany]);

  // -------------------------
  // Count matching documents
  // -------------------------
  const fetchCount = useCallback(async () => {
    if (!isValidCompany) {
      setTotalEmployees(null);
      return;
    }

    try {
      const q = buildFullQuery();
      if (!q) {
        setTotalEmployees(null);
        return;
      }
      if (!isValidCompany) return;
      const snap = await getCountFromServer(q);
      // const snap = await getDocs(q);
      // setTotalEmployees(snap.size);
      setTotalEmployees(snap.data().count ?? null);
    } catch (err) {
      console.error('fetchCount error', err);
      setTotalEmployees(null);
    }
  }, [isValidCompany, buildFullQuery]);

  // -------------------------
  // Load a page
  // -------------------------
  const loadPage = useCallback(
    async (pageToLoad = 1) => {
      // if no company yet, ensure UI shows neutral state
      if (!isValidCompany) {
        setEmployees([]);
        setPage(1);
        setHasNext(false);
        setHasPrev(false);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const cursor =
          pageToLoad > 1 ? cursorsRef.current.get(pageToLoad - 1) : undefined;
        const q = buildListQuery(cursor);
        if (!q) {
          // nothing to run
          setEmployees([]);
          setPage(1);
          setHasNext(false);
          setHasPrev(false);
          setLoading(false);
          return;
        }

        const snap = await getDocs(q);

        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Employee[];
        const filtered = rows.filter((r) => !r.deletedAt);

        const lastVisible = snap.docs[snap.docs.length - 1] ?? null;
        cursorsRef.current.set(pageToLoad, lastVisible);

        setEmployees(filtered);
        setPage(pageToLoad);
        setHasPrev(pageToLoad > 1);

        if (typeof totalEmployees === 'number') {
          setHasNext(pageToLoad * pageSize < totalEmployees);
        } else {
          setHasNext(snap.docs.length === pageSize);
        }
      } catch (err) {
        console.error('loadPage error', err);
        setError('Failed to load employees.');
      } finally {
        setLoading(false);
      }
    },
    [isValidCompany, buildListQuery, pageSize, totalEmployees]
  );

  // -------------------------
  // EXPORT HELPERS
  // -------------------------
  const createCSVBlob = (rows: Employee[]) => {
    const fields: (keyof Employee)[] = [
      'id',
      'name',
      'title',
      'department',
      'email',
      'status',
      'startDate',
      'endDate',
    ];
    const csv = [
      fields.join(','),
      ...rows.map((r) =>
        fields
          .map((f) => `"${String((r as any)[f] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
  };

  const exportCurrentPageCSV = useCallback(() => {
    const blob = createCSVBlob(employees);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees-current.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [employees]);

  const exportFilteredEmployees = useCallback(async () => {
    if (!isValidCompany) {
      setError('No company selected for export.');
      return;
    }

    setLoading(true);
    try {
      const rows: Employee[] = [];
      const batchSize = 500;
      let cursor: QueryDocumentSnapshot<DocumentData> | null | undefined =
        undefined;

      while (true) {
        const baseQ = buildFullQuery();
        if (!baseQ) break;
        let q = query(baseQ, limit(batchSize));
        if (cursor) q = query(q, startAfter(cursor));

        const snap = await getDocs(q);
        if (snap.empty) break;

        snap.docs.forEach((d) => {
          const data = d.data();
          if (!data.deletedAt) rows.push({ id: d.id, ...(data as any) });
        });

        cursor = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < batchSize) break;
      }

      const blob = createCSVBlob(rows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees-filtered.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('exportFilteredEmployees error', err);
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  }, [isValidCompany, buildFullQuery]);

  const exportAllEmployees = useCallback(async () => {
    if (!isValidCompany) {
      setError('No company selected for export.');
      return;
    }

    setLoading(true);
    try {
      const rows: Employee[] = [];
      const batchSize = 500;
      let cursor: QueryDocumentSnapshot<DocumentData> | null | undefined =
        undefined;

      while (true) {
        let q = query(
          collection(db, 'companies', companyId!, 'employees'),
          orderBy('createdAt', 'desc'),
          limit(batchSize)
        );
        if (cursor) q = query(q, startAfter(cursor));

        const snap = await getDocs(q);
        if (snap.empty) break;

        snap.docs.forEach((d) => {
          const data = d.data();
          if (!data.deletedAt) rows.push({ id: d.id, ...(data as any) });
        });

        cursor = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < batchSize) break;
      }

      const blob = createCSVBlob(rows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees-all.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('exportAllEmployees error', err);
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  }, [isValidCompany, companyId]);

  // -------------------------
  // Add employee
  // -------------------------
  const addEmployee = useCallback(
    async (data: Omit<Employee, 'id'>) => {
      if (!isValidCompany) {
        throw new Error('No company selected.');
      }
      const ref = collection(db, 'companies', companyId!, 'employees');

      // TEMP: skip user lookup to unblock flow
      const userId = null;

      const payload = {
        ...data,
        // userId,
        userId: userId || null,//  CRITICAL FIX
        endDate: data.status === 'Exited' ? new Date().toISOString() : null,
        createdAt: serverTimestamp(),
        deletedAt: null,
      };

      try {
        const added = await addDoc(ref, payload);

        await updateDoc(
          doc(db, 'companies', companyId!, 'employees', added.id),
          {
            employeeId: added.id,
          },
        );

        //  AUTO ASSIGN COMPLIANCE MODULES
        try {
          const modulesSnap = await getDocs(
            collection(db, 'companies', companyId!, 'complianceModules'),
          );

          const employeeId = added.id;

          for (const moduleDoc of modulesSnap.docs) {

            await addDoc(
              collection(db, 'companies', companyId!, 'complianceAssignments'),
              {
                moduleId: moduleDoc.id,
                employeeId,
                status: 'pending',
                createdAt: serverTimestamp(),
              },
            );
          }

          console.log(' Compliance auto-assigned');
        } catch (err) {
          console.error('❌ Compliance assignment failed:', err);
        }

        // increment employeeCount on company doc if exists
        try {
          await updateDoc(doc(db, 'companies', companyId!), {
            employeeCount: increment(1),
          });
        } catch (err) {
          // non-fatal: log and continue
          console.warn('Failed to increment employeeCount', err);
        }

        // refresh counts and first page
        fetchCount().finally(() => loadPage(1));

        return added.id;
      } catch (err) {
        console.error('addEmployee error', err);
        throw err;
      }
    },
    [companyId, fetchCount, loadPage, isValidCompany],
  );

  // -------------------------
  // Soft delete
  // -------------------------
  const deleteEmployee = useCallback(
    async (id: string) => {
      if (!isValidCompany) {
        throw new Error('No company selected.');
      }

      try {
        await updateDoc(doc(db, 'companies', companyId!, 'employees', id), {
          deletedAt: serverTimestamp(),
        });

        try {
          await updateDoc(doc(db, 'companies', companyId!), {
            employeeCount: increment(-1),
          });
        } catch (err) {
          console.warn('Failed to decrement employeeCount', err);
        }

        fetchCount().finally(() => loadPage(page));
      } catch (err) {
        console.error('deleteEmployee error', err);
        throw err;
      }
    },
    [companyId, fetchCount, loadPage, page, isValidCompany]
  );

  // -------------------------
  // Lifecycle
  // -------------------------
  useEffect(() => {
    // reset cursors whenever companyId or filters change
    cursorsRef.current = new Map();
    setPage(1);

    // If no valid company yet, clear data and don't try queries
    if (!isValidCompany) {
      setEmployees([]);
      setTotalEmployees(null);
      setHasNext(false);
      setHasPrev(false);
      setLoading(false);
      setError(null);
      return;
    }

    // load counts and page once company is available
    setLoading(true);
    fetchCount()
      .catch((err) => {
        console.error('initial fetchCount failed', err);
      })
      .finally(() => {
        loadPage(1).catch((err) => {
          console.error('initial loadPage failed', err);
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companyId,
    statusFilter,
    departmentFilter,
    searchName,
    sortOption,
    pageSize,
    isValidCompany,
  ]);

  return {
    employees,
    loading,
    error,
    page,
    pageSize,
    hasNext,
    hasPrev,
    totalEmployees,
    next: () => hasNext && loadPage(page + 1),
    prev: () => hasPrev && loadPage(page - 1),
    setStatusFilter,
    setDepartmentFilter,
    setSearchName,
    setSortOption,
    addEmployee,
    deleteEmployee,
    exportCurrentPageCSV,
    exportFilteredEmployees,
    exportAllEmployees,
    reload: () => loadPage(page),
  };
}