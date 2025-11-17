// src/hooks/useEmployees.ts
import { useEffect, useState, useRef } from 'react';
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
  deleteDoc,
  increment,
  getCountFromServer,
} from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Exited' | string;
  startDate: string;
  endDate?: string | null;
  createdAt?: unknown;
  deletedAt?: unknown;
}

type SortOption = { field: 'createdAt' | 'name'; direction: 'asc' | 'desc' };

export function useEmployees(companyId?: string, pageSize = 10) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
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

  // -------------------------
  // Query builder for listing
  // -------------------------
  const buildListQuery = (
    cursor?: QueryDocumentSnapshot<DocumentData> | null,
    customLimit?: number
  ) => {
    if (!companyId) throw new Error('Missing companyId');
    const collRef = collection(db, 'companies', companyId, 'employees');

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
  };

  // -------------------------
  // Query builder for full export or counts
  // -------------------------
  const buildFullQuery = () => {
    if (!companyId) throw new Error('Missing companyId');

    const collRef = collection(db, 'companies', companyId, 'employees');

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
  };

  // -------------------------
  // Count matching documents
  // -------------------------
  const fetchCount = async () => {
    if (!companyId) return;

    try {
      const q = buildFullQuery();
      const snap = await getCountFromServer(q);
      setTotalEmployees(snap.data().count ?? null);
    } catch {
      setTotalEmployees(null); // fallback
    }
  };

  // -------------------------
  // Load a page
  // -------------------------
  const loadPage = async (pageToLoad = 1) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const cursor =
        pageToLoad > 1 ? cursorsRef.current.get(pageToLoad - 1) : undefined;

      const q = buildListQuery(cursor);
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
      console.error(err);
      setError('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

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

  // Simple export (current page only)
  const exportCurrentPageCSV = () => {
    const blob = createCSVBlob(employees);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees-current.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export filtered (batched)
  const exportFilteredEmployees = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const rows: Employee[] = [];
      const batchSize = 500;

      let cursor: QueryDocumentSnapshot<DocumentData> | null | undefined =
        undefined;

      while (true) {
        let q = query(buildFullQuery(), limit(batchSize));
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
    } finally {
      setLoading(false);
    }
  };

  // Export all (ignores filters)
  const exportAllEmployees = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const rows: Employee[] = [];
      const batchSize = 500;

      let cursor: QueryDocumentSnapshot<DocumentData> | null | undefined =
        undefined;

      while (true) {
        let q = query(
          collection(db, 'companies', companyId, 'employees'),
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
        break;
      }

      const blob = createCSVBlob(rows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees-all.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Add employee
  // -------------------------
  const addEmployee = async (data: Omit<Employee, 'id'>) => {
    if (!companyId) return;
    const ref = collection(db, 'companies', companyId, 'employees');

    const payload = {
      ...data,
      endDate: data.status === 'Exited' ? new Date().toISOString() : null,
      createdAt: serverTimestamp(),
      deletedAt: null,
    };

    const added = await addDoc(ref, payload);

    await updateDoc(doc(db, 'companies', companyId), {
      employeeCount: increment(1),
    });

    fetchCount().finally(() => loadPage(1));

    return added.id;
  };

  // -------------------------
  // Soft delete
  // -------------------------
  const deleteEmployee = async (id: string) => {
    if (!companyId) return;

    await updateDoc(doc(db, 'companies', companyId, 'employees', id), {
      deletedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'companies', companyId), {
      employeeCount: increment(-1),
    });

    fetchCount().finally(() => loadPage(page));
  };

  // -------------------------
  // Lifecycle
  // -------------------------
  useEffect(() => {
    cursorsRef.current = new Map();
    setPage(1);
    fetchCount().finally(() => loadPage(1));
  }, [
    companyId,
    statusFilter,
    departmentFilter,
    searchName,
    sortOption,
    pageSize,
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
