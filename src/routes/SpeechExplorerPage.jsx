import React, { useMemo, useState } from 'react';
import { useManyJsonResources } from '../lib/data/hooks';
import { SpeechCard } from '../components/speech/SpeechCard';

const URLS = ['/data/speech_records.json', '/data/topic_metadata.json'];
const PAGE_SIZE = 30;

export default function SpeechExplorerPage() {
  const { data, loading, error } = useManyJsonResources(URLS);
  const [topicFilter, setTopicFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('clustered');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const speeches = useMemo(() => data['/data/speech_records.json'] ?? [], [data]);
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);
  const years = useMemo(() => [...new Set(speeches.map((speech) => speech.year))].sort((a, b) => b - a), [speeches]);
  const languages = useMemo(() => [...new Set(speeches.map((speech) => speech.language))], [speeches]);
  const topics = useMemo(() => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((a, b) => a.topicId - b.topicId), [topicMetadata]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return speeches.filter((speech) => {
      const matchesTopic = topicFilter === 'all' || speech.topicKey === topicFilter;
      const matchesYear = yearFilter === 'all' || String(speech.year) === yearFilter;
      const matchesLanguage = languageFilter === 'all' || speech.language === languageFilter;
      const matchesCluster = clusterFilter === 'all' || (clusterFilter === 'clustered' ? !speech.isNoise : speech.isNoise);
      const haystack = `${speech.searchText} ${speech.speaker}`.toLowerCase();
      return matchesTopic && matchesYear && matchesLanguage && matchesCluster && (!normalized || haystack.includes(normalized));
    });
  }, [clusterFilter, languageFilter, query, speeches, topicFilter, yearFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = (setter) => (event) => { setPage(1); setter(event.target.value); };

  if (loading) return <div className="page-state">Loading speeches…</div>;
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

      <section className="filter-bar editorial-panel filter-bar--dense">
        <label><span>Keyword or speaker</span><input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search excerpt text or speaker name" /></label>
        <label><span>Topic</span><select value={topicFilter} onChange={resetPage(setTopicFilter)}><option value="all">All topics</option>{topics.map((topic) => <option key={topic.topicKey} value={topic.topicKey}>MT-{topic.topicId} · {topic.topicLabel}</option>)}</select></label>
        <label><span>Year</span><select value={yearFilter} onChange={resetPage(setYearFilter)}><option value="all">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        <label><span>Language</span><select value={languageFilter} onChange={resetPage(setLanguageFilter)}><option value="all">All languages</option>{languages.map((language) => <option key={language} value={language}>{language}</option>)}</select></label>
        <label><span>Scope</span><select value={clusterFilter} onChange={resetPage(setClusterFilter)}><option value="clustered">Clustered only</option><option value="noise">Procedural noise only</option><option value="all">Everything</option></select></label>
      </section>

      <section className="editorial-panel explorer-summary">
        <div><strong>{filtered.length.toLocaleString()}</strong> speeches match your current filters.</div>
        <div>Page {safePage} of {pageCount}</div>
      </section>

      <section className="speech-grid">
        {paged.length ? paged.map((speech) => <SpeechCard key={speech.speechId} speech={speech} />) : <div className="page-state">No speeches match the current filters.</div>}
      </section>

      <section className="pagination-row">
        <button type="button" className="button button--secondary" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <button type="button" className="button button--secondary" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
      </section>
    </div>
  );
}
