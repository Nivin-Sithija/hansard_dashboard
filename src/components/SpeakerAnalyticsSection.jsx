import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { User, Activity, PieChart, Info, Search, Loader2 } from 'lucide-react';
import { readJson } from '../utils/dataPreloader';

// NOTE: All data is fetched at runtime from /public/data/ — no static imports.
// This component is React.lazy() loaded — only downloaded when the Speaker tab is clicked.

export default function SpeakerAnalyticsSection({ speakerNorm, evolutionData }) {
  // ── Fetch heavy data on mount ──
  const [speakerSpeechesRaw, setSpeakerSpeechesRaw] = useState(null);
  const [finalUniqueSpeakers, setFinalUniqueSpeakers] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    Promise.all([
      readJson('/data/speaker_speeches_per_year_by_topic.json'),
      readJson('/data/final_unique_speakers.json'),
    ]).then(([speeches, unique]) => {
      setSpeakerSpeechesRaw(speeches);
      setFinalUniqueSpeakers(unique);
    }).catch(err => setFetchError(err.message));
  }, []);

  if (fetchError) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>⚠️ {fetchError}</div>;
  }

  if (!speakerSpeechesRaw || !finalUniqueSpeakers) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading speaker data (2.3 MB)…</p>
      </div>
    );
  }

  return <SpeakerAnalyticsInner
    speakerSpeechesRaw={speakerSpeechesRaw}
    finalUniqueSpeakers={finalUniqueSpeakers}
    speakerNorm={speakerNorm}
    evolutionData={evolutionData}
  />;
}

