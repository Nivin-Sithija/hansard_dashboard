import React, { useMemo } from 'react';
import { useManyJsonResources } from '../lib/data/hooks';
import { formatNumber } from '../lib/format';

const URLS = [
  '/data/overview_summary.json',
  '/data/parliament_sessions_summary.json',
  '/data/speech_records.json',
  '/data/topic_metadata.json',
];

const FILES = [
  { path: '/data/overview_summary.json', title: 'Overview summary', desc: 'High-level totals for speeches, topics, years, and language mix.' },
  { path: '/data/topic_metadata.json', title: 'Topic metadata', desc: 'Topic labels, colors, yearly counts, keywords, top speakers, and representative examples.' },
  { path: '/data/atlas_points.json', title: 'Atlas points', desc: 'UMAP-ready coordinates and metadata for plotted speech points in the Topic Atlas.' },
  { path: '/data/speech_records.json', title: 'Speech explorer records', desc: 'Search-friendly speech rows with date, speaker, language, topic, and local excerpt text.' },
  { path: '/data/parliament_sessions_summary.json', title: 'Session summary', desc: 'Year, month, speaker, and busiest-session aggregates for the activity views.' },
];

export default function DataPage() {
  const { data, loading, error } = useManyJsonResources(URLS);

  const overview = data['/data/overview_summary.json'];
  const sessions = data['/data/parliament_sessions_summary.json'];
  const speeches = useMemo(() => data['/data/speech_records.json'] ?? [], [data]);
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);

  const monthlyPeaks = useMemo(() => {
    if (!sessions?.byYearMonth) return [];

    return Object.entries(sessions.byYearMonth)
      .map(([year, months]) => {
        const top = Object.entries(months).sort((left, right) => right[1] - left[1])[0];
        return top ? { year, month: top[0], count: top[1] } : null;
      })
      .filter(Boolean)
      .sort((left, right) => Number(left.year) - Number(right.year));
  }, [sessions]);

  const topicCoverage = useMemo(() => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((left, right) => right.totalSpeeches - left.totalSpeeches).slice(0, 6), [topicMetadata]);

  if (loading) return <div className="page-state">Loading data notes...</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Data</div>
          <h1>See what powers the explorer and how the public-facing JSON files are organized.</h1>
          <p>This route is the handoff surface for future developers, researchers, and readers who want to understand the current static data contract without digging through the build script first.</p>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stat-block"><span>{formatNumber(overview.speechesAnalyzed)}</span><label>Total speeches analyzed</label></div>
        <div className="stat-block"><span>{formatNumber(overview.clusteredSpeeches)}</span><label>Clustered speeches</label></div>
        <div className="stat-block"><span>{formatNumber(overview.noiseSpeeches)}</span><label>Procedural noise speeches</label></div>
        <div className="stat-block"><span>{formatNumber(sessions.totalSessions)}</span><label>Unique sitting days</label></div>
      </section>

      <section className="story-grid">
        <article className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Published JSON surfaces</div>
            <h2>Current frontend-ready files in `public/data/`</h2>
          </div>
          <div className="file-card-grid">
            {FILES.map((file) => (
              <article key={file.path} className="file-card">
                <div className="section-heading__eyebrow">Static asset</div>
                <h3>{file.title}</h3>
                <p>{file.desc}</p>
                <code>{file.path}</code>
              </article>
            ))}
          </div>
        </article>

        <article className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Coverage signals</div>
            <h2>Quick checks for what the dataset contains</h2>
          </div>
          <div className="rule-list">
            <p>{Object.keys(overview.languages || {}).join(', ')} language buckets are currently exposed in the summary layer.</p>
            <p>{formatNumber(speeches.length)} speech records are searchable from the static explorer route.</p>
            <p>{formatNumber(topicCoverage.length)} of the most visible macro-topics are surfaced below as a quick sanity check.</p>
            <p>The sessions summary currently spans {overview.yearsCovered?.[0]} to {overview.yearsCovered?.[1]}.</p>
          </div>
          <div className="speaker-chip-row">
            {topicCoverage.map((topic) => <span key={topic.topicKey} className="chip">MT-{topic.topicId} · {formatNumber(topic.totalSpeeches)}</span>)}
          </div>
        </article>
      </section>

      <section className="editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Session activity</div>
          <h2>Peak month in each year of the summary file</h2>
          <p>This gives the next developer a fast way to spot gaps, seasonal spikes, and potential anomalies before touching any visualization code.</p>
        </div>
        <div className="ranked-bar-list">
          {monthlyPeaks.map((entry) => {
            const max = Math.max(...monthlyPeaks.map((item) => item.count), 1);
            return (
              <div key={`${entry.year}-${entry.month}`} className="ranked-bar-row">
                <div className="ranked-bar-row__label">
                  <strong>{entry.year}</strong>
                  <span>Peak month {entry.month}</span>
                </div>
                <div className="ranked-bar-row__track">
                  <div className="ranked-bar-row__fill ranked-bar-row__fill--alt" style={{ width: `${(entry.count / max) * 100}%` }} />
                </div>
                <div className="ranked-bar-row__value">{formatNumber(entry.count)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
