'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Sliders, Info, AlertTriangle } from 'lucide-react';

export default function SuperAdminSettingsPage() {
  return (
    <motion.main
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Platform Settings</h1>
        <p className="text-sm text-gray-500">
          System-wide configuration and platform metadata (Superadmin only)
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PLATFORM INFO */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Info size={18} /> Platform Information
            </div>

            <div className="border-t border-gray-200" role="separator" />

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Platform Name</dt>
                <dd className="font-medium">WelcomeNestHR</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Environment</dt>
                <dd className="font-medium">Production</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Region</dt>
                <dd className="font-medium">Global</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Timezone</dt>
                <dd className="font-medium">UTC</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Build Version</dt>
                <dd className="font-medium">v1.0.0</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* SECURITY */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Shield size={18} /> Security & Access
            </div>

            <div className="border-t border-gray-200" role="separator" />

            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span>Superadmin Role Protection</span>
                <span className="text-green-700 font-medium">Enabled</span>
              </li>
              <li className="flex justify-between">
                <span>Suspended User Blocking</span>
                <span className="text-green-700 font-medium">Enabled</span>
              </li>
              <li className="flex justify-between">
                <span>Audit Logging</span>
                <span className="text-green-700 font-medium">Enabled</span>
              </li>
              <li className="flex justify-between">
                <span>Session Enforcement</span>
                <span className="text-green-700 font-medium">Enabled</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* FEATURES */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Sliders size={18} /> Global Feature Controls
            </div>

            <div className="border-t border-gray-200" role="separator" />

            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span>Company Onboarding</span>
                <span className="font-medium">Enabled</span>
              </li>
              <li className="flex justify-between">
                <span>Employee Module</span>
                <span className="font-medium">Enabled</span>
              </li>
              <li className="flex justify-between">
                <span>Usage Analytics</span>
                <span className="font-medium">Enabled</span>
              </li>
              <li className="flex justify-between">
                <span>Payroll Module</span>
                <span className="text-gray-500">Coming Soon</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* DANGER ZONE */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <AlertTriangle size={18} /> Danger Zone
            </div>

            <div className="border-t border-gray-200" role="separator" />

            <p className="text-sm text-gray-600">
              System-critical actions are intentionally disabled to prevent
              accidental damage.
            </p>

            <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>Platform reset — Disabled</li>
              <li>Global data purge — Disabled</li>
              <li>Force logout (all users) — Disabled</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.main>
  );
}