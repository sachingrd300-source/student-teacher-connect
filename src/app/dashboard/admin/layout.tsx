
'use client';

import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // This layout can be expanded with Admin-specific UI, like a secondary nav or header.
  return <div className="space-y-6">{children}</div>;
}
