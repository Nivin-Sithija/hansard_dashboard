import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useManyJsonResources } from '../lib/data/hooks';
import { formatNumber } from '../lib/format';
import { STORY_EVENTS } from '../lib/topics';
import { D3TimelineChart } from '../components/charts/D3TimelineChart';
import { TopicCard } from '../components/topic/TopicCard';
import { useUiLanguage } from '../lib/uiLanguage';

const URLS = ['/data/overview_summary.json', '/data/topic_metadata.json', '/data/macro_topic_temporal_evolution_chart_data.json'];

export default function OverviewPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useManyJsonResources(URLS);
  const { t, localizeLanguageLabel } = useUiLanguage();

  const topicList = useMemo(() => {
    if (!data['/data/topic_metadata.json']) return [];
    return Object.values(data['/data/topic_metadata.json']).filter((topic) => topic.topicId != null).sort((left, right) => right.totalSpeeches - left.totalSpeeches);
  }, [data]);

  if (loading) return <div className="page-state">{t('loadingOverview')}</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  const summary = data['/data/overview_summary.json'];
  const temporal = data['/data/macro_topic_temporal_evolution_chart_data.json'];
  const featuredTopics = summary.topTopics.slice(0, 4);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <div className="hero-panel__label">{t('overviewHeroEyebrow')}</div>
          <h1>Explore how Sri Lanka&apos;s Parliament shifted its agenda across Sinhala, Tamil, and English debates from 2017 to 2026.</h1>
          <p>This explorer turns 19,553 modeled speeches into 30 macro-topics, revealing how crisis, security, institutions, and daily governance moved through Parliament over a politically turbulent decade.</p>
          <div className="hero-panel__actions">
            <Link className="button button--primary" to="/topics">{t('openTopicAtlas')}</Link>
            <Link className="button button--secondary" to="/speeches">{t('browseSpeeches')}</Link>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stat-block"><span>{formatNumber(summary.speechesAnalyzed)}</span><label>{t('speechesAnalyzed')}</label></div>
        <div className="stat-block"><span>{summary.macroTopicCount}</span><label>{t('macroTopics')}</label></div>
        <div className="stat-block"><span>{summary.yearsCovered[0]}-{summary.yearsCovered[1]}</span><label>{t('yearsCovered')}</label></div>
        <div className="stat-block"><span>{Object.keys(summary.languages).map((language) => localizeLanguageLabel(language)).join(' | ')}</span><label>{t('languages')}</label></div>
      </section>

      <section className="story-grid">
        <div className="story-grid__main editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Signal over time</div>
            <h2>Major national events appear in the topic timeline without supervised event labels.</h2>
            <p>The strongest macro-topics flare around recognizable political moments, turning the model output into an interpretable civic timeline.</p>
          </div>
          <D3TimelineChart
            temporalData={temporal}
            selectedTopicKeys={summary.topTopics.map((topic) => String(topic.topicId)).slice(0, 4)}
            onToggleTopic={(topicId) => navigate(`/timeline?topic=${topicId}`)}
            height={320}
            showEventLabels={false}
          />
          <div className="overview-topic-legend" aria-label="Featured macro-topics in the overview timeline">
            {featuredTopics.map((topic) => (
              <button
                key={topic.topicKey}
                type="button"
                className="overview-topic-legend__item"
                onClick={() => navigate(`/timeline?topic=${topic.topicKey}`)}
              >
                <span className="overview-topic-legend__swatch" style={{ background: `rgb(${topic.color.join(', ')})` }} />
                <span>MT-{topic.topicId} - {topic.topicLabel}</span>
              </button>
            ))}
          </div>
          <div className="overview-event-legend">
            {STORY_EVENTS.map((event) => (
              <div key={event.year} className="overview-event-legend__item">
                <strong>{event.year}</strong>
                <span>{event.title}</span>
              </div>
            ))}
          </div>
          <p className="overview-event-legend__note">Each starter moment is expanded with source-backed evidence on the timeline route.</p>
        </div>
        <div className="story-grid__aside event-list editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Story mode</div>
            <h2>Four moments to start with</h2>
          </div>
          {STORY_EVENTS.map((event) => (
            <article key={event.year} className="event-card">
              <div className="event-card__year">{event.year}</div>
              <h3>{event.title}</h3>
              <p>{event.blurb}</p>
              <Link className="event-card__cta" to="/timeline">View sourced timeline evidence</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Topic entry points</div>
          <h2>Start with the macro-topics that dominate the debate record.</h2>
        </div>
        <div className="topic-card-grid">
          {topicList.slice(0, 6).map((topic) => <TopicCard key={topic.topicKey} topic={topic} onSelect={() => navigate(`/topics?topic=${topic.topicKey}`)} />)}
        </div>
      </section>

      <section className="editorial-panel editorial-panel--muted methodology-band">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Read the signals carefully</div>
          <h2>What the model is showing</h2>
        </div>
        <div className="methodology-band__grid">
          <div><h3>Macro-topic</h3><p>A broader discourse family built by aggregating the model&apos;s finer micro-topic clusters into a public-facing thematic layer.</p></div>
          <div><h3>Procedural noise</h3><p>Short or formulaic parliamentary interventions that the density-based model excludes from substantive topic clusters.</p></div>
          <div><h3>Multilinguality</h3><p>Topics often cut across Sinhala, Tamil, and English, helping show when Parliament clusters by theme rather than script.</p></div>
        </div>
      </section>
    </div>
  );
}
