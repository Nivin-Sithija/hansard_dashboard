import React, { useMemo, useState } from 'react';
import { useManyJsonResources } from '../lib/data/hooks';
import { formatNumber } from '../lib/format';

const URLS = [
  '/data/final_unique_speakers.json',
  '/data/speaker_speeches_per_year_by_topic.json',
  '/data/topic_metadata.json',
];

function buildSpeakerProfiles(speakers, speechByTopic) {
  const profiles = new Map();

  speakers.forEach((speaker) => {
    profiles.set(speaker.name, {
      name: speaker.name,
      englishName: speaker.manthriName || speaker.aliases?.[0] || null,
      aliases: speaker.aliases || [],
      totalSpeeches: speaker.total_speeches || 0,
      imagePath: speaker.localPath || null,
      byTopic: {},
      byYear: {},
    });
  });

  Object.entries(speechByTopic.by_topic || {}).forEach(([topicKey, topicBucket]) => {
    Object.entries(topicBucket.speakers || {}).forEach(([speakerName, stats]) => {
      if (!profiles.has(speakerName)) {
        profiles.set(speakerName, {
          name: speakerName,
          englishName: null,
          aliases: [],
          totalSpeeches: 0,
          imagePath: null,
          byTopic: {},
          byYear: {},
        });
      }

      const profile = profiles.get(speakerName);
      profile.totalSpeeches = Math.max(profile.totalSpeeches, stats.total || 0);
      profile.byTopic[topicKey] = (profile.byTopic[topicKey] || 0) + (stats.total || 0);

      Object.entries(stats.by_year || {}).forEach(([year, count]) => {
        profile.byYear[year] = (profile.byYear[year] || 0) + count;
      });
    });
  });

  return Array.from(profiles.values()).sort((left, right) => right.totalSpeeches - left.totalSpeeches);
}

