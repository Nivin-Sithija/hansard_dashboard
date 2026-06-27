import React, { useMemo, useState } from 'react';
import { useManyJsonResources } from '../lib/data/hooks';
import { SpeechCard } from '../components/speech/SpeechCard';
import { useUiLanguage } from '../lib/uiLanguage';

const URLS = ['/data/speech_records.json', '/data/topic_metadata.json'];
const PAGE_SIZE = 30;

export default function SpeechExplorerPage() {
  const { data, loading, error } = useManyJsonResources(URLS);
  const { t, localizeLanguageLabel } = useUiLanguage();
  const [topicFilter, setTopicFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('clustered');
  const [textQuery, setTextQuery] = useState('');
  const [speakerQuery, setSpeakerQuery] = useState('');
  const [page, setPage] = useState(1);

  const speeches = useMemo(() => data['/data/speech_records.json'] ?? [], [data]);
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);
  const years = useMemo(() => [...new Set(speeches.map((speech) => speech.year))].sort((a, b) => b - a), [speeches]);
  const languages = useMemo(() => [...new Set(speeches.map((speech) => speech.language))], [speeches]);
  const topics = useMemo(() => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((a, b) => a.topicId - b.topicId), [topicMetadata]);
  const activeTopic = useMemo(() => (topicFilter === 'all' ? null : topics.find((topic) => topic.topicKey === topicFilter) || null), [topicFilter, topics]);
  const activeYearLabel = yearFilter === 'all' ? t('allYears') : yearFilter;

  const filtered = useMemo(() => {
    const normalizedText = textQuery.trim().toLowerCase();
    const normalizedSpeaker = speakerQuery.trim().toLowerCase();
    return speeches.filter((speech) => {
      const matchesTopic = topicFilter === 'all' || speech.topicKey === topicFilter;
      const matchesYear = yearFilter === 'all' || String(speech.year) === yearFilter;
      const matchesLanguage = languageFilter === 'all' || speech.language === languageFilter;
      const matchesCluster = clusterFilter === 'all' || (clusterFilter === 'clustered' ? !speech.isNoise : speech.isNoise);
      const excerptHaystack = String(speech.searchText || speech.excerpt || '').toLowerCase();
      const speakerHaystack = String(speech.speaker || '').toLowerCase();
      const matchesText = !normalizedText || excerptHaystack.includes(normalizedText);
      const matchesSpeaker = !normalizedSpeaker || speakerHaystack.includes(normalizedSpeaker);
      return matchesTopic && matchesYear && matchesLanguage && matchesCluster && matchesText && matchesSpeaker;
    });
  }, [clusterFilter, languageFilter, speakerQuery, speeches, textQuery, topicFilter, yearFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = (setter) => (event) => { setPage(1); setter(event.target.value); };

  if (loading) return <div className="page-state">{t('loadingSpeeches')}</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Speech Explorer</div>
          <h1>Search modeled speeches by topic, year, language, and procedural status.</h1>
          <p>The explorer stays fully static: every filter runs locally against the precomputed public dataset.</p>
        </div>
      </section>

      <section className="editorial-panel explorer-intro">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Evidence layer</div>
          <h2>{activeTopic ? `Read how Parliament discussed ${activeTopic.topicLabel.toLowerCase()} across ${activeYearLabel}.` : 'Start with a macro-topic, a year, or a speaker to turn the corpus into readable evidence.'}</h2>
          <p>{activeTopic ? 'These results surface representative speeches from the selected discourse family so you can connect model output to real parliamentary language.' : 'Use the controls below to move from a broad debate record into specific multilingual speeches, speakers, and procedural moments.'}</p>
        </div>
      </section>

      <section className="filter-bar editorial-panel filter-bar--dense">
        <label><span>{t('excerptText')}</span><input value={textQuery} onChange={(event) => { setPage(1); setTextQuery(event.target.value); }} placeholder={t('searchSpeechText')} /></label>
        <label><span>{t('speaker')}</span><input value={speakerQuery} onChange={(event) => { setPage(1); setSpeakerQuery(event.target.value); }} placeholder={t('searchSpeakerName')} /></label>
        <label><span>{t('topic')}</span><select value={topicFilter} onChange={resetPage(setTopicFilter)}><option value="all">{t('allTopics')}</option>{topics.map((topic) => <option key={topic.topicKey} value={topic.topicKey}>MT-{topic.topicId} | {topic.topicLabel}</option>)}</select></label>
        <label><span>{t('year')}</span><select value={yearFilter} onChange={resetPage(setYearFilter)}><option value="all">{t('allYears')}</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        <label><span>{t('language')}</span><select value={languageFilter} onChange={resetPage(setLanguageFilter)}><option value="all">{t('allLanguages')}</option>{languages.map((language) => <option key={language} value={language}>{localizeLanguageLabel(language)}</option>)}</select></label>
        <label><span>{t('scope')}</span><select value={clusterFilter} onChange={resetPage(setClusterFilter)}><option value="clustered">{t('clusteredOnly')}</option><option value="noise">{t('proceduralNoiseOnly')}</option><option value="all">{t('everything')}</option></select></label>
      </section>

      <section className="editorial-panel explorer-summary">
        <div><strong>{filtered.length.toLocaleString()}</strong> {t('speechesMatch')}</div>
        <div>{t('page')} {safePage} {t('of')} {pageCount}</div>
      </section>

      <section className="speech-grid speech-grid--explorer">
        {paged.length ? paged.map((speech) => (
          <SpeechCard
            key={speech.speechId}
            speech={speech}
            topic={speech.isNoise ? null : (topicMetadata[speech.topicKey] ?? null)}
          />
        )) : <div className="page-state">{t('noSpeechMatches')}</div>}
      </section>

      <section className="pagination-row">
        <button type="button" className="button button--secondary" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t('previous')}</button>
        <button type="button" className="button button--secondary" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>{t('next')}</button>
      </section>
    </div>
  );
}