function SpeakerAnalyticsInner({ speakerSpeechesRaw, finalUniqueSpeakers, speakerNorm, evolutionData }) {
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate speakers data from the raw speeches JSON
  const speakersData = useMemo(() => {
    const spData = {};
    if (!speakerSpeechesRaw?.by_topic) return spData;
    Object.entries(speakerSpeechesRaw.by_topic).forEach(([topic, topicData]) => {
      Object.entries(topicData.speakers || {}).forEach(([speakerRaw, counts]) => {
        const speaker = speakerNorm[speakerRaw] || speakerRaw;
        if (!spData[speaker]) spData[speaker] = { total: 0, by_topic: {}, by_year: {} };
        spData[speaker].total += counts.total;
        spData[speaker].by_topic[topic] = (spData[speaker].by_topic[topic] || 0) + counts.total;
        if (counts.by_year) {
          Object.entries(counts.by_year).forEach(([year, count]) => {
            spData[speaker].by_year[year] = (spData[speaker].by_year[year] || 0) + count;
          });
        }
      });
    });
    return spData;
  }, [speakerSpeechesRaw, speakerNorm]);

  const allSpeakers = useMemo(() => finalUniqueSpeakers.map(sp => sp.name), [finalUniqueSpeakers]);

  // Auto-select top speaker after speaker list becomes available
  useEffect(() => {
    if (allSpeakers.length > 0 && !selectedSpeaker) {
      const frame = requestAnimationFrame(() => {
        setSelectedSpeaker(allSpeakers[0]);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [allSpeakers, selectedSpeaker]);

  const speakerInfo = selectedSpeaker ? speakersData[selectedSpeaker] : null;

  const topicChartData = useMemo(() => {
    if (!speakerInfo || !evolutionData) return [];
    return Object.entries(speakerInfo.by_topic).map(([topicStr, count]) => {
      const topicId = topicStr.replace('Macro-Topic ', '');
      const label = evolutionData.topic_labels[topicId] || topicStr;
      const rgb = evolutionData.series.find(s => s.mt_id.toString() === topicId)?.styles.standard_chart.color_rgba || [0.5, 0.5, 0.5];
      return { topic: label, fullLabel: label, count, color: `rgba(${rgb[0]*255},${rgb[1]*255},${rgb[2]*255},0.8)` };
    }).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [speakerInfo, evolutionData]);

  const yearlyTrendData = useMemo(() => {
    if (!speakerInfo) return [];
    const years = Object.keys(speakerInfo.by_year).map(Number);
    if (!years.length) return [];
    const min = Math.min(...years), max = Math.max(...years, new Date().getFullYear());
    const data = [];
    for (let yr = min; yr <= max; yr++) data.push({ year: yr.toString(), count: speakerInfo.by_year[yr.toString()] || 0 });
    return data;
  }, [speakerInfo]);

  const filteredSpeakersList = useMemo(() => {
    if (!searchTerm) return finalUniqueSpeakers.slice(0, 50).map(s => ({ name: s.name, matchedAlias: null }));
    const lower = searchTerm.toLowerCase();
    return finalUniqueSpeakers.map(sp => {
      if (sp.name.toLowerCase().includes(lower)) return { name: sp.name, matchedAlias: null, isMatch: true };
      const matchedAlias = sp.aliases.find(a => a.toLowerCase().includes(lower));
      if (matchedAlias) return { name: sp.name, matchedAlias, isMatch: true };
      return { isMatch: false };
    }).filter(x => x.isMatch).slice(0, 50);
  }, [searchTerm, finalUniqueSpeakers]);

  const globalStats = useMemo(() => ({
    speakerCount: finalUniqueSpeakers.length,
    totalSpeeches: finalUniqueSpeakers.reduce((s, sp) => s + sp.total_speeches, 0),
  }), [finalUniqueSpeakers]);

  return (
    <div className="speaker-analytics" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Overview Banner */}
      <div className="speaker-overview-banner" style={{ background: 'var(--surface-color)', padding: '1.25rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div className="speaker-overview-copy">
          <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Global Speaker Overview</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Summary of cleanly identified parliamentarians and their cumulative contributions.</p>
        </div>
        <div className="speaker-overview-metrics" style={{ display: 'flex', gap: '3rem', paddingRight: '2rem', flexWrap: 'wrap' }}>
          <div className="speaker-overview-metric" style={{ textAlign: 'center' }}>
            <div className="speaker-overview-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{globalStats.speakerCount}</div>
            <div className="speaker-overview-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Unique Speakers</div>
          </div>
          <div className="speaker-overview-metric" style={{ textAlign: 'center' }}>
            <div className="speaker-overview-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{globalStats.totalSpeeches.toLocaleString()}</div>
            <div className="speaker-overview-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Attributed Speeches</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Speaker Directory */}
        <div style={{ flex: '1', minWidth: 'min(300px, 100%)' }}>
          <Card title="Speaker Directory" icon={Search}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search in Sinhala, Tamil or English…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
              {filteredSpeakersList.map(item => {
                const sp = item.name;
                const isSelected = sp === selectedSpeaker;
                return (
                  <button key={sp} onClick={() => setSelectedSpeaker(sp)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: isSelected ? 'rgba(79,70,229,0.1)' : 'var(--background-color)', border: isSelected ? '1px solid var(--primary-color)' : '1px solid transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{sp}</span>
                      {item.matchedAlias && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>Matched: {item.matchedAlias}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--border-color)', padding: '0.15rem 0.5rem', borderRadius: '1rem', marginLeft: '0.5rem', flexShrink: 0 }}>
                      {speakersData[sp]?.total || 0}
                    </span>
                  </button>
                );
              })}
              {filteredSpeakersList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No speakers found.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Speaker Detail */}
        <div style={{ flex: '3', minWidth: 'min(400px, 100%)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {speakerInfo ? (
            <>
              <div className="speaker-stat-cards" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Card className="flex-1 speaker-profile-card" style={{ padding: '1.5rem' }}>
                  <div className="speaker-profile-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="speaker-profile-icon-wrap" style={{ padding: '0.15rem' }}>
                      <User size={32} color="var(--primary-color)" />
                    </div>
                    <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{selectedSpeaker}</h2>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Global Rank: #{allSpeakers.indexOf(selectedSpeaker) + 1}</p>
                    </div>
                  </div>
                </Card>
                <Card className="flex-1 speaker-kpi-card" style={{ padding: '1.5rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Speeches</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: 'clamp(1.45rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>{speakerInfo.total}</p>
                </Card>
                <Card className="flex-1 speaker-kpi-card" style={{ padding: '1.5rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Topics</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: 'clamp(1.45rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>{Object.keys(speakerInfo.by_topic).length}</p>
                </Card>
              </div>

              <div className="grid-2">
                <Card title="Engagement by Topic (Top 10)" icon={PieChart}>
                  <div style={{ height: `${Math.max(280, topicChartData.length * 46)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicChartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={170} />
                        <Tooltip cursor={{ fill: 'var(--surface-color)' }} content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const d = payload[0].payload;
                            return <div style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', maxWidth: '250px', color: 'var(--text-primary)', opacity: 0.98 }}><p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{d.topic}</p><p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.fullLabel}</p><p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 500 }}>{d.count} speeches</p></div>;
                          }
                          return null;
                        }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {topicChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Temporal Speech Activity" icon={Activity}>
                  <div style={{ height: 'clamp(250px, 42vh, 350px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', opacity: 0.98 }} labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }} />
                        <Line type="monotone" dataKey="count" name="Speeches" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-color)' }} activeDot={{ r: 6, fill: 'var(--primary-color)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <Info size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--text-primary)' }}>No Speaker Selected</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Select a speaker from the directory to view their analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