export default function SpeakersPage() {
  const { data, loading, error } = useManyJsonResources(URLS);
  const [query, setQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  const speakers = useMemo(() => data['/data/final_unique_speakers.json'] ?? [], [data]);
  const speechByTopic = useMemo(() => data['/data/speaker_speeches_per_year_by_topic.json'] ?? { by_topic: {} }, [data]);
  const topicMetadata = useMemo(() => data['/data/topic_metadata.json'] ?? {}, [data]);

  const speakerProfiles = useMemo(() => buildSpeakerProfiles(speakers, speechByTopic), [speakers, speechByTopic]);

  const filteredSpeakers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return speakerProfiles;

    return speakerProfiles.filter((speaker) => {
      const haystack = [speaker.name, speaker.englishName, ...(speaker.aliases || [])].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, speakerProfiles]);

  const effectiveSelectedSpeaker = useMemo(() => {
    if (selectedSpeaker && filteredSpeakers.some((speaker) => speaker.name === selectedSpeaker)) return selectedSpeaker;
    if (!selectedSpeaker && filteredSpeakers.length) return filteredSpeakers[0].name;
    if (selectedSpeaker && speakerProfiles.some((speaker) => speaker.name === selectedSpeaker)) return selectedSpeaker;
    return speakerProfiles[0]?.name || '';
  }, [filteredSpeakers, selectedSpeaker, speakerProfiles]);

  const activeSpeaker = useMemo(
    () => speakerProfiles.find((speaker) => speaker.name === effectiveSelectedSpeaker) || null,
    [effectiveSelectedSpeaker, speakerProfiles],
  );

  const topTopics = useMemo(() => {
    if (!activeSpeaker) return [];

    return Object.entries(activeSpeaker.byTopic)
      .map(([topicKey, count]) => {
        const topicId = topicKey.replace('Macro-Topic ', '');
        const topic = topicMetadata[topicId];
        return {
          topicId,
          topicLabel: topic?.topicLabel || topicKey,
          count,
          color: topic?.color ? `rgb(${topic.color.join(',')})` : 'rgb(124, 45, 18)',
        };
      })
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);
  }, [activeSpeaker, topicMetadata]);

  const yearlyActivity = useMemo(() => {
    if (!activeSpeaker) return [];

    return Object.entries(activeSpeaker.byYear)
      .sort((left, right) => Number(left[0]) - Number(right[0]))
      .map(([year, count]) => ({ year, count }));
  }, [activeSpeaker]);

  const maxTopicCount = Math.max(...topTopics.map((topic) => topic.count), 1);
  const maxYearCount = Math.max(...yearlyActivity.map((entry) => entry.count), 1);

  if (loading) return <div className="page-state">Loading speakers...</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Speakers</div>
          <h1>Follow how individual parliamentarians move across macro-topics instead of reading the corpus as a faceless aggregate.</h1>
          <p>The directory combines cleaned speaker identities, multilingual aliases, and topic-level participation counts from the clustered debate record.</p>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stat-block"><span>{formatNumber(speakerProfiles.length)}</span><label>Named speakers</label></div>
        <div className="stat-block"><span>{formatNumber(speakerProfiles.reduce((sum, speaker) => sum + speaker.totalSpeeches, 0))}</span><label>Attributed clustered speeches</label></div>
        <div className="stat-block"><span>{formatNumber(filteredSpeakers.length)}</span><label>Directory matches</label></div>
        <div className="stat-block"><span>{activeSpeaker ? formatNumber(Object.keys(activeSpeaker.byTopic).length) : '0'}</span><label>Topics for selected speaker</label></div>
      </section>

      <section className="speaker-layout">
        <aside className="editorial-panel speaker-directory-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Directory</div>
            <h2>Search by Sinhala, Tamil, or English names.</h2>
          </div>
          <label className="inline-search">
            <span>Find a speaker</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any speaker alias" />
          </label>
          <div className="speaker-directory-list">
            {filteredSpeakers.map((speaker) => (
              <button
                key={speaker.name}
                type="button"
                className={`speaker-directory-row${speaker.name === effectiveSelectedSpeaker ? ' is-active' : ''}`}
                onClick={() => setSelectedSpeaker(speaker.name)}
              >
                <div>
                  <strong>{speaker.englishName || speaker.name}</strong>
                  <span>{speaker.name}</span>
                </div>
                <span>{formatNumber(speaker.totalSpeeches)}</span>
              </button>
            ))}
            {!filteredSpeakers.length && <div className="page-state">No speakers match that search.</div>}
          </div>
        </aside>

        <div className="speaker-detail-stack">
          {activeSpeaker ? (
            <>
              <section className="editorial-panel speaker-hero-card">
                <div className="speaker-hero-card__media">
                  {activeSpeaker.imagePath ? <img src={activeSpeaker.imagePath} alt={activeSpeaker.englishName || activeSpeaker.name} /> : <div className="speaker-avatar-fallback">MP</div>}
                </div>
                <div className="speaker-hero-card__copy">
                  <div className="section-heading__eyebrow">Selected speaker</div>
                  <h2>{activeSpeaker.englishName || activeSpeaker.name}</h2>
                  <p>{activeSpeaker.englishName && activeSpeaker.englishName !== activeSpeaker.name ? activeSpeaker.name : 'Tracked through cleaned multilingual speaker references in the clustered Hansard corpus.'}</p>
                  <div className="speaker-chip-row">
                    <span className="chip is-active">{formatNumber(activeSpeaker.totalSpeeches)} clustered speeches</span>
                    <span className="chip">{Object.keys(activeSpeaker.byTopic).length} active topics</span>
                    <span className="chip">{yearlyActivity.length} active years</span>
                  </div>
                </div>
              </section>

              <section className="story-grid">
                <div className="editorial-panel">
                  <div className="section-heading">
                    <div className="section-heading__eyebrow">Topic footprint</div>
                    <h2>Where this speaker concentrates debate attention</h2>
                  </div>
                  <div className="ranked-bar-list">
                    {topTopics.map((topic) => (
                      <div key={topic.topicId} className="ranked-bar-row">
                        <div className="ranked-bar-row__label">
                          <strong>MT-{topic.topicId}</strong>
                          <span>{topic.topicLabel}</span>
                        </div>
                        <div className="ranked-bar-row__track">
                          <div className="ranked-bar-row__fill" style={{ width: `${(topic.count / maxTopicCount) * 100}%`, background: topic.color }} />
                        </div>
                        <div className="ranked-bar-row__value">{formatNumber(topic.count)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="editorial-panel">
                  <div className="section-heading">
                    <div className="section-heading__eyebrow">Yearly activity</div>
                    <h2>When this speaker is most visible in the clustered corpus</h2>
                  </div>
                  <div className="mini-column-chart">
                    {yearlyActivity.map((entry) => (
                      <div key={entry.year} className="mini-column-chart__item">
                        <div className="mini-column-chart__bar-wrap">
                          <div className="mini-column-chart__bar" style={{ height: `${Math.max(10, (entry.count / maxYearCount) * 180)}px` }} />
                        </div>
                        <strong>{entry.count}</strong>
                        <span>{entry.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="editorial-panel">
                <div className="section-heading">
                  <div className="section-heading__eyebrow">Aliases</div>
                  <h2>Name variants seen in the source pipeline</h2>
                  <p>These aliases are useful when cross-checking speeches, manually inspecting records, or comparing normalized identities against source PDFs.</p>
                </div>
                <div className="speaker-chip-row">
                  {(activeSpeaker.aliases.length ? activeSpeaker.aliases : [activeSpeaker.name]).map((alias) => <span key={alias} className="chip">{alias}</span>)}
                </div>
              </section>
            </>
          ) : (
            <section className="editorial-panel page-state">Select a speaker to view their profile.</section>
          )}
        </div>
      </section>
    </div>
  );
}
