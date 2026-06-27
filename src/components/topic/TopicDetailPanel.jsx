import React from 'react';
import { D3KeywordBars } from '../charts/D3KeywordBars';
import { D3LanguageMixChart } from '../charts/D3LanguageMixChart';
import { formatDateLabel, formatNumber, rgb } from '../../lib/format';
import { getTextLangProps } from '../../lib/language';

function sourceTone(type) {
  if (type === 'official') return 'official';
  if (type === 'youtube_search') return 'youtube';
  return 'default';
}

export function TopicDetailPanel({ topic, speech, topicEvidence, eventSources = {}, isStarter = false }) {
  if (!topic) {
    return (
      <section className="detail-panel">
        <div className="detail-panel__empty">
          <h3>Select a topic or speech</h3>
          <p>Use the atlas to choose a speech cluster, then inspect keywords, language composition, representative examples.</p>
        </div>
      </section>
    );
  }

  const verifiedResources = (topicEvidence?.resources || []).filter((resource) => resource.verified && resource.type !== 'youtube_search');
  const relatedEvents = topicEvidence?.relatedEvents || [];

  return (
    <section className="detail-panel">
      <div className="detail-panel__header">
        <div className="detail-panel__pill" style={{ background: `${rgb(topic.color)}22`, color: rgb(topic.color) }}>
          {topic.topicId == null ? 'Noise / procedural' : `Macro-topic ${topic.topicId}`}
        </div>
        <h3>{topic.topicLabel}</h3>
        <p>{formatNumber(topic.totalSpeeches)} speeches | peak in {topic.peakYear ?? 'n/a'}</p>
        {isStarter && <p className="detail-panel__starter-note">Starter topic loaded by default so the atlas opens with evidence instead of an empty panel.</p>}
      </div>
      {speech && (
        <article className="detail-panel__speech-preview">
          <div className="detail-panel__speech-meta">
            <span {...getTextLangProps(speech.speaker)}>{speech.speaker}</span>
            {' | '}
            <span>{speech.year}</span>
            {' | '}
            <span>{speech.language}</span>
          </div>
          <p {...getTextLangProps(speech.excerpt)}>{speech.excerpt}</p>
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
              <span {...getTextLangProps(item.speaker)}>{item.speaker}</span>
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
              <div className="detail-panel__speech-meta">
                <span {...getTextLangProps(sample.speaker)}>{sample.speaker}</span>
                {' | '}
                <span>{sample.date}</span>
                {' | '}
                <span>{sample.language}</span>
              </div>
              <p {...getTextLangProps(sample.excerpt)}>{sample.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
      {topic.topicKey !== 'noise' && (
        <div className="detail-panel__section">
          <div className="detail-panel__section-title">Related resources</div>
          {verifiedResources.length ? (
            <div className="detail-panel__resource-list">
              {verifiedResources.slice(0, 6).map((resource) => (
                <a
                  key={resource.id}
                  className={`detail-panel__resource-card is-${sourceTone(resource.type)}`}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="detail-panel__resource-meta">
                    <span>{resource.type === 'youtube_search' ? 'YouTube search' : resource.publisher}</span>
                    <strong>{formatDateLabel(resource)}</strong>
                  </div>
                  <h4>{resource.title}</h4>
                  <p>{resource.whyRelevant || resource.summary}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="detail-panel__muted">Evidence links coming soon for this topic.</p>
          )}
        </div>
      )}
      {topic.topicKey !== 'noise' && !!relatedEvents.length && (
        <div className="detail-panel__section">
          <div className="detail-panel__section-title">Related events</div>
          <div className="detail-panel__event-list">
            {relatedEvents.map((event) => (
              <article key={event.id} className="detail-panel__event-card">
                <div className="detail-panel__resource-meta">
                  <span>Event</span>
                  <strong>{formatDateLabel(event)}</strong>
                </div>
                <h4>{event.title}</h4>
                <p>{event.summary}</p>
                <p>{event.whyLinked}</p>
                <div className="detail-panel__event-links">
                  {event.sourceIds.map((sourceId) => {
                    const source = eventSources[sourceId];
                    if (!source) return null;
                    return (
                      <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">
                        {source.publisher}
                      </a>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
