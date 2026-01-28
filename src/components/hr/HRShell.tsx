'use client';

import React from 'react';

export default function HRShell({ children }: { children: React.ReactNode }) {
  // ⚠️ Deprecated HR shell
  // DO NOT apply layout, margins, sidebars, or headers here.
  // HR layout is owned exclusively by src/app/hr/layout.tsx

  return <>{children}</>;
}