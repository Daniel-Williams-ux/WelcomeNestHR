'use client';

import { useEffect, useState } from 'react';
import { assignBuddy } from '@/lib/collaborate';
import { useUserAccess } from '@/hooks/useUserAccess';
import { getEmployeesForOrg } from '@/lib/collaborate';

export default function HRCollaboratePage() {
  const { companyId, user } = useUserAccess();

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedBuddy, setSelectedBuddy] = useState('');
  const [loading, setLoading] = useState(false);

  //  Load employees
  useEffect(() => {
    if (!companyId) return;

    getEmployeesForOrg(companyId).then(setEmployees);
  }, [companyId]);

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedBuddy) return;

    try {
      setLoading(true);

      if (!companyId) {
  alert('Company not loaded');
  return;
}

await assignBuddy(companyId, selectedEmployee, selectedBuddy, user.uid);

      alert('Buddy assigned successfully');

      setSelectedEmployee('');
      setSelectedBuddy('');
    } catch (err) {
      console.error(err);
      alert('Failed to assign buddy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Collaborate (HR)</h1>

      <div className="bg-white p-6 rounded-lg border space-y-4 max-w-md">
        {/* Employee Select */}
        <div>
          <label className="text-sm font-medium">Employee</label>
          <select
            className="w-full mt-1 border rounded p-2"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buddy Select */}
        <div>
          <label className="text-sm font-medium">Buddy</label>
          <select
            className="w-full mt-1 border rounded p-2"
            value={selectedBuddy}
            onChange={(e) => setSelectedBuddy(e.target.value)}
          >
            <option value="">Select buddy</option>
            {employees
              .filter((e) => e.id !== selectedEmployee)
              .map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
          </select>
        </div>

        {/* Action */}
        <button
          onClick={handleAssign}
          disabled={loading}
          className="w-full bg-[#FB8C00] text-white py-2 rounded"
        >
          {loading ? 'Assigning...' : 'Assign Buddy'}
        </button>
      </div>
    </div>
  );
}