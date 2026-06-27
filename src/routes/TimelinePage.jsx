import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useManyJsonResources } from '../lib/data/hooks';
import { D3TimelineChart } from '../components/charts/D3TimelineChart';
import { formatDateLabel } from '../lib/format';
import { STORY_EVENTS } from '../lib/topics';
import { useUiLanguage } from '../lib/uiLanguage';

const URLS = [
  '/data/macro_topic_temporal_evolution_chart_data.json',
  '/data/topic_metadata.json',
  '/data/topic_event_links.json',
  '/data/event_sources.json',
];

const STORY_EVENT_MATCH = {
  2019: 'easter-sunday-attacks-2019',
  2020: 'covid-constitutional-shift-2020',
  2021: 'fertilizer-ban-crisis-2021',
  2022: 'aragalaya-economic-crisis-2022',
};

function useSeededTopic() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const topic = params.get('topic');
  return topic ? [topic] : [];
}

function collectTopicEvidence(selectedTopics, topicEvidence) {
  const topicsToRead = selectedTopics.length ? selectedTopics : Object.keys(topicEvidence);
  const eventMap = new Map();
  const resourceMap = new Map();

  topicsToRead.forEach((topicKey) => {
    const bucket = topicEvidence[topicKey];
    if (!bucket) return;

    bucket.relatedEvents?.forEach((event) => {
      if (!eventMap.has(event.id)) eventMap.set(event.id, event);
    });

    bucket.resources?.forEach((resource) => {
      if (resource.verified && resource.type !== 'youtube_search' && !resourceMap.has(resource.id)) {
        resourceMap.set(resource.id, resource);
      }
    });
  });

  const events = Array.from(eventMap.values()).sort((left, right) => formatDateLabel(left).localeCompare(formatDateLabel(right)));
  const resources = Array.from(resourceMap.values());
  return { events, resources };
}

export default function TimelinePage() {
  const seededTopics = useSeededTopic();
  const { data, loading, error } = useManyJsonResources(URLS);
  const { t } = useUiLanguage();
  const [selectedTopics, setSelectedTopics] = useState(seededTopics);

  const temporal = data['/data/macro_topic_temporal_evolution_chart_data.json'];
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);
  const topicEvidence = useMemo(() => data['/data/topic_event_links.json'] ?? {}, [data]);
  const eventSources = useMemo(() => data['/data/event_sources.json'] ?? {}, [data]);
  const topicOptions = useMemo(
    () => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((left, right) => right.totalSpeeches - left.totalSpeeches),
    [topicMetadata],
  );
  const defaultTopicKeys = useMemo(() => topicOptions.slice(0, 4).map((topic) => String(topic.topicKey)), [topicOptions]);
  const visibleSelectedTopics = selectedTopics.length ? selectedTopics : (seededTopics.length ? seededTopics : defaultTopicKeys);

  const toggleTopic = (topicKey) => {
    setSelectedTopics((current) => {
      const base = current.length ? current : (seededTopics.length ? seededTopics : defaultTopicKeys);
      return base.includes(topicKey) ? base.filter((value) => value !== topicKey) : [...base, topicKey].slice(-4);
    });
  };

  const evidence = useMemo(() => collectTopicEvidence(visibleSelectedTopics, topicEvidence), [topicEvidence, visibleSelectedTopics]);
  const visibleEvents = useMemo(() => {
    if (visibleSelectedTopics.length) return evidence.events;
    const matched = STORY_EVENTS.map((event) => evidence.events.find((candidate) => candidate.id === STORY_EVENT_MATCH[event.year])).filter(Boolean);
    return matched.length ? matched : evidence.events.slice(0, 4);
  }, [evidence.events, visibleSelectedTopics.length]);
  const visibleResources = useMemo(() => {
    if (visibleSelectedTopics.length) return evidence.resources;

    const ids = new Set(visibleEvents.flatMap((event) => event.sourceIds || []));
    return Array.from(ids).map((sourceId) => eventSources[sourceId]).filter(Boolean);
  }, [evidence.resources, eventSources, visibleEvents, visibleSelectedTopics.length]);

  if (loading) return <div className="page-state">{t('loadingTimeline')}</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Timeline</div>
          <h1>Watch parliamentary attention tilt as crises, security shocks, and institutional fights move across the decade.</h1>
          <p>Select up to four macro-topics at a time to compare their relative visibility against national event markers and source-backed evidence.</p>
        </div>
      </section>

      <section className="editorial-panel">
        <div className="chip-grid">
          {topicOptions.slice(0, 18).map((topic) => {
            const isActive = visibleSelectedTopics.includes(topic.topicKey);
            return (
              <button
                key={topic.topicKey}
                type="button"
                className={`chip${isActive ? ' is-active' : ''}`}
                onClick={() => toggleTopic(topic.topicKey)}
                style={isActive ? { background: `rgb(${topic.color.join(', ')})`, borderColor: `rgb(${topic.color.join(', ')})`, color: '#fff' } : undefined}
              >
                MT-{topic.topicId} - {topic.topicLabel}
              </button>
            );
          })}
        </div>
        <p className="timeline-chart-note">{t('timelineNote')}</p>
        <D3TimelineChart temporalData={temporal} selectedTopicKeys={visibleSelectedTopics} onToggleTopic={toggleTopic} height={560} />
      </section>

      <section className="story-grid">
        {STORY_EVENTS.map((story) => {
          const matched = visibleEvents.find((event) => event.id === STORY_EVENT_MATCH[story.year]);
          return (
            <article key={story.year} className="editorial-panel event-card event-card--wide">
              <div className="event-card__year">{story.year}</div>
              <h2>{matched?.title || story.title}</h2>
              <p>{matched?.summary || story.blurb}</p>
              {matched && (
                <>
                  <p>{matched.whyLinked}</p>
                  <div className="event-card__sources">
                    {matched.sourceIds.map((sourceId) => {
                      const source = eventSources[sourceId];
                      if (!source) return null;
                      return (
                        <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">
                          {source.publisher}
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </section>

      <section className="story-grid">
        <div className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Related events</div>
            <h2>{visibleSelectedTopics.length ? 'Evidence linked to the selected topics' : 'Start with the strongest source-backed event links'}</h2>
          </div>
          <div className="timeline-evidence-list">
            {visibleEvents.length ? visibleEvents.map((event) => (
              <article key={event.id} className="timeline-evidence-card">
                <div className="detail-panel__resource-meta">
                  <span>Event</span>
                  <strong>{formatDateLabel(event)}</strong>
                </div>
                <h3>{event.title}</h3>
                <p>{event.summary}</p>
                <p>{event.whyLinked}</p>
                <div className="event-card__sources">
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
            )) : <div className="page-state">No event evidence is available for the current selection.</div>}
          </div>
        </div>

        <div className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Supporting resources</div>
            <h2>{visibleSelectedTopics.length ? 'Verified links that help interpret the selected time pattern' : 'Verified links behind the starter event story'}</h2>
          </div>
          <div className="detail-panel__resource-list">
            {visibleResources.length ? visibleResources.slice(0, 8).map((resource) => (
              <a key={resource.id} className={`detail-panel__resource-card is-${resource.type === 'official' ? 'official' : 'default'}`} href={resource.url} target="_blank" rel="noreferrer">
                <div className="detail-panel__resource-meta">
                  <span>{resource.publisher}</span>
                  <strong>{formatDateLabel(resource)}</strong>
                </div>
                <h4>{resource.title}</h4>
                <p>{resource.whyRelevant || resource.summary}</p>
              </a>
            )) : <div className="page-state">Select a topic to see its supporting evidence links.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
