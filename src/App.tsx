import React, { Suspense, lazy } from 'react';

const DummyDashboardWrapper = lazy(() => import('./cores/dummy/MainDashboard'));
const LiveDashboardWrapper = lazy(() => import('./cores/live/MainDashboard'));

export default function App() {
  let mode = 'DUMMY';
  try {
    mode = localStorage.getItem('geoai_mode') || 'DUMMY';
  } catch (e) {}
  
  const ActiveDashboard = mode === 'LIVE' ? LiveDashboardWrapper : DummyDashboardWrapper;

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-[#111111] flex flex-col items-center justify-center text-[#00E5FF] font-mono">
        <div className="text-lg">STREAMING WORKSPACE MODULES...</div>
      </div>
    }>
      <ActiveDashboard />
    </Suspense>
  );
}

