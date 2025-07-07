'use client';

import { useState } from 'react';
import ReportComparison from './components/ReportComparison';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ReportComparison />
    </main>
  );
}
