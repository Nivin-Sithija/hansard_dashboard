import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useManyJsonResources } from '../lib/data/hooks';
import { D3TimelineChart } from '../components/charts/D3TimelineChart';
import { STORY_EVENTS } from '../lib/topics';

const URLS = ['/data/macro_topic_temporal_evolution_chart_data.json', '/data/topic_metadata.json'];

function useSeededTopic() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const topic = params.get('topic');
  return topic ? [topic] : [];
}

export default function TimelinePage() {
  const seededTopics = useSeededTopic();
  const { data, loading, error } = useManyJsonResources(URLS);
  const [selectedTopics, setSelectedTopics] = useState(seededTopics);

  const temporal = data['/data/macro_topic_temporal_evolution_chart_data.json'];
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);
  const topicOptions = useMemo(() => Object.values(topicMetadata).filter((topic) => topic.topicId != null).sort((left, right) => right.totalSpeeches - left.totalSpeeches), [topicMetadata]);

  const toggleTopic = (topicKey) => {
    setSelectedTopics((current) => (current.includes(topicKey) ? current.filter((value) => value !== topicKey) : [...current, topicKey].slice(-4)));
  };

  if (loading) return <div className="page-state">Loading timeline…</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Timeline</div>
          <h1>Watch parliamentary attention tilt as crises, security shocks, and institutional fights move across the decade.</h1>
          <p>Select up to four macro-topics at a time to compare their relative visibility against national event markers.</p>
        </div>
      </section>

      <section className="editorial-panel">
        <div className="chip-grid">
          {topicOptions.slice(0, 18).map((topic) => <button key={topic.topicKey} type="button" className={`chip${selectedTopics.includes(topic.topicKey) ? ' is-active' : ''}`} onClick={() => toggleTopic(topic.topicKey)}>MT-{topic.topicId}</button>)}
        </div>
        <D3TimelineChart temporalData={temporal} selectedTopicKeys={selectedTopics} onToggleTopic={toggleTopic} height={500} />
      </section>

      <section className="story-grid">
        {STORY_EVENTS.map((event) => (
          <article key={event.year} className="editorial-panel event-card event-card--wide">
            <div className="event-card__year">{event.year}</div>
            <h2>{event.title}</h2>
            <p>{event.blurb}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
