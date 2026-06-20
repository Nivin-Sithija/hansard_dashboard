import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';

const OverviewPage = lazy(() => import('./routes/OverviewPage'));
const TopicAtlasPage = lazy(() => import('./routes/TopicAtlasPage'));
const TimelinePage = lazy(() => import('./routes/TimelinePage'));
const SpeechExplorerPage = lazy(() => import('./routes/SpeechExplorerPage'));
const PlaceholderPage = lazy(() => import('./routes/PlaceholderPage'));

function RouteLoader() {
  return (
    <div className="route-loader">
      <div className="route-loader__orb" />
      <p>Loading parliamentary insights…</p>
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
          <Route path="/speakers" element={<PlaceholderPage title="Speaker Profiles" description="Track how individual MPs and ministers shift their agenda across macro-topics, years, and languages. This route is scaffolded for the next release." />} />
          <Route path="/compare" element={<PlaceholderPage title="Compare" description="Side-by-side comparisons for speakers, topics, and periods will live here in the next iteration of the explorer." />} />
          <Route path="/methodology" element={<PlaceholderPage title="Methodology" description="A deeper explainer for the full extraction, embedding, clustering, and macro-topic pipeline is reserved here." />} />
          <Route path="/data" element={<PlaceholderPage title="Data & Downloads" description="Dataset downloads, exports, and citation-ready assets will be published from this route once the public package is finalized." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
