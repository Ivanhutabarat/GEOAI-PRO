import React from 'react';
import DummyDashboardWrapper from './cores/dummy/MainDashboard';
import LiveDashboardWrapper from './cores/live/MainDashboard';

export default function App() {
  let mode = 'DUMMY';
  try {
    mode = localStorage.getItem('geoai_mode') || 'DUMMY';
  } catch (e) {}
  
  const ActiveDashboard = mode === 'LIVE' ? LiveDashboardWrapper : DummyDashboardWrapper;

  return (
    <ActiveDashboard />
  );
}

