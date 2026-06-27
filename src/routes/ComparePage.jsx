import React, { useMemo, useState } from 'react';
import { useManyJsonResources } from '../lib/data/hooks';
import { formatNumber } from '../lib/format';

const URLS = [
  '/data/final_unique_speakers.json',
  '/data/speaker_topic_counts_by_macro_topic.json',
  '/data/topic_metadata.json',
];

function buildSpeakerMatrix(speakerTopicCounts) {
  const matrix = {};

  Object.entries(speakerTopicCounts.all_speakers_by_topic || {}).forEach(([topicKey, rows]) => {
    const topicId = topicKey.replace('Macro-Topic ', '');
    rows.forEach(({ speaker, count }) => {
      if (!matrix[speaker]) matrix[speaker] = {};
      matrix[speaker][topicId] = (matrix[speaker][topicId] || 0) + count;
    });
  });

  return matrix;
}

function topicEntriesForSpeaker(matrix, topicMetadata, speakerName) {
  const bucket = matrix[speakerName] || {};
  return Object.entries(bucket)
    .map(([topicId, count]) => ({
      topicId,
      count,
      topicLabel: topicMetadata[topicId]?.topicLabel || `Macro-Topic ${topicId}`,
      color: topicMetadata[topicId]?.color ? `rgb(${topicMetadata[topicId].color.join(',')})` : 'rgb(15, 118, 110)',
    }))
    .sort((left, right) => right.count - left.count);
}

