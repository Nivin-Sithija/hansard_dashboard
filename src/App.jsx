import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Card } from './components/Card';
import { TemporalEvolutionChart } from './components/TemporalEvolutionChart';
import { WordDistributionSection } from './components/WordDistributionSection';
import { Activity, BookOpen, Filter, Users, User, LayoutDashboard, Cloud, Loader2, Calendar, GitCompare, Menu, X } from 'lucide-react';
import { DASHBOARD_DATA_URLS, preloadData, readJson } from './utils/dataPreloader';

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
        ⚠️ Failed to load dashboard data: {loadError}
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

  const tabTitles = { topics: 'Topic Analysis of Parliament Speeches', speakers: 'Speaker Analytics', wordcloud: 'Word Cloud Analytics', sessions: 'Parliament Sessions', comparative: 'Comparative Analysis' };
  const tabTitle = tabTitles[activeTab] || 'Analytics';
  const navItems = [
    { id: 'topics', icon: <LayoutDashboard size={18} />, label: 'Topic Analytics' },
    { id: 'speakers', icon: <User size={18} />, label: 'Speaker Analytics' },
    { id: 'wordcloud', icon: <Cloud size={18} />, label: 'Word Cloud' },
    { id: 'sessions', icon: <Calendar size={18} />, label: 'Parliament Sessions' },
    { id: 'comparative', icon: <GitCompare size={18} />, label: 'Comparative Analysis' },
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
    if (isTopSixSelected) return 'Top 6 Macro-Topic Temporal Distribution';
    if (selectedTopics.length === 0) return 'Temporal Evolution Across All Macro-Topics';
    if (selectedTopics.length === 1) return `Temporal Evolution: MT-${selectedTopics[0]}`;
    return `Temporal Evolution: ${selectedTopics.length} Selected Macro-Topics`;
  }, [isTopSixSelected, selectedTopics]);
  const chartCardDescription = useMemo(() => {
    if (isTopSixSelected) {
      return 'Year-wise speech trends for the six macro-topics with the highest total volume.';
    }
    if (selectedTopics.length === 0) {
      return 'Year-wise speech trends across all macro-topics. Use the selector below to focus on specific themes.';
    }
    return 'Year-wise speech trends for the currently selected macro-topics. Event markers indicate major national milestones.';
  }, [isTopSixSelected, selectedTopics]);
  const macroTopicCount = useMemo(() => Object.keys(evolutionData.topic_labels || {}).length, [evolutionData]);

  useEffect(() => {
    if (!didInitializeTopSix && topSixTopicIds.length > 0 && selectedTopics.length === 0) {
      setSelectedTopics(topSixTopicIds);
      setActiveDetailTopic('cumulative');
      setDidInitializeTopSix(true);
    }
  }, [didInitializeTopSix, topSixTopicIds, selectedTopics, setSelectedTopics, setActiveDetailTopic]);

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background-color)' }}>

      {isMobileMenuOpen && <div className="mobile-nav-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ width: '280px', background: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', boxShadow: 'var(--shadow-sm)', zIndex: 10, position: 'sticky', top: 0, height: '100vh' }}>
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
            Parliamentary Discourse
            <br />
            &amp; Macro-Topic Evolution
            <br />
            (2017-2026)
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
      </aside>

      {/* Main Content */}
      <main className="dashboard-main" style={{ flex: 1, padding: '2rem 3rem', height: '100vh', overflowY: 'auto' }}>
        <div className="mobile-top-stack">
          <div className="mobile-brand-hero">
            <img src="/logo.svg" alt="SL Hansard Dashboard Logo" />
            <div>
              <h1>SL Hansard Dashboard</h1>
              <p>Parliamentary Discourse &amp; Macro-Topic Evolution (2017-2026)</p>
            </div>
          </div>

          <div className="mobile-topbar">
            <h1 className="mobile-topbar-title">{tabTitle}</h1>
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Open navigation menu"
              type="button"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        <header style={{ marginBottom: '2rem' }}>
          <h2 className="page-title" style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)' }}>{tabTitle}</h2>
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
            {/* ── Corpus Overview + Topic Filter ── */}
            <div className="flex-between topic-overview-card" style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="overview-stats-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="overview-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>{totalClusteredSpeeches.toLocaleString()}</div>
                  <div className="overview-stat-label" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clustered Speeches</div>
                </div>
                <div className="overview-stat-divider" style={{ width: '1px', height: '32px', background: 'var(--border-color)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div className="overview-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>{macroTopicCount}</div>
                  <div className="overview-stat-label" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Macro Topics</div>
                </div>
                <div className="overview-stat-divider" style={{ width: '1px', height: '32px', background: 'var(--border-color)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div className="overview-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>3</div>
                  <div className="overview-stat-label" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>Si · Ta · En</div>
                </div>
                <div className="overview-stat-divider" style={{ width: '1px', height: '32px', background: 'var(--border-color)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div className="overview-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>2017–2026</div>
                  <div className="overview-stat-label" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>9th Parliament</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
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
                    Add topic to analysis
                  </div>
                  <select value="default" onChange={(e) => toggleTopic(e.target.value)} className="select-input" style={{ marginBottom: '1rem' }}>
                    <option value="default" disabled>Add Topic to Analysis...</option>
                    <option value="all">Reset to All Topics (Clear Selection)</option>
                    <option value="top6">Top 6 Macro-Topic Distribution (Default)</option>
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
            © 2026 SL Hansard Dashboard. All rights reserved.
          </p>
          <p>
            This dashboard and derived analytics are developed for research and informational use. Data has been processed from source records and may contain errors, omissions, or interpretation differences.
            Content is provided as-is without warranties and should not be treated as an official parliamentary record, legal advice, or professional advice.
          </p>
          <p>
            Research compilation and dashboard development are part of the SL Hansard Dashboard project.
          </p>
        </footer>
      </main>
    </div>
  );
}

// Sub-component to keep AppShell readable
function TopicDetailPanel({ selectedTopics, activeDetailTopic, setActiveDetailTopic, evolutionData, keywordsData, getTopicMeta, totalClusteredSpeeches }) {
  const isAllTopics = selectedTopics.length === 0;
  const effectiveTopic = isAllTopics ? 'all_cumulative' : activeDetailTopic;
  const meta = getTopicMeta(effectiveTopic);

  return (
    <div className="topic-card-compact" style={{ marginTop: '1.25rem', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', flexWrap: 'wrap' }}>
        {isAllTopics ? (
          <button style={{ padding: '0.5rem 1rem', border: 'none', background: 'rgba(79,70,229,0.1)', color: 'var(--primary-color)', borderBottom: '3px solid var(--primary-color)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '4px 4px 0 0', marginBottom: '-9px' }}>Global Overview Dashboard</button>
        ) : (
          <>
            {selectedTopics.length > 1 && (
              <button onClick={() => setActiveDetailTopic('cumulative')} style={{ padding: '0.5rem 1rem', border: 'none', background: activeDetailTopic === 'cumulative' ? 'rgba(79,70,229,0.1)' : 'transparent', color: activeDetailTopic === 'cumulative' ? 'var(--primary-color)' : 'var(--text-secondary)', borderBottom: activeDetailTopic === 'cumulative' ? '3px solid var(--primary-color)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '4px 4px 0 0', transition: 'all 0.2s', marginBottom: '-9px' }}>Sum of Selected Options</button>
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
          <Card title={`${!isAllTopics && effectiveTopic !== 'cumulative' ? `MT-${effectiveTopic}: ` : ''}Meta Details`} icon={BookOpen}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{meta?.label}</h3>
            {/* Cluster size quality signal */}
            {meta?.total != null && (() => {
              const pct = totalClusteredSpeeches > 0 ? (meta.total / totalClusteredSpeeches) * 100 : 0;
              const sizeLabel = pct >= 15 ? 'Large cluster' : pct >= 5 ? 'Medium cluster' : 'Small cluster';
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
                { label: 'Total Speeches', value: meta?.total?.toLocaleString() },
                { label: 'Peak Year', value: `${meta?.peak} (${meta?.peakCount})` },
                { label: 'Avg / Yr', value: `~${meta?.avg}` },
              ].map(({ label, value }) => (
                <div key={label} className="meta-stat-item">
                  <p className="meta-stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p className="meta-stat-value" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Top Identifying Keywords" icon={Filter} className="flex-1">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {meta?.topWords.map((word, idx) => (
                <span key={idx} style={{ padding: '0.25rem 0.75rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '9999px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{word}</span>
              ))}
            </div>
          </Card>

          <Card title="Top Active Speakers" icon={Users}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {meta?.topSpeakers?.map((sp, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '1rem' }}>{sp.speaker}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--border-color)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>{sp.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
