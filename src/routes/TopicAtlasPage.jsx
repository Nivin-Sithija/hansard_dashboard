import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useManyJsonResources } from '../lib/data/hooks';
import { D3TopicAtlas } from '../components/charts/D3TopicAtlas';
import { TopicDetailPanel } from '../components/topic/TopicDetailPanel';
import { useUiLanguage } from '../lib/uiLanguage';

const URLS = ['/data/atlas_points.json', '/data/topic_metadata.json', '/data/topic_event_links.json', '/data/event_sources.json'];

function useQueryTopic() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get('topic') ?? 'all';
}

export default function TopicAtlasPage() {
  const seededTopic = useQueryTopic();
  const { data, loading, error } = useManyJsonResources(URLS);
  const { t, localizeLanguageLabel } = useUiLanguage();
  const [selectedSpeech, setSelectedSpeech] = useState(null);
  const [hoveredSpeech, setHoveredSpeech] = useState(null);
  const [languageFilter, setLanguageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState(seededTopic);

  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);
  const atlasPoints = useMemo(() => data['/data/atlas_points.json'] ?? [], [data]);
  const topicEvidence = useMemo(() => data['/data/topic_event_links.json'] ?? {}, [data]);
  const eventSources = useMemo(() => data['/data/event_sources.json'] ?? {}, [data]);
  const rankedTopics = useMemo(
    () => Object.values(topicMetadata)
      .filter((topic) => topic.topicId != null)
      .sort((left, right) => right.totalSpeeches - left.totalSpeeches),
    [topicMetadata],
  );

  const filteredPoints = useMemo(() => atlasPoints.filter((point) => {
    const matchesTopic = topicFilter === 'all' || point.topicKey === topicFilter;
    const matchesLanguage = languageFilter === 'all' || point.language === languageFilter;
    const matchesYear = yearFilter === 'all' || String(point.year) === yearFilter;
    return matchesTopic && matchesLanguage && matchesYear;
  }), [atlasPoints, languageFilter, topicFilter, yearFilter]);

  const starterTopic = rankedTopics[0] ?? null;
  const activeTopic = useMemo(() => {
    if (selectedSpeech?.topicKey && topicMetadata[selectedSpeech.topicKey]) return topicMetadata[selectedSpeech.topicKey];
    if (hoveredSpeech?.topicKey && topicMetadata[hoveredSpeech.topicKey]) return topicMetadata[hoveredSpeech.topicKey];
    if (topicFilter !== 'all') return topicMetadata[topicFilter];
    return starterTopic;
  }, [hoveredSpeech, selectedSpeech, starterTopic, topicFilter, topicMetadata]);

  const availableYears = useMemo(() => [...new Set(atlasPoints.map((point) => point.year))].sort((a, b) => a - b), [atlasPoints]);
  const availableLanguages = useMemo(() => [...new Set(atlasPoints.map((point) => point.language))], [atlasPoints]);
  const topicOptions = useMemo(() => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((a, b) => a.topicId - b.topicId), [topicMetadata]);

  if (loading) return <div className="page-state">{t('loadingAtlas')}</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Topic Atlas</div>
          <h1>Each point is a modeled speech positioned in semantic space.</h1>
          <p>Zoom, brush mentally, and click through clusters to see how multilingual speeches gather into macro-topics rather than separate language silos.</p>
        </div>
      </section>

      <section className="filter-bar editorial-panel">
        <label><span>{t('topic')}</span><select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}><option value="all">{t('allTopics')}</option>{topicOptions.map((topic) => <option key={topic.topicKey} value={topic.topicKey}>MT-{topic.topicId} | {topic.topicLabel}</option>)}</select></label>
        <label><span>{t('language')}</span><select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)}><option value="all">{t('allLanguages')}</option>{availableLanguages.map((language) => <option key={language} value={language}>{localizeLanguageLabel(language)}</option>)}</select></label>
        <label><span>{t('year')}</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="all">{t('allYears')}</option>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      </section>

      <section className="atlas-grid">
        <div className="editorial-panel">
          <div className="atlas-toolbar">
            <div><strong>{filteredPoints.length.toLocaleString()}</strong> {t('speechesInView')}</div>
            <div className="atlas-toolbar__hint">{t('atlasHint')}</div>
          </div>
          <D3TopicAtlas points={filteredPoints} topicMetadata={topicMetadata} selectedSpeechId={selectedSpeech?.speechId} onSelectSpeech={setSelectedSpeech} onHoverSpeech={setHoveredSpeech} />
          <details className="atlas-legend" open>
            <summary className="atlas-legend__summary">Macro-topic legend</summary>
            <div className="atlas-legend__items">
              {topicOptions.map((topic) => (
                <button
                  key={topic.topicKey}
                  type="button"
                  className={`atlas-legend__item${topicFilter === topic.topicKey ? ' is-active' : ''}`}
                  onClick={() => {
                    setTopicFilter(topic.topicKey);
                    setSelectedSpeech(null);
                    setHoveredSpeech(null);
                  }}
                >
                  <span className="atlas-legend__swatch" style={{ background: `rgb(${topic.color.join(', ')})` }} />
                  <span>MT-{topic.topicId} | {topic.topicLabel}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
        <TopicDetailPanel
          topic={activeTopic}
          speech={selectedSpeech || hoveredSpeech}
          topicEvidence={activeTopic ? topicEvidence[activeTopic.topicKey] : null}
          eventSources={eventSources}
          isStarter={!selectedSpeech && !hoveredSpeech && topicFilter === 'all' && !!starterTopic}
        />
      </section>
    </div>
  );
}