export default function ComparePage() {
  const { data, loading, error } = useManyJsonResources(URLS);
  const [speakerA, setSpeakerA] = useState('');
  const [speakerB, setSpeakerB] = useState('');
  const [topicA, setTopicA] = useState('0');
  const [topicB, setTopicB] = useState('1');

  const speakers = useMemo(() => data['/data/final_unique_speakers.json'] ?? [], [data]);
  const speakerTopicCounts = useMemo(() => data['/data/speaker_topic_counts_by_macro_topic.json'] ?? {}, [data]);
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);

  const speakerMatrix = useMemo(() => buildSpeakerMatrix(speakerTopicCounts), [speakerTopicCounts]);
  const rankedSpeakers = useMemo(() => [...speakers].sort((left, right) => (right.total_speeches || 0) - (left.total_speeches || 0)), [speakers]);
  const topicOptions = useMemo(() => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((left, right) => left.topicId - right.topicId), [topicMetadata]);

  const effectiveSpeakerA = speakerA || rankedSpeakers[0]?.name || '';
  const effectiveSpeakerB = speakerB || rankedSpeakers[1]?.name || rankedSpeakers[0]?.name || '';
  const effectiveTopicA = topicMetadata[topicA] ? topicA : String(topicOptions[0]?.topicId ?? '0');
  const effectiveTopicB = topicMetadata[topicB] ? topicB : String(topicOptions[1]?.topicId ?? topicOptions[0]?.topicId ?? '1');

  const speakerAEntries = useMemo(() => topicEntriesForSpeaker(speakerMatrix, topicMetadata, effectiveSpeakerA), [effectiveSpeakerA, speakerMatrix, topicMetadata]);
  const speakerBEntries = useMemo(() => topicEntriesForSpeaker(speakerMatrix, topicMetadata, effectiveSpeakerB), [effectiveSpeakerB, speakerMatrix, topicMetadata]);

  const speakerComparison = useMemo(() => {
    const combinedTopicIds = new Set([...speakerAEntries.map((entry) => entry.topicId), ...speakerBEntries.map((entry) => entry.topicId)]);
    return Array.from(combinedTopicIds)
      .map((topicId) => ({
        topicId,
        topicLabel: topicMetadata[topicId]?.topicLabel || `Macro-Topic ${topicId}`,
        countA: speakerMatrix[effectiveSpeakerA]?.[topicId] || 0,
        countB: speakerMatrix[effectiveSpeakerB]?.[topicId] || 0,
      }))
      .sort((left, right) => (right.countA + right.countB) - (left.countA + left.countB))
      .slice(0, 10);
  }, [effectiveSpeakerA, effectiveSpeakerB, speakerAEntries, speakerBEntries, speakerMatrix, topicMetadata]);

  const heatmapSpeakers = useMemo(() => rankedSpeakers.slice(0, 12), [rankedSpeakers]);
  const heatmapTopics = useMemo(() => topicOptions.slice(0, 10), [topicOptions]);
  const heatmapMax = useMemo(() => {
    let max = 1;
    heatmapSpeakers.forEach((speaker) => {
      heatmapTopics.forEach((topic) => {
        max = Math.max(max, speakerMatrix[speaker.name]?.[String(topic.topicId)] || 0);
      });
    });
    return max;
  }, [heatmapSpeakers, heatmapTopics, speakerMatrix]);

  const selectedTopicA = topicMetadata[effectiveTopicA];
  const selectedTopicB = topicMetadata[effectiveTopicB];

  if (loading) return <div className="page-state">Loading comparisons...</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Compare</div>
          <h1>Put speakers and macro-topics side by side so differences in agenda become visible instead of anecdotal.</h1>
          <p>This page turns the clustered corpus into a comparative reading interface for people, themes, and concentration patterns.</p>
        </div>
      </section>

      <section className="story-grid">
        <div className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Speaker vs speaker</div>
            <h2>Compare two parliamentary topic footprints</h2>
            <p>Bars compare how many speeches each selected speaker contributes inside the same macro-topic, making concentration differences visible without leaving the corpus view.</p>
          </div>
          <div className="compare-picker-row">
            <label><span>Speaker A</span><select value={effectiveSpeakerA} onChange={(event) => setSpeakerA(event.target.value)}>{rankedSpeakers.map((speaker) => <option key={speaker.name} value={speaker.name}>{speaker.manthriName || speaker.name}</option>)}</select></label>
            <label><span>Speaker B</span><select value={effectiveSpeakerB} onChange={(event) => setSpeakerB(event.target.value)}>{rankedSpeakers.map((speaker) => <option key={speaker.name} value={speaker.name}>{speaker.manthriName || speaker.name}</option>)}</select></label>
          </div>
          <div className="compare-dual-stats">
            <div className="compare-dual-stats__card"><strong>{formatNumber((speakers.find((speaker) => speaker.name === effectiveSpeakerA)?.total_speeches) || 0)}</strong><span>{effectiveSpeakerA}</span></div>
            <div className="compare-dual-stats__card"><strong>{formatNumber((speakers.find((speaker) => speaker.name === effectiveSpeakerB)?.total_speeches) || 0)}</strong><span>{effectiveSpeakerB}</span></div>
          </div>
          <div className="ranked-bar-list">
            {speakerComparison.map((entry) => {
              const total = Math.max(entry.countA, entry.countB, 1);
              return (
                <div key={entry.topicId} className="compare-bar-row">
                  <div className="compare-bar-row__header">
                    <strong>MT-{entry.topicId}</strong>
                    <span>{entry.topicLabel}</span>
                  </div>
                  <div className="compare-bar-row__tracks">
                    <div>
                      <div className="compare-bar-row__label">A</div>
                      <div className="ranked-bar-row__track"><div className="ranked-bar-row__fill" style={{ width: `${(entry.countA / total) * 100}%` }} /></div>
                    </div>
                    <div>
                      <div className="compare-bar-row__label compare-bar-row__label--alt">B</div>
                      <div className="ranked-bar-row__track"><div className="ranked-bar-row__fill ranked-bar-row__fill--alt" style={{ width: `${(entry.countB / total) * 100}%` }} /></div>
                    </div>
                  </div>
                  <div className="compare-bar-row__values">{formatNumber(entry.countA)} / {formatNumber(entry.countB)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Topic vs topic</div>
            <h2>Read two macro-topics as competing debate frames</h2>
          </div>
          <div className="compare-picker-row compare-picker-row--tight">
            <label><span>Topic A</span><select value={effectiveTopicA} onChange={(event) => setTopicA(event.target.value)}>{topicOptions.map((topic) => <option key={topic.topicId} value={topic.topicId}>MT-{topic.topicId} · {topic.topicLabel}</option>)}</select></label>
            <label><span>Topic B</span><select value={effectiveTopicB} onChange={(event) => setTopicB(event.target.value)}>{topicOptions.map((topic) => <option key={topic.topicId} value={topic.topicId}>MT-{topic.topicId} · {topic.topicLabel}</option>)}</select></label>
          </div>
          <div className="topic-compare-stack">
            {[selectedTopicA, selectedTopicB].filter(Boolean).map((topic, index) => (
              <article key={topic.topicKey} className="topic-compare-card" style={{ borderLeftColor: `rgb(${topic.color.join(',')})` }}>
                <div className="section-heading__eyebrow">{index === 0 ? 'Topic A' : 'Topic B'}</div>
                <h3>MT-{topic.topicId} · {topic.topicLabel}</h3>
                <p>{formatNumber(topic.totalSpeeches)} clustered speeches, peaking in {topic.peakYear} with {formatNumber(topic.peakCount || 0)} speeches.</p>
                <div className="speaker-chip-row">
                  {(topic.keywords || []).slice(0, 8).map((keyword) => <span key={keyword} className="chip">{keyword}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Speaker x topic surface</div>
          <h2>Where attention clusters most densely among the most active speakers</h2>
          <p>Darker cells indicate more speeches within a topic for that speaker, making strong affinities and broad portfolios immediately visible.</p>
        </div>
        <p className="scroll-hint">Swipe sideways on smaller screens to see every macro-topic column in the matrix.</p>
        <div className="heatmap-table-wrap">
          <div className="heatmap-table" style={{ gridTemplateColumns: `minmax(180px, 220px) repeat(${heatmapTopics.length}, minmax(42px, 1fr))` }}>
            <div className="heatmap-table__corner">Speaker</div>
            {heatmapTopics.map((topic) => <div key={topic.topicId} className="heatmap-table__topic">MT-{topic.topicId}</div>)}
            {heatmapSpeakers.map((speaker) => (
              <React.Fragment key={speaker.name}>
                <div className="heatmap-table__speaker">{speaker.manthriName || speaker.name}</div>
                {heatmapTopics.map((topic) => {
                  const value = speakerMatrix[speaker.name]?.[String(topic.topicId)] || 0;
                  const intensity = value ? 0.12 + (value / heatmapMax) * 0.88 : 0.04;
                  return (
                    <div
                      key={`${speaker.name}-${topic.topicId}`}
                      className="heatmap-table__cell"
                      title={`${speaker.manthriName || speaker.name} / MT-${topic.topicId}: ${value}`}
                      style={{ background: `rgba(15, 118, 110, ${intensity.toFixed(2)})` }}
                    >
                      {value ? formatNumber(value) : ''}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
