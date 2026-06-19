import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Card } from './components/Card';
import { TemporalEvolutionChart } from './components/TemporalEvolutionChart';
import { WordDistributionSection } from './components/WordDistributionSection';
import { Activity, BookOpen, Filter, Users, User, LayoutDashboard, Cloud, Loader2, Calendar, GitCompare, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DASHBOARD_DATA_URLS, preloadData, readJson } from './utils/dataPreloader';
import { HeroBanner } from './components/HeroBanner';

// Lazy-load heavy tabs — only downloaded when the user first clicks them
const SpeakerAnalyticsSection = lazy(() => import('./components/SpeakerAnalyticsSection'));
const WordcloudAnalyticsSection = lazy(() => import('./components/WordcloudAnalyticsSection'));
const ParliamentSessionsSection = lazy(() => import('./components/ParliamentSessionsSection'));
const ComparativeAnalysisSection = lazy(() => import('./components/ComparativeAnalysisSection'));

// Small reusable loading spinner
function TabLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', gap: '1rem' }}>
      <Loader2 size={36} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Loading analytics data…</p>
    </div>
  );
}

// Full-page skeleton while core data loads
function AppLoader({ completed = 0, total = 1, currentUrl = '' }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #f8fbff 0%, var(--background-color) 100%)', padding: '2rem' }}>
      <div style={{ width: 'min(560px, 92vw)', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 1rem' }}>
          <img src="/logo.svg" alt="SL Hansard Dashboard Logo" className="logo-preload-mark" style={{ width: '84px', height: '84px' }} />
          <span className="logo-preload-ring" />
        </div>
        <h2 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Preparing SL Hansard Dashboard</h2>
        <p style={{ margin: '0 0 1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Preloading CSV and JSON data into the browser cache.
        </p>

        <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: '#dbe7fb', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)', transition: 'width 0.25s ease' }} />
        </div>

        <div style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <span>{completed}/{total} assets</span>
          <span>{percent}%</span>
        </div>
        {currentUrl && (
          <p style={{ margin: '0.6rem 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={currentUrl}>
            {currentUrl}
          </p>
        )}
      </div>
    </div>
  );
}

function TopicsBanner({ totalClusteredSpeeches, macroTopicCount }) {
  const statCards = [
    { value: totalClusteredSpeeches.toLocaleString(), label: 'Total Speeches', sub: '2017 – 2026' },
    { value: macroTopicCount, label: 'Topics', sub: 'by Clustering' },
    { value: '3', label: 'Languages', sub: 'Si · Ta · En' },
    { value: '10', label: 'Parliament years', sub: 'Sri Lanka' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>

      {/* Stat cards row */}
      <div className="topics-stat-cards" style={{ display: 'grid', gap: '1rem' }}>
        {statCards.map(({ value, label, sub }) => (
          <div key={label} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.25rem', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
            <div className="stat-num" style={{ fontSize: '2.15rem' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.3rem' }}>{label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{sub}</div>
          </div>
        ))}
      </div>
      </div>

  );
}

function App() {
  // ── Core data (needed immediately for Topic Analytics tab) ──
  const [evolutionData, setEvolutionData] = useState(null);
  const [keywordsData, setKeywordsData] = useState(null);
  const [speakerCounts, setSpeakerCounts] = useState(null);
  const [speakerNorm, setSpeakerNorm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [preloadStatus, setPreloadStatus] = useState({ completed: 0, total: DASHBOARD_DATA_URLS.length, currentUrl: '' });

  // ── UI state ──
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [activeDetailTopic, setActiveDetailTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('topics');

  // Fetch all core files in parallel on mount
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      await preloadData(DASHBOARD_DATA_URLS, ({ completed, total, currentUrl }) => {
        if (!cancelled) setPreloadStatus({ completed, total, currentUrl: currentUrl || '' });
      });

      const [evolution, keywords, speakerTopicCounts, normalization] = await Promise.all([
        readJson('/data/macro_topic_temporal_evolution_chart_data.json'),
        readJson('/data/macro_topic_keywords_100.json'),
        readJson('/data/speaker_topic_counts_by_macro_topic.json'),
        readJson('/data/speaker_normalization.json'),
      ]);

      if (cancelled) return;
      setEvolutionData(evolution);
      setKeywordsData(keywords);
      setSpeakerCounts(speakerTopicCounts);
      setSpeakerNorm(normalization);
    };

    boot().catch(err => {
      if (!cancelled) setLoadError(err.message);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = !evolutionData || !keywordsData || !speakerCounts || !speakerNorm;

  if (loadError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Failed to load dashboard data: {loadError}
      </div>
    );
  }

  if (isLoading) {
    return <AppLoader completed={preloadStatus.completed} total={preloadStatus.total} currentUrl={preloadStatus.currentUrl} />;
  }

  return <AppShell
    evolutionData={evolutionData}
    keywordsData={keywordsData}
    speakerCounts={speakerCounts}
    speakerNorm={speakerNorm}
    selectedTopics={selectedTopics}
    setSelectedTopics={setSelectedTopics}
    activeDetailTopic={activeDetailTopic}
    setActiveDetailTopic={setActiveDetailTopic}
    activeTab={activeTab}
    setActiveTab={setActiveTab}
  />;
}

// Separated to avoid re-render of hooks on every data update
function AppShell({
  evolutionData, keywordsData, speakerCounts, speakerNorm,
  selectedTopics, setSelectedTopics, activeDetailTopic, setActiveDetailTopic, activeTab, setActiveTab
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [didInitializeTopSix, setDidInitializeTopSix] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleTopic = (topicId) => {
    if (topicId === 'all') {
      setSelectedTopics([]);
      setActiveDetailTopic(null);
      return;
    }
    if (topicId === 'top6') {
      setSelectedTopics(topSixTopicIds);
      setActiveDetailTopic('cumulative');
      return;
    }
    setSelectedTopics(prev => {
      const isSelected = prev.includes(topicId.toString());
      const newSelected = isSelected
        ? prev.filter(t => t !== topicId.toString())
        : [...prev, topicId.toString()];
      if (!isSelected && newSelected.length > 0) {
        setActiveDetailTopic(newSelected.length > 1 ? 'cumulative' : topicId.toString());
      } else if (isSelected && activeDetailTopic === topicId.toString()) {
        setActiveDetailTopic(newSelected.length > 1 ? 'cumulative' : (newSelected.length === 1 ? newSelected[0] : null));
      } else if (isSelected && activeDetailTopic === 'cumulative' && newSelected.length <= 1) {
        setActiveDetailTopic(newSelected.length === 1 ? newSelected[0] : null);
      }
      return newSelected;
    });
  };

  const resolveSpeakerName = (name) => speakerNorm[name] || name;

  const getTopicMeta = (topicId) => {
    if (!topicId || topicId === 'all') return null;

    if (topicId === 'cumulative' || topicId === 'all_cumulative') {
      let total = 0, peakCount = 0, peakYear = 2017;
      const yearCounts = {}, wordScores = {}, speakerScores = {};
      const topicsToAggregate = topicId === 'all_cumulative' ? Object.keys(evolutionData.topic_labels) : selectedTopics;

      topicsToAggregate.forEach(id => {
        const sItem = evolutionData.series.find(s => s.mt_id.toString() === id);
        if (sItem) {
          sItem.points.forEach(p => {
            total += p.count;
            yearCounts[p.year] = (yearCounts[p.year] || 0) + p.count;
          });
        }
        const wordsArray = keywordsData['count_with_freq']?.[`Macro-Topic ${id}`] || [];
        wordsArray.forEach(item => {
          if (!/^[0-9,]+$/.test(item.keyword)) wordScores[item.keyword] = (wordScores[item.keyword] || 0) + item.count;
        });
        const speakersArray = speakerCounts.all_speakers_by_topic?.[`Macro-Topic ${id}`] || [];
        speakersArray.forEach(sp => {
          const normalizedName = resolveSpeakerName(sp.speaker);
          speakerScores[normalizedName] = (speakerScores[normalizedName] || 0) + sp.count;
        });
      });

      Object.keys(yearCounts).forEach(yr => {
        if (yearCounts[yr] > peakCount) { peakCount = yearCounts[yr]; peakYear = yr; }
      });
      const topWords = Object.keys(wordScores).sort((a, b) => wordScores[b] - wordScores[a]).slice(0, 8);
      const topSpeakers = Object.keys(speakerScores)
        .filter(sp => sp !== 'Unknown Speaker')
        .map(sp => ({ speaker: sp, count: speakerScores[sp] }))
        .sort((a, b) => b.count - a.count).slice(0, 5);
      return { total, peak: peakYear, peakCount, topWords, topSpeakers, label: topicId === 'all_cumulative' ? 'Global Overview (All Topics)' : 'Cumulative Topic Analysis', avg: Math.round(total / 10) };
    }

    const seriesItem = evolutionData.series.find(s => s.mt_id.toString() === topicId.toString());
    if (!seriesItem) return null;
    const total = seriesItem.points.reduce((sum, p) => sum + p.count, 0);
    const peak = seriesItem.points.reduce((max, p) => p.count > max.count ? p : max, seriesItem.points[0]);
    const wordsRaw = keywordsData['count_with_freq']?.[`Macro-Topic ${topicId}`] || [];
    const topWords = wordsRaw.filter(x => !/^[0-9,]+$/.test(x.keyword)).slice(0, 8).map(x => x.keyword);

    const topSpeakersRaw = speakerCounts.top5_speakers_by_topic?.[`Macro-Topic ${topicId}`] || [];
    const speakerScoresIndividual = {};
    topSpeakersRaw.forEach(sp => {
      const normalizedName = resolveSpeakerName(sp.speaker);
      speakerScoresIndividual[normalizedName] = (speakerScoresIndividual[normalizedName] || 0) + sp.count;
    });
    const topSpeakers = Object.keys(speakerScoresIndividual)
      .filter(sp => sp !== 'Unknown Speaker')
      .map(sp => ({ speaker: sp, count: speakerScoresIndividual[sp] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    return { total, peak: peak.year, peakCount: peak.count, topWords, topSpeakers, label: evolutionData.topic_labels[topicId], avg: Math.round(total / 10) };
  };

  const tabTitles = { topics: 'Topics Modeling', speakers: 'Speaker Profiles', wordcloud: 'Word Cloud', sessions: 'Sessions & Activity', comparative: 'Compare Speakers' };
  const tabTitle = tabTitles[activeTab] || 'Analytics';
  const navItems = [
    { id: 'topics', icon: <LayoutDashboard size={18} />, label: 'Topics' },
    { id: 'speakers', icon: <User size={18} />, label: 'Speakers' },
    { id: 'wordcloud', icon: <Cloud size={18} />, label: 'Word Cloud' },
    { id: 'sessions', icon: <Calendar size={18} />, label: 'Sessions' },
    { id: 'comparative', icon: <GitCompare size={18} />, label: 'Compare' },
  ];
  const totalClusteredSpeeches = useMemo(
    () => evolutionData.series.reduce((sum, s) => sum + s.points.reduce((inner, p) => inner + p.count, 0), 0),
    [evolutionData]
  );
  const topSixTopicIds = useMemo(() => {
    return [...evolutionData.series]
      .map(topic => ({
        id: topic.mt_id.toString(),
        total: topic.points.reduce((sum, p) => sum + p.count, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => item.id);
  }, [evolutionData]);
  const isTopSixSelected = useMemo(() => {
    if (selectedTopics.length !== topSixTopicIds.length || topSixTopicIds.length === 0) return false;
    return topSixTopicIds.every(id => selectedTopics.includes(id));
  }, [selectedTopics, topSixTopicIds]);
  const chartCardTitle = useMemo(() => {
    if (isTopSixSelected) return 'Top 6 Topics Over Time';
    if (selectedTopics.length === 0) return 'All Topics — Speech Activity Over Time';
    if (selectedTopics.length === 1) return `MT-${selectedTopics[0]}: Activity Over Time`;
    return `${selectedTopics.length} Topics — Activity Over Time`;
  }, [isTopSixSelected, selectedTopics]);
  const chartCardDescription = useMemo(() => {
    if (isTopSixSelected) {
      return 'Yearly speech counts for the six most discussed topics in parliament.';
    }
    if (selectedTopics.length === 0) {
      return 'Yearly speech counts across all topics. Use the selector below to focus on specific themes.';
    }
    return 'Yearly speech counts for your selected topics. Dashed lines mark major national events.';
  }, [isTopSixSelected, selectedTopics]);
  const macroTopicCount = useMemo(() => Object.keys(evolutionData.topic_labels || {}).length, [evolutionData]);

  return (
    <div className="app-shell" style={{
      display: 'flex', minHeight: '100vh',
      background:
        'radial-gradient(circle at 20% 18%, rgba(14, 165, 233, 0.13), transparent 32%),' +
        'radial-gradient(circle at 72% 24%, rgba(236, 72, 153, 0.12), transparent 34%),' +
        'linear-gradient(160deg, #eef2ff 0%, #f1f5f9 42%, #eef2ff 100%)'
    }}>

      {isMobileMenuOpen && <div className="mobile-nav-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* Desktop sidebar collapse toggle — hidden on mobile */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setIsSidebarCollapsed(prev => !prev)}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        style={{
          position: 'fixed',
          left: isSidebarCollapsed ? 0 : '268px',
          top: '50vh',
          transform: 'translateY(-50%)',
          transition: 'left 0.25s ease',
          zIndex: 30,
          width: '18px',
          height: '44px',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          border: '1px solid var(--border-color)',
          borderLeft: 'none',
          background: 'var(--surface-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          boxShadow: '2px 0 6px rgba(0,0,0,0.07)',
          padding: 0,
        }}
      >
        {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ width: isSidebarCollapsed ? '0' : '280px', minWidth: 0, flexShrink: 0, overflow: 'hidden', transition: 'width 0.25s ease', background: 'var(--sidebar-color)', borderRight: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', zIndex: 10, position: 'sticky', top: 0, height: '100vh' }}>
        {/* Inner wrapper is always 280px wide so overflow:hidden on aside clips it cleanly */}
        <div style={{ width: '280px', minWidth: '280px', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', height: '100%' }}>
          <button
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            type="button"
          >
            <X size={20} />
          </button>

          <div className="sidebar-brand" style={{ padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
              <img src="/logo.svg" alt="SL Hansard Dashboard Logo" style={{ width: '34px', height: '34px', flexShrink: 0 }} />
              <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>SL Hansard Dashboard</h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, textAlign: 'center' }}>
              Sri Lanka Parliament
              <br />
              2017–2026
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map(({ id, icon, label }) => (
              <button
                key={id}
                className="nav-tab-btn"
                onClick={() => {
                  setActiveTab(id);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  background: activeTab === id ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === id ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease', justifyContent: 'flex-start', textAlign: 'left'
                }}
              >
                {icon} {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main" style={{ flex: 1, padding: '2rem 3rem', height: '100vh', overflowY: 'auto' }}>
        <div className="mobile-top-stack">
          <div className="mobile-topbar">
            <div className="mobile-topbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="SL Hansard Dashboard Logo" />
              <span>SL Hansard Dashboard</span>
            </div>
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Open navigation menu"
              type="button"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="mobile-brand-hero">
            <h1 className="mobile-section-title">{tabTitle}</h1>
          </div>
        </div>

        <header style={{ marginBottom: '2rem' }}>
          <h2 className="page-title" style={{ margin: 0, fontSize: '2rem' }}>{tabTitle}</h2>
        </header>

        {/* Lazy-loaded tabs wrapped in Suspense */}
        {activeTab === 'speakers' ? (
          <Suspense fallback={<TabLoader />}>
            <SpeakerAnalyticsSection speakerNorm={speakerNorm} evolutionData={evolutionData} />
          </Suspense>
        ) : activeTab === 'wordcloud' ? (
          <Suspense fallback={<TabLoader />}>
            <WordcloudAnalyticsSection evolutionData={evolutionData} />
          </Suspense>
        ) : activeTab === 'sessions' ? (
          <Suspense fallback={<TabLoader />}>
            <ParliamentSessionsSection speakerNorm={speakerNorm} />
          </Suspense>
        ) : activeTab === 'comparative' ? (
          <Suspense fallback={<TabLoader />}>
            <ComparativeAnalysisSection evolutionData={evolutionData} keywordsData={keywordsData} speakerNorm={speakerNorm} />
          </Suspense>
        ) : (
          // Topic Analytics (eager — data already available)
          <>
            {/* ── Hero opening banner ── */}
            <HeroBanner
              totalSpeeches={totalClusteredSpeeches}
              macroTopicCount={macroTopicCount}
            />

            {/* ── Topics Overview Banner ── */}
            <TopicsBanner
              totalClusteredSpeeches={totalClusteredSpeeches}
              macroTopicCount={macroTopicCount}
            />

            <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
              <Card title={chartCardTitle} icon={Activity} className="w-full topic-card-compact">
                <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  <p>{chartCardDescription}</p>
                </div>
                <TemporalEvolutionChart
                  data={evolutionData}
                  selectedTopics={selectedTopics}
                  onTopicSelect={toggleTopic}
                  showDots={!isTopSixSelected}
                  forceLegend={isTopSixSelected}
                />

                <div style={{ marginTop: '1rem', width: 'min(800px, 100%)', alignSelf: 'flex-start', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--background-color)', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Filter by topic
                  </div>
                  <select value="default" onChange={(e) => toggleTopic(e.target.value)} className="select-input" style={{ marginBottom: '1rem' }}>
                    <option value="default" disabled>Add a topic...</option>
                    <option value="all">Show all topics (clear selection)</option>
                    <option value="top6">Top 6 most active topics</option>
                    {Object.entries(evolutionData.topic_labels).map(([id, label]) => {
                      const seriesItem = evolutionData.series.find(s => s.mt_id.toString() === id);
                      const speechCount = seriesItem ? seriesItem.points.reduce((sum, p) => sum + p.count, 0) : 0;
                      return (
                        <option key={id} value={id}>MT-{id}: {label.slice(0, 55)}{label.length > 55 ? '...' : ''} ({speechCount.toLocaleString()} speeches)</option>
                      );
                    })}
                  </select>
                  {selectedTopics.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {selectedTopics.map(id => {
                        const seriesItem = evolutionData.series.find(s => s.mt_id.toString() === id);
                        const rgb = seriesItem?.styles.standard_chart.color_rgba || [0.5, 0.5, 0.5];
                        const speechCount = seriesItem ? seriesItem.points.reduce((sum, p) => sum + p.count, 0) : 0;
                        return (
                          <div key={id} onClick={() => toggleTopic(id)} style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', background: `rgba(${rgb[0]*255},${rgb[1]*255},${rgb[2]*255},0.2)`, border: `1px solid rgba(${rgb[0]*255},${rgb[1]*255},${rgb[2]*255},0.8)`, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                            MT-{id}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{speechCount.toLocaleString()}</span>
                            <span style={{ fontSize: '1rem', lineHeight: 1 }}>×</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Topic detail panel */}
            <TopicDetailPanel
              selectedTopics={selectedTopics}
              activeDetailTopic={activeDetailTopic}
              setActiveDetailTopic={setActiveDetailTopic}
              evolutionData={evolutionData}
              keywordsData={keywordsData}
              getTopicMeta={getTopicMeta}
              totalClusteredSpeeches={totalClusteredSpeeches}
            />
          </>
        )}

        <footer className="dashboard-disclaimer" role="contentinfo">
          <p>
            © 2026 SL Hansard Dashboard · For research and informational use only. Data is derived from source records and may contain errors. Not an official parliamentary record.
          </p>
        </footer>
      </main>
    </div>
  );
}

// Sub-component to keep AppShell readable
function TopicDetailPanel({ selectedTopics, activeDetailTopic, setActiveDetailTopic, evolutionData, keywordsData, getTopicMeta, totalClusteredSpeeches }) {
  const [finalUniqueSpeakers, setFinalUniqueSpeakers] = React.useState(null);
  React.useEffect(() => {
    readJson('/data/final_unique_speakers.json').then(d => setFinalUniqueSpeakers(d || [])).catch(() => {});
  }, []);

  const speakerImages = React.useMemo(() => {
    const map = {};
    (finalUniqueSpeakers || []).forEach(sp => {
      if (sp.localPath) map[sp.name] = sp;
    });
    return map;
  }, [finalUniqueSpeakers]);

  const isAllTopics = selectedTopics.length === 0;
  const effectiveTopic = isAllTopics ? 'all_cumulative' : activeDetailTopic;
  const meta = getTopicMeta(effectiveTopic);

  return (
    <div className="topic-card-compact" style={{ marginTop: '1.25rem', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', flexWrap: 'wrap' }}>
        {isAllTopics ? (
          <button style={{ padding: '0.5rem 1rem', border: 'none', background: 'rgba(79,70,229,0.1)', color: 'var(--primary-color)', borderBottom: '3px solid var(--primary-color)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '4px 4px 0 0', marginBottom: '-9px' }}>All Topics</button>
        ) : (
          <>
            {selectedTopics.length > 1 && (
              <button onClick={() => setActiveDetailTopic('cumulative')} style={{ padding: '0.5rem 1rem', border: 'none', background: activeDetailTopic === 'cumulative' ? 'rgba(79,70,229,0.1)' : 'transparent', color: activeDetailTopic === 'cumulative' ? 'var(--primary-color)' : 'var(--text-secondary)', borderBottom: activeDetailTopic === 'cumulative' ? '3px solid var(--primary-color)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '4px 4px 0 0', transition: 'all 0.2s', marginBottom: '-9px' }}>Combined</button>
            )}
            {selectedTopics.map(id => {
              const isActive = activeDetailTopic === id;
              const rgb = evolutionData.series.find(s => s.mt_id.toString() === id)?.styles.standard_chart.color_rgba || [0.5, 0.5, 0.5];
              const colorBase = `rgb(${rgb[0]*255},${rgb[1]*255},${rgb[2]*255})`;
              return (
                <button key={id} onClick={() => setActiveDetailTopic(id)} style={{ padding: '0.5rem 1rem', border: 'none', background: isActive ? `rgba(${rgb[0]*255},${rgb[1]*255},${rgb[2]*255},0.1)` : 'transparent', color: isActive ? colorBase : 'var(--text-secondary)', borderBottom: isActive ? `3px solid ${colorBase}` : '3px solid transparent', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '4px 4px 0 0', transition: 'all 0.2s', marginBottom: '-9px' }}>MT-{id}</button>
              );
            })}
          </>
        )}
      </div>

      <div className="grid-2">
        <WordDistributionSection data={keywordsData} selectedTopicId={isAllTopics ? 'all_cumulative' : activeDetailTopic} evolutionData={evolutionData} selectedTopicsArray={selectedTopics} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title={`${!isAllTopics && effectiveTopic !== 'cumulative' ? `MT-${effectiveTopic}: ` : ''}Overview`} icon={BookOpen}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{meta?.label}</h3>
            {/* Cluster size quality signal */}
            {meta?.total != null && (() => {
              const pct = totalClusteredSpeeches > 0 ? (meta.total / totalClusteredSpeeches) * 100 : 0;
              const sizeLabel = pct >= 15 ? 'Major topic' : pct >= 5 ? 'Mid-size topic' : 'Niche topic';
              const sizeColor = pct >= 15 ? '#16a34a' : pct >= 5 ? '#d97706' : '#6366f1';
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sizeColor, background: `${sizeColor}18`, border: `1px solid ${sizeColor}40`, padding: '0.15rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sizeLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {pct.toFixed(1)}% of corpus
                  </span>
                </div>
              );
            })()}
            <div className="meta-stats-row" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Speeches', value: meta?.total?.toLocaleString() },
                { label: 'Busiest Year', value: `${meta?.peak} (${meta?.peakCount?.toLocaleString()})` },
                { label: 'Per Year (avg)', value: `~${meta?.avg?.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="meta-stat-item">
                  <p className="meta-stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p className="meta-stat-value stat-num" style={{ fontSize: '1.5rem' }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Key Terms" icon={Filter} className="flex-1">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {meta?.topWords.map((word, idx) => (
                <span key={idx} style={{ padding: '0.25rem 0.75rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '9999px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{word}</span>
              ))}
            </div>
          </Card>

          <Card title="Top Speakers" icon={Users}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {meta?.topSpeakers?.map((sp, idx) => {
                const imgInfo = speakerImages[sp.speaker];
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem', background: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--border-color)', flexShrink: 0, background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imgInfo ? (
                        <img src={imgInfo.localPath} alt={imgInfo.manthriName || sp.speaker} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={15} color="var(--text-secondary)" />
                      )}
                    </div>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {imgInfo?.manthriName || sp.speaker}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--border-color)', padding: '0.15rem 0.5rem', borderRadius: '9999px', flexShrink: 0 }}>{sp.count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
