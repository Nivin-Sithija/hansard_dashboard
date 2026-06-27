import React, { useMemo, useState } from 'react';
import { useJsonResource } from '../lib/data/hooks';
import { formatNumber } from '../lib/format';
import { getTextLangProps } from '../lib/language';
import { useUiLanguage } from '../lib/uiLanguage';

const URL = '/data/speaker_profiles_enriched.json';

function profileSearchText(profile) {
  return [
    profile.displayName,
    profile.name,
    profile.englishName,
    ...(profile.aliases || []),
    profile.party,
    profile.constituency,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function formatYearWindow(profile) {
  if (!profile.firstActiveYear || !profile.lastActiveYear) return 'No dated activity';
  if (profile.firstActiveYear === profile.lastActiveYear) return String(profile.firstActiveYear);
  return `${profile.firstActiveYear}-${profile.lastActiveYear}`;
}

function topicLabel(topic) {
  return topic.topicId !== null && topic.topicId !== undefined ? `MT-${topic.topicId} | ${topic.topicLabel}` : topic.topicLabel;
}

export default function SpeakersPage() {
  const { data, loading, error } = useJsonResource(URL);
  const { t, localizeLanguageLabel } = useUiLanguage();
  const [query, setQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const speakerProfiles = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filteredSpeakers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return speakerProfiles;
    return speakerProfiles.filter((profile) => profileSearchText(profile).includes(normalized));
  }, [query, speakerProfiles]);

  const effectiveSelectedSpeaker = useMemo(() => {
    if (selectedSpeaker && filteredSpeakers.some((speaker) => speaker.name === selectedSpeaker)) return selectedSpeaker;
    return filteredSpeakers[0]?.name || speakerProfiles[0]?.name || '';
  }, [filteredSpeakers, selectedSpeaker, speakerProfiles]);

  const activeSpeaker = useMemo(
    () => speakerProfiles.find((speaker) => speaker.name === effectiveSelectedSpeaker) || null,
    [effectiveSelectedSpeaker, speakerProfiles],
  );

  const maxTopicCount = Math.max(...(activeSpeaker?.dominantTopics || []).map((topic) => topic.count), 1);
  const maxYearCount = Math.max(...(activeSpeaker?.yearlyCounts || []).map((entry) => entry.count), 1);

  if (loading) return <div className="page-state">Loading speakers...</div>;
  if (error) return <div className="page-state page-state--error">{error}</div>;

  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Speakers</div>
          <h1>Read parliamentary debates through the people who shape them, not just through aggregate topic trends.</h1>
          <p>The profile cards combine cleaned speaker identities, topic participation, yearly visibility, representative speeches, and optional authored context.</p>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stat-block"><span>{formatNumber(speakerProfiles.length)}</span><label>Named speakers</label></div>
        <div className="stat-block"><span>{formatNumber(speakerProfiles.reduce((sum, speaker) => sum + speaker.totalSpeeches, 0))}</span><label>Attributed speeches</label></div>
        <div className="stat-block"><span>{formatNumber(filteredSpeakers.length)}</span><label>Directory matches</label></div>
        <div className="stat-block"><span>{activeSpeaker ? formatNumber(activeSpeaker.topicCount) : '0'}</span><label>Topics for selected speaker</label></div>
      </section>

      <section className="speaker-layout">
        <aside className="editorial-panel speaker-directory-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Directory</div>
            <h2>{t('searchByNames')}</h2>
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
                <div className="speaker-directory-row__copy">
                  <strong className="speaker-directory-row__title" {...getTextLangProps(speaker.displayName || speaker.englishName || speaker.name)}>{speaker.displayName || speaker.englishName || speaker.name}</strong>
                  <span className="speaker-directory-row__subtitle" {...getTextLangProps(speaker.name)}>{speaker.name}</span>
                </div>
                <span className="speaker-directory-row__count">{formatNumber(speaker.totalSpeeches)}</span>
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
                  {activeSpeaker.imagePath ? <img src={activeSpeaker.imagePath} alt={activeSpeaker.displayName || activeSpeaker.name} /> : <div className="speaker-avatar-fallback">MP</div>}
                </div>
                <div className="speaker-hero-card__copy">
                  <div className="section-heading__eyebrow">Selected speaker</div>
                  <h2 {...getTextLangProps(activeSpeaker.displayName || activeSpeaker.englishName || activeSpeaker.name)}>{activeSpeaker.displayName || activeSpeaker.englishName || activeSpeaker.name}</h2>
                  <p {...getTextLangProps(activeSpeaker.shortBio || activeSpeaker.name)}>{activeSpeaker.shortBio || activeSpeaker.name}</p>
                  <div className="speaker-chip-row">
                    <span className="chip is-active">{formatNumber(activeSpeaker.totalSpeeches)} speeches</span>
                    <span className="chip">{activeSpeaker.activeYearCount} active years</span>
                    <span className="chip">Peak {activeSpeaker.peakYear || 'n/a'}</span>
                    {activeSpeaker.speakerType && <span className="chip">{activeSpeaker.speakerType}</span>}
                    {activeSpeaker.shortBioSource === 'draft' && <span className="chip">Draft profile note</span>}
                  </div>
                  {(activeSpeaker.wikipediaUrl || activeSpeaker.officialProfileUrl || activeSpeaker.party || activeSpeaker.constituency) && (
                    <div className="speaker-link-row">
                      {activeSpeaker.party && <span className="speaker-inline-meta" {...getTextLangProps(activeSpeaker.party)}>{activeSpeaker.party}</span>}
                      {activeSpeaker.constituency && <span className="speaker-inline-meta" {...getTextLangProps(activeSpeaker.constituency)}>{activeSpeaker.constituency}</span>}
                      {activeSpeaker.wikipediaUrl && <a href={activeSpeaker.wikipediaUrl} target="_blank" rel="noreferrer">Wikipedia</a>}
                      {activeSpeaker.officialProfileUrl && <a href={activeSpeaker.officialProfileUrl} target="_blank" rel="noreferrer">Official profile</a>}
                    </div>
                  )}
                </div>
              </section>

              <section className="speaker-profile-grid">
                <div className="editorial-panel">
                  <div className="section-heading">
                    <div className="section-heading__eyebrow">Insight card</div>
                    <h2>How this speaker appears in the clustered record</h2>
                  </div>
                  <div className="speaker-insight-card">
                    <p {...getTextLangProps(activeSpeaker.insightSummary || '')}>{activeSpeaker.insightSummary || 'Corpus-grounded insight is coming soon.'}</p>
                    {activeSpeaker.editorialSummary && <p className="speaker-insight-card__draft" {...getTextLangProps(activeSpeaker.editorialSummary)}>{activeSpeaker.editorialSummary}</p>}
                    {activeSpeaker.confidenceNotes && <div className="detail-panel__muted">{activeSpeaker.confidenceNotes}</div>}
                  </div>
                  <div className="speaker-stat-grid">
                    <div className="speaker-stat-grid__item"><strong>{formatYearWindow(activeSpeaker)}</strong><span>Activity window</span></div>
                    <div className="speaker-stat-grid__item"><strong>{formatNumber(activeSpeaker.peakYearSpeechCount || 0)}</strong><span>Peak-year speeches</span></div>
                    <div className="speaker-stat-grid__item"><strong>{formatNumber(activeSpeaker.topicCount)}</strong><span>Topic breadth</span></div>
                    <div className="speaker-stat-grid__item"><strong>{Math.round((activeSpeaker.proceduralShare || 0) * 100)}%</strong><span>Procedural share</span></div>
                  </div>
                </div>

                <div className="editorial-panel">
                  <div className="section-heading">
                    <div className="section-heading__eyebrow">Yearly activity</div>
                    <h2>When this speaker is most visible</h2>
                  </div>
                  <div className="mini-column-chart">
                    {(activeSpeaker.yearlyCounts || []).map((entry) => (
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

              <section className="story-grid">
                <div className="editorial-panel">
                  <div className="section-heading">
                    <div className="section-heading__eyebrow">Topic footprint</div>
                    <h2>Where this speaker concentrates debate attention</h2>
                  </div>
                  <div className="ranked-bar-list">
                    {(activeSpeaker.dominantTopics || []).map((topic) => (
                      <div key={topic.topicKey} className="ranked-bar-row">
                        <div className="ranked-bar-row__label">
                          <strong>{topicLabel(topic)}</strong>
                          <span>{Math.round(topic.share * 100)}% of substantive speeches</span>
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
                    <div className="section-heading__eyebrow">Language mix</div>
                    <h2>How this speaker appears across language labels</h2>
                  </div>
                  <div className="speaker-chip-row">
                    {(activeSpeaker.languageMix || []).map((item) => (
                      <span key={item.language} className="chip">{localizeLanguageLabel(item.language)}: {formatNumber(item.count)}</span>
                    ))}
                    {!activeSpeaker.languageMix?.length && <span className="chip">Language mix unavailable</span>}
                  </div>
                  <div className="detail-panel__muted">Language labels are inferred from the clustered speech text, so mixed-script speeches may appear under `Mixed`.</div>
                </div>
              </section>

              <section className="editorial-panel">
                <div className="section-heading">
                  <div className="section-heading__eyebrow">Representative speeches</div>
                  <h2>Examples that make the profile interpretable</h2>
                </div>
                <div className="speech-grid">
                  {(activeSpeaker.representativeSpeeches || []).map((speech) => (
                    <article key={speech.speechId} className="speech-card">
                      <div className="speech-card__meta-row">
                        <span>{speech.date}</span>
                        <span>{speech.language}</span>
                        <span>{topicLabel(speech)}</span>
                      </div>
                      <h3 {...getTextLangProps(activeSpeaker.displayName || activeSpeaker.name)}>{activeSpeaker.displayName || activeSpeaker.name}</h3>
                      <p {...getTextLangProps(speech.excerpt)}>{speech.excerpt}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="editorial-panel">
                <div className="section-heading">
                  <div className="section-heading__eyebrow">Aliases</div>
                  <h2>Name variants seen in the source pipeline</h2>
                  <p>These aliases make it easier to audit speaker normalization and cross-check source PDFs.</p>
                </div>
                <div className="speaker-chip-row">
                  {(activeSpeaker.aliases?.length ? activeSpeaker.aliases : [activeSpeaker.name]).map((alias) => <span key={alias} className="chip" {...getTextLangProps(alias)}>{alias}</span>)}
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
