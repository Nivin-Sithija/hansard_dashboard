import React from 'react';
import { D3KeywordBars } from '../charts/D3KeywordBars';
import { D3LanguageMixChart } from '../charts/D3LanguageMixChart';
import { formatNumber, rgb } from '../../lib/format';

export function TopicDetailPanel({ topic, speech }) {
  if (!topic) {
    return (
      <section className="detail-panel">
        <div className="detail-panel__empty">
          <h3>Select a topic or speech</h3>
          <p>Use the atlas to choose a speech cluster, then inspect keywords, language composition, and representative examples.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-panel">
      <div className="detail-panel__header">
        <div className="detail-panel__pill" style={{ background: `${rgb(topic.color)}22`, color: rgb(topic.color) }}>
          {topic.topicId == null ? 'Noise / procedural' : `Macro-topic ${topic.topicId}`}
        </div>
        <h3>{topic.topicLabel}</h3>
        <p>{formatNumber(topic.totalSpeeches)} speeches · peak in {topic.peakYear ?? '—'}</p>
      </div>
      {speech && (
        <article className="detail-panel__speech-preview">
          <div className="detail-panel__speech-meta">{speech.speaker} · {speech.year} · {speech.language}</div>
          <p>{speech.excerpt}</p>
        </article>
      )}
      <div className="detail-panel__section">
        <div className="detail-panel__section-title">Signature vocabulary</div>
        <D3KeywordBars keywords={topic.keywords} />
      </div>
      <div className="detail-panel__section">
        <div className="detail-panel__section-title">Language mix</div>
        <D3LanguageMixChart counts={topic.languageCounts} />
      </div>
      <div className="detail-panel__section">
        <div className="detail-panel__section-title">Top speakers</div>
        <div className="detail-panel__speaker-list">
          {topic.topSpeakers.length ? topic.topSpeakers.map((item) => (
            <div key={`${item.speaker}-${item.count}`} className="detail-panel__speaker-row">
              <span>{item.speaker}</span>
              <strong>{formatNumber(item.count)}</strong>
            </div>
          )) : <p className="detail-panel__muted">Speaker totals were not preserved for this topic bucket.</p>}
        </div>
      </div>
      <div className="detail-panel__section">
        <div className="detail-panel__section-title">Representative speeches</div>
        <div className="detail-panel__sample-list">
          {topic.sampleSpeeches.map((sample) => (
            <article key={sample.speechId} className="detail-panel__sample-card">
              <div className="detail-panel__speech-meta">{sample.speaker} · {sample.date} · {sample.language}</div>
              <p>{sample.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
