'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import AddCompanyModal from '@/components/superadmin/AddCompanyModal';
import EditCompanyModal from '@/components/superadmin/EditCompanyModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { ArrowUpDown, Building2, Check, Copy, Mail, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  plan: string;
  employeeCount: number;
  modulesEnabled: string[];
  createdAt?: any;
  status?: string;
  lastPayroll?: string;
}

type InviteState = {
  open: boolean;
  companyId: string;
  companyName: string;
  email: string;
  link: string;
  loading: boolean;
  copied: boolean;
  error: string;
};

const initialInviteState: InviteState = {
  open: false,
  companyId: '',
  companyName: '',
  email: '',
  link: '',
  loading: false,
  copied: false,
  error: '',
};

const formatCompanyDate = (createdAt?: Company['createdAt']) => {
  if (!createdAt) return '—';

  const date =
    typeof createdAt.toDate === 'function'
      ? createdAt.toDate()
      : createdAt.seconds
        ? new Date(createdAt.seconds * 1000)
        : null;

  return date
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    : '—';
};

const normalizeStatus = (status?: string) => status?.trim().toLowerCase() || 'unknown';

function CompanyStatusBadge({ status }: { status?: string }) {
  const normalized = normalizeStatus(status);
  const label = normalized === 'unknown' ? '—' : normalized;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
        normalized === 'active'
          ? 'bg-green-100 text-green-700'
          : normalized === 'suspended'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-700'
      }`}
    >
      {label}
    </span>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    companyId: string | null;
    currentName: string;
  }>({ open: false, companyId: null, currentName: '' });
  const [invite, setInvite] = useState<InviteState>(initialInviteState);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Company;
    direction: 'asc' | 'desc';
  } | null>(null);

  const router = useRouter();

  //  Firestore real-time listener
  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        setCompanies(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching companies:', error);
        toast({
          title: 'Could not load companies',
          description: 'Refresh the page or check your Firestore connection.',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  //  Sorting Logic
  const sortedCompanies = useMemo(() => [...companies].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';
    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  }), [companies, sortConfig]);

  const requestSort = (key: keyof Company) => {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    setDeleteId(id);

    try {
      await deleteDoc(doc(db, 'companies', id));
      toast({ title: 'Company deleted successfully' });
    } catch (err) {
      console.error('Error deleting company:', err);
      toast({ title: 'Error deleting company' });
    } finally {
      setDeleteId(null);
    }
  };

  const openInviteModal = (company: Company) => {
    setInvite({
      ...initialInviteState,
      open: true,
      companyId: company.id,
      companyName: company.name,
    });
  };

  const closeInviteModal = () => setInvite(initialInviteState);

  const copyInviteLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setInvite((prev) => ({ ...prev, copied: true }));
    } catch {
      setInvite((prev) => ({
        ...prev,
        copied: false,
        error: 'Copy failed. Select and copy the link manually.',
      }));
    }
  };

  const handleInviteHR = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = invite.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInvite((prev) => ({ ...prev, error: 'Enter a valid HR email address.' }));
      return;
    }

    setInvite((prev) => ({
      ...prev,
      loading: true,
      error: '',
      link: '',
      copied: false,
    }));

    try {
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        setInvite((prev) => ({
          ...prev,
          error: 'Please sign in again to send invitations.',
        }));
        return;
      }

      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ companyId: invite.companyId, email, role: 'hr' }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Could not create invitation.');
      }

      setInvite((prev) => ({ ...prev, link: payload.link }));
      await copyInviteLink(payload.link);
    } catch (err) {
      console.error('Error inviting HR:', err);
      setInvite((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : 'Error inviting HR. Please try again.',
      }));
    } finally {
      setInvite((prev) => ({ ...prev, loading: false }));
    }
  };

 return (
   <div className="mx-auto w-full max-w-7xl">
     <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
       <div>
         <p className="text-sm font-medium uppercase tracking-wide text-[#FB8C00]">
           Super admin
         </p>
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
           Company Management
         </h1>
         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
           Create customer workspaces and invite HR admins into each company.
         </p>
       </div>
       <Button
         onClick={() => setModalOpen(true)}
         className="w-full cursor-pointer bg-[#FB8C00] font-medium text-white transition hover:bg-[#F57C00] sm:w-auto"
       >
         Add Company
       </Button>
     </div>

     {/* Modals */}
     <AddCompanyModal
       open={modalOpen}
       onClose={() => setModalOpen(false)}
       onAdded={() => setModalOpen(false)}
     />

     <EditCompanyModal
       open={editModal.open}
       onClose={() =>
         setEditModal({ open: false, companyId: null, currentName: '' })
       }
       companyId={editModal.companyId || ''}
       currentName={editModal.currentName}
     />

     {invite.open && (
       <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
         role="dialog"
         aria-modal="true"
         aria-labelledby="invite-hr-title"
       >
         <form
           onSubmit={handleInviteHR}
           className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
         >
           <div className="mb-4">
             <h2
               id="invite-hr-title"
               className="text-xl font-semibold text-gray-900 dark:text-white"
             >
               Invite HR admin
             </h2>
             <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
               Send an invitation link for {invite.companyName}.
             </p>
           </div>

           <label
             htmlFor="hr-email"
             className="block text-sm font-medium text-gray-700 dark:text-gray-200"
           >
             HR email address
           </label>
           <input
             id="hr-email"
             type="email"
             value={invite.email}
             onChange={(event) =>
               setInvite((prev) => ({
                 ...prev,
                 email: event.target.value,
                 error: '',
               }))
             }
             placeholder="hr@example.com"
             disabled={invite.loading || Boolean(invite.link)}
             className="mt-1 h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800"
           />

           {invite.error && (
             <p className="mt-2 text-sm text-red-600" role="alert">
               {invite.error}
             </p>
           )}

           {invite.link && (
             <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
               <div className="flex items-start gap-2 text-sm font-medium text-green-800 dark:text-green-200">
                 <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                 Invite created{invite.copied ? ' and copied to clipboard.' : '.'}
               </div>
               <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                 <input
                   readOnly
                   value={invite.link}
                   className="min-w-0 flex-1 rounded-md border border-green-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-green-800 dark:bg-gray-950 dark:text-gray-200"
                   aria-label="Generated invitation link"
                 />
                 <Button
                   type="button"
                   onClick={() => copyInviteLink(invite.link)}
                   className="inline-flex items-center justify-center gap-2 bg-[#00ACC1] text-white hover:bg-[#0097A7]"
                 >
                   <Copy size={14} aria-hidden="true" />
                   Copy
                 </Button>
               </div>
             </div>
           )}

           <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
             <Button
               type="button"
               variant="outline"
               onClick={closeInviteModal}
               disabled={invite.loading}
             >
               {invite.link ? 'Close' : 'Cancel'}
             </Button>
             {!invite.link && (
               <Button
                 type="submit"
                 disabled={invite.loading}
                 className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
               >
                 <Mail size={14} aria-hidden="true" />
                 {invite.loading ? 'Creating invite...' : 'Create invite'}
               </Button>
             )}
           </div>
         </form>
       </div>
     )}

     {/* Loading */}
     {loading ? (
       <div className="space-y-3">
         {[...Array(3)].map((_, i) => (
           <Skeleton key={i} className="h-10 w-full rounded-md" />
         ))}
       </div>
     ) : sortedCompanies.length === 0 ? (
       <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
         <Building2
           className="mx-auto h-10 w-10 text-gray-400"
           aria-hidden="true"
         />
         <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
           No companies yet
         </h2>
         <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
           Add the first company workspace, then create an HR invite from the
           companies table.
         </p>
       </section>
     ) : (
       <>
         {/* ================= MOBILE VIEW ================= */}
         <div className="space-y-4 xl:hidden">
           {sortedCompanies.map((company) => (
             <div
               key={company.id}
               className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
             >
               <button
                 type="button"
                 onClick={() =>
                   router.push(`/superadmin/company/${company.id}/employees`)
                 }
                 className="text-left text-lg font-semibold text-[#00ACC1] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00ACC1]"
               >
                 {company.name}
               </button>

               <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                 <div>Plan: {company.plan}</div>
                 <div>Employees: {company.employeeCount ?? 0}</div>
                 <div><CompanyStatusBadge status={company.status} /></div>
                 <div className="text-xs text-gray-500">{formatCompanyDate(company.createdAt)}</div>
               </div>

               <div className="mt-4 grid grid-cols-2 gap-2">
                 <Button
                   className="bg-[#00ACC1] text-xs text-white hover:bg-[#0097A7]"
                   onClick={() =>
                     setEditModal({
                       open: true,
                       companyId: company.id,
                       currentName: company.name,
                     })
                   }
                 >
                   Edit
                 </Button>

                 <Button
                   className="bg-purple-600 text-xs text-white hover:bg-purple-700"
                   onClick={() => openInviteModal(company)}
                 >
                   Invite HR
                 </Button>

                 <Button
                   className="col-span-2 bg-red-500 text-xs text-white hover:bg-red-600"
                   onClick={() => handleDelete(company.id)}
                   disabled={deleteId === company.id}
                 >
                   {deleteId === company.id ? 'Deleting...' : 'Delete'}
                 </Button>
               </div>
             </div>
           ))}
         </div>

         {/* ================= DESKTOP TABLE (UNCHANGED) ================= */}
         <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:block">
           <table className="min-w-full">
             <thead className="bg-gray-100 text-left text-sm font-semibold uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-200">
               <tr>
                 {[
                   { label: 'Company Name', key: 'name' },
                   { label: 'Plan', key: 'plan' },
                   { label: 'Employees', key: 'employeeCount' },
                   { label: 'Status', key: 'status' },
                   { label: 'Created', key: 'createdAt' },
                 ].map((col) => (
                   <th
                     key={col.key}
                     className="px-4 py-3"
                   >
                     <button
                       type="button"
                       onClick={() => requestSort(col.key as keyof Company)}
                       className="flex items-center gap-1 transition hover:text-[#00ACC1] focus:outline-none focus:ring-2 focus:ring-[#00ACC1]"
                     >
                       {col.label}
                       <ArrowUpDown
                         size={14}
                         className={
                           sortConfig?.key === col.key
                             ? 'text-[#00ACC1]'
                             : 'text-gray-400'
                         }
                         aria-hidden="true"
                       />
                     </button>
                   </th>
                 ))}
                 <th className="py-3 px-4 text-center">Actions</th>
               </tr>
             </thead>

             <tbody>
               {sortedCompanies.map((company) => (
                 <tr
                   key={company.id}
                   className="border-t hover:bg-gray-50 transition"
                 >
                   <td className="px-4 py-3 font-medium">
                     <button
                       type="button"
                       onClick={() =>
                         router.push(
                           `/superadmin/company/${company.id}/employees`,
                         )
                       }
                       className="text-left text-[#00ACC1] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00ACC1]"
                     >
                       {company.name}
                     </button>
                   </td>

                   <td className="px-4 py-3">{company.plan}</td>

                   <td className="px-4 py-3">{company.employeeCount ?? 0}</td>

                   <td className="px-4 py-3">
                     <CompanyStatusBadge status={company.status} />
                   </td>

                   <td className="px-4 py-3 text-sm text-gray-500">
                     {formatCompanyDate(company.createdAt)}
                   </td>

                   <td className="flex justify-center gap-2 px-4 py-3">
                     <Button
                       onClick={() =>
                         setEditModal({
                           open: true,
                           companyId: company.id,
                           currentName: company.name,
                         })
                       }
                       className="bg-[#00ACC1] hover:bg-[#0097A7] text-white text-xs px-3 py-1"
                     >
                       Edit
                     </Button>

                     <Button
                       onClick={() => openInviteModal(company)}
                       className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                     >
                       Invite HR
                     </Button>

                     <Button
                       onClick={() => handleDelete(company.id)}
                       disabled={deleteId === company.id}
                       className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1"
                     >
                       <Trash2 size={14} aria-hidden="true" />
                       <span className="sr-only">Delete {company.name}</span>
                       <span aria-hidden="true">
                         {deleteId === company.id ? 'Deleting...' : 'Delete'}
                       </span>
                     </Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </>
     )}
   </div>
 );
}
