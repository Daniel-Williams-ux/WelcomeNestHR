// src/hooks/useEmployees.ts
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Exited';
  startDate: string;
  endDate?: string;
  createdAt?: any;
}

export function useEmployees(userId?: string | null, companyId?: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !companyId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const ref = collection(
      db,
      'users',
      userId,
      'companies',
      companyId,
      'employees'
    );
    const q = query(ref, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Employee[];
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        console.error('useEmployees snapshot error:', err);
        setError('Failed to load employees');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, companyId]);

  async function addEmployee(newEmployee: Omit<Employee, 'id'>) {
    if (!userId || !companyId) throw new Error('Missing userId or companyId');

    const employeesRef = collection(
      db,
      'users',
      userId,
      'companies',
      companyId,
      'employees'
    );

    // Auto-assign endDate if Exited
    const payload = {
      ...newEmployee,
      endDate: newEmployee.status === 'Exited' ? new Date().toISOString() : '',
      createdAt: serverTimestamp(),
    };

    const added = await addDoc(employeesRef, payload);

    // update employeeCount on the same company doc
    try {
      const companyRef = doc(db, 'users', userId, 'companies', companyId);
      await updateDoc(companyRef, { employeeCount: increment(1) });
    } catch (err) {
      console.warn('Failed to increment employeeCount:', err);
    }

    return added.id;
  }

  async function deleteEmployee(empId: string) {
    if (!userId || !companyId) throw new Error('Missing userId or companyId');
    const ref = doc(
      db,
      'users',
      userId,
      'companies',
      companyId,
      'employees',
      empId
    );
    await deleteDoc(ref);

    try {
      const companyRef = doc(db, 'users', userId, 'companies', companyId);
      await updateDoc(companyRef, { employeeCount: increment(-1) });
    } catch (err) {
      console.warn('Failed to decrement employeeCount:', err);
    }
  }

  return { employees, loading, error, addEmployee, deleteEmployee };
}