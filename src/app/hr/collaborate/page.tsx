'use client';

import { useEffect, useState } from 'react';
import {
  assignBuddy,
  createAnnouncement,
  getAnnouncements,
} from '@/lib/collaborate';
import { useUserAccess } from '@/hooks/useUserAccess';
import { getEmployeesForOrg } from '@/lib/collaborate';

export default function HRCollaboratePage() {
  const { companyId, user } = useUserAccess();

  const [employees, setEmployees] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedBuddy, setSelectedBuddy] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  //  Load employees
  useEffect(() => {
    if (!companyId) return;

    getEmployeesForOrg(companyId).then(setEmployees);
    getAnnouncements(companyId).then((res) => setAnnouncements(res.announcements));
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

  const handleCreateAnnouncement = async () => {
    if (!companyId || !user?.uid || !announcementTitle.trim() || !announcementMessage.trim()) {
      return;
    }

    try {
      setAnnouncementLoading(true);

      await createAnnouncement(companyId, {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        createdBy: user.uid,
      });

      const refreshed = await getAnnouncements(companyId);
      setAnnouncements(refreshed.announcements);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to create announcement');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Collaborate (HR)</h1>

      <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h2 className="font-medium">Assign onboarding buddy</h2>
        {employees.length < 2 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Add at least two active employees before assigning buddies.
          </p>
        )}

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
          disabled={loading || employees.length < 2}
          className="w-full bg-[#FB8C00] text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Assigning...' : 'Assign Buddy'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h2 className="font-medium">Create company announcement</h2>
        <input
          type="text"
          value={announcementTitle}
          onChange={(e) => setAnnouncementTitle(e.target.value)}
          placeholder="Announcement title"
          className="w-full border rounded p-2 text-sm"
        />
        <textarea
          value={announcementMessage}
          onChange={(e) => setAnnouncementMessage(e.target.value)}
          placeholder="Message for employees"
          rows={4}
          className="w-full border rounded p-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCreateAnnouncement}
          disabled={
            announcementLoading ||
            !announcementTitle.trim() ||
            !announcementMessage.trim()
          }
          className="w-full bg-[#00ACC1] text-white py-2 rounded disabled:opacity-50"
        >
          {announcementLoading ? 'Publishing...' : 'Publish Announcement'}
        </button>
      </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="font-medium">Recent announcements</h2>
        {announcements.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No announcements yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="rounded-lg border bg-gray-50 p-3">
                <p className="text-sm font-medium">{announcement.title}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {announcement.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}