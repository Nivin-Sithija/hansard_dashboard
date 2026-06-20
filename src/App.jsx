import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';

const OverviewPage = lazy(() => import('./routes/OverviewPage'));
const TopicAtlasPage = lazy(() => import('./routes/TopicAtlasPage'));
const TimelinePage = lazy(() => import('./routes/TimelinePage'));
const SpeechExplorerPage = lazy(() => import('./routes/SpeechExplorerPage'));
const SpeakersPage = lazy(() => import('./routes/SpeakersPage'));
const ComparePage = lazy(() => import('./routes/ComparePage'));
const MethodologyPage = lazy(() => import('./routes/MethodologyPage'));
const DataPage = lazy(() => import('./routes/DataPage'));

function RouteLoader() {
  return (
    <div className="route-loader">
      <div className="route-loader__orb" />
      <p>Loading parliamentary insights...</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/topics" element={<TopicAtlasPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/speeches" element={<SpeechExplorerPage />} />
          <Route path="/speakers" element={<SpeakersPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
