import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, Legend
} from 'recharts';
import { Search, Loader2, Grid3x3, Users, BarChart2, TrendingUp, Filter } from 'lucide-react';
import { readJson } from '../utils/dataPreloader';

// ── Searchable Speaker Picker ──
function SpeakerPicker({ label, value, onChange, speakers, exclude }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return speakers.slice(0, 30);
    const q = query.toLowerCase();
    return speakers
      .filter(sp => sp.name !== exclude && (sp.name.toLowerCase().includes(q) || sp.aliases?.some(a => a.toLowerCase().includes(q))))
      .slice(0, 30);
  }, [query, speakers, exclude]);

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 'min(200px, 100%)' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: value ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: value ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{value || 'Select speaker…'}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', zIndex: 100, maxHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.5rem' }}>
            <input
              autoFocus
              type="text"
              placeholder="Search Sinhala / English…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(sp => (
              <div
                key={sp.name}
                onClick={() => { onChange(sp.name); setOpen(false); setQuery(''); }}
                style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: sp.name === value ? 'var(--primary-color)' : 'var(--text-primary)', background: sp.name === value ? 'rgba(79,70,229,0.08)' : 'transparent', fontWeight: sp.name === value ? 600 : 400, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (sp.name !== value) e.currentTarget.style.background = 'var(--border-color)'; }}
                onMouseLeave={e => { if (sp.name !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {sp.name}
                {sp.total_speeches && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({sp.total_speeches})</span>}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Heatmap View ──
function HeatmapView({ speakerTopicMatrix, finalUniqueSpeakers, evolutionData }) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const [topN, setTopN] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 768 ? 12 : 20));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const topicIds = useMemo(() => Object.keys(evolutionData.topic_labels).sort((a, b) => +a - +b), [evolutionData]);

  const displayedSpeakers = useMemo(() => {
    let list = finalUniqueSpeakers.filter(sp => sp.name !== 'Unknown Speaker');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(sp =>
        sp.name.toLowerCase().includes(q) ||
        sp.aliases?.some(a => a.toLowerCase().includes(q))
      );
    }
    return list.slice(0, topN);
  }, [finalUniqueSpeakers, topN, searchQuery]);

  const visibleTopicIds = useMemo(() => {
    if (!isMobile) return topicIds;
    const ranked = topicIds
      .map(tid => ({
        tid,
        total: displayedSpeakers.reduce((sum, sp) => sum + (speakerTopicMatrix[sp.name]?.[tid] || 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12)
      .map(x => x.tid);
    return ranked;
  }, [isMobile, topicIds, displayedSpeakers, speakerTopicMatrix]);

  const heatmapMax = useMemo(() => {
    let max = 1;
    displayedSpeakers.forEach(sp => {
      visibleTopicIds.forEach(tid => {
        const v = speakerTopicMatrix[sp.name]?.[tid] || 0;
        if (v > max) max = v;
      });
    });
    return max;
  }, [displayedSpeakers, speakerTopicMatrix, visibleTopicIds]);

  const cellBg = (count) => {
    if (!count) return 'var(--border-color)';
    const t = Math.log1p(count) / Math.log1p(heatmapMax);
    return `rgba(79, 70, 229, ${(0.07 + t * 0.88).toFixed(2)})`;
  };

  const CELL_SIZE = isMobile ? 18 : 26;
  const SPEAKER_LABEL_WIDTH = isMobile ? 122 : 180;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
      {/* Controls */}
      <div className="heatmap-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--surface-color)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1, minWidth: 'min(200px, 100%)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Speakers</div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Name in any language…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Show Top N Speakers</div>
          <select value={topN} onChange={e => setTopN(+e.target.value)} className="select-input">
            {(isMobile ? [8, 10, 12, 15, 20] : [10, 15, 20, 25, 30]).map(n => <option key={n} value={n}>Top {n}</option>)}
          </select>
        </div>
        <div className="heatmap-controls-info" style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
          Showing {displayedSpeakers.length} speakers × {visibleTopicIds.length}/{topicIds.length} topics
        </div>
      </div>

      {/* Heatmap Grid */}
      <Card title="Speaker × Topic Heatmap" icon={Grid3x3}>
        <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          Each cell shows the number of speeches by that speaker in that topic. Darker = more speeches. Hover for exact value.
          {isMobile ? ' Mobile view shows the most active topic columns.' : ''}
        </p>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: isMobile ? '440px' : '600px', width: '100%' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
            {/* Topic header row */}
            <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: `${SPEAKER_LABEL_WIDTH}px`, gap: isMobile ? '2px' : '3px' }}>
              {visibleTopicIds.map(tid => (
                <div
                  key={tid}
                  title={evolutionData.topic_labels[tid]}
                  style={{ width: `${CELL_SIZE}px`, flexShrink: 0, fontSize: isMobile ? '0.56rem' : '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'default' }}
                >
                  {tid}
                </div>
              ))}
            </div>
            {/* Speaker rows */}
            {displayedSpeakers.map((sp) => (
              <div key={sp.name} style={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? '2px' : '3px', gap: isMobile ? '2px' : '3px' }}>
                <div
                  title={sp.name}
                  style={{ width: `${SPEAKER_LABEL_WIDTH}px`, flexShrink: 0, fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: isMobile ? '5px' : '8px', textAlign: 'right' }}
                >
                  {sp.name}
                </div>
                {visibleTopicIds.map(tid => {
                  const count = speakerTopicMatrix[sp.name]?.[tid] || 0;
                  return (
                    <div
                      key={tid}
                      title={`${sp.name}\nMT-${tid}: ${evolutionData.topic_labels[tid]}\n${count} speeches`}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        flexShrink: 0,
                        borderRadius: '3px',
                        background: cellBg(count),
                        border: '1px solid rgba(0,0,0,0.04)',
                        cursor: count ? 'pointer' : 'default',
                        transition: isMobile ? 'none' : 'transform 0.15s ease',
                      }}
                      onMouseEnter={e => { if (!isMobile && count) e.currentTarget.style.transform = 'scale(1.3)'; }}
                      onMouseLeave={e => { if (!isMobile) e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="heatmap-legend" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>0 speeches</span>
          {[0.07, 0.25, 0.43, 0.61, 0.79, 0.95].map(op => (
            <div key={op} style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, borderRadius: '3px', background: `rgba(79,70,229,${op})`, border: '1px solid var(--border-color)' }} />
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Most active</span>
        </div>
      </Card>
    </div>
  );
}

// ── Speaker vs Speaker View ──
function SpeakerCompareView({ speakerTopicMatrix, speakerTopicMatrixByYear, availableYears, finalUniqueSpeakers, evolutionData }) {
  const [speakerA, setSpeakerA] = useState('');
  const [speakerB, setSpeakerB] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');

  const activeMatrix = useMemo(() => {
    if (selectedYear === 'All') return speakerTopicMatrix;
    return speakerTopicMatrixByYear[selectedYear] || {};
  }, [selectedYear, speakerTopicMatrix, speakerTopicMatrixByYear]);

  const comparisonData = useMemo(() => {
    if (!speakerA || !speakerB) return null;
    const aData = activeMatrix[speakerA] || {};
    const bData = activeMatrix[speakerB] || {};

    const totalA = Object.values(aData).reduce((s, v) => s + v, 0);
    const totalB = Object.values(bData).reduce((s, v) => s + v, 0);

    // All topics that either speaker participated in
    const allTopics = [...new Set([...Object.keys(aData), ...Object.keys(bData)])].sort((a, b) => +a - +b);

    // Top 12 topics by combined activity
    const topTopics = allTopics
      .map(tid => ({ tid, combined: (aData[tid] || 0) + (bData[tid] || 0) }))
      .sort((a, b) => b.combined - a.combined)
      .slice(0, 12)
      .map(({ tid }) => ({
        topic: evolutionData.topic_labels[tid] || `Macro Topic ${tid}`,
        fullLabel: evolutionData.topic_labels[tid] || `Macro Topic ${tid}`,
        [speakerA]: aData[tid] || 0,
        [speakerB]: bData[tid] || 0,
      }));

    // Common topics (both > 0)
    const commonCount = allTopics.filter(tid => aData[tid] > 0 && bData[tid] > 0).length;

    return { totalA, totalB, topTopics, commonCount, topicCount: { a: Object.keys(aData).filter(t => aData[t] > 0).length, b: Object.keys(bData).filter(t => bData[t] > 0).length } };
  }, [speakerA, speakerB, activeMatrix, evolutionData]);

  const COLOR_A = 'rgba(79, 70, 229, 0.8)';
  const COLOR_B = 'rgba(236, 72, 153, 0.8)';
  const tooltipStyle = {
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    opacity: 0.98,
  };

  const comparisonTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    return (
      <div style={{ ...tooltipStyle, padding: '0.8rem 0.9rem', boxShadow: 'var(--shadow-md)', maxWidth: '360px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.55rem', lineHeight: 1.35 }}>
          {row?.fullLabel}
        </div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
            <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{(p.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Picker */}
      <div style={{ background: 'var(--surface-color)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SpeakerPicker label="Speaker A" value={speakerA} onChange={setSpeakerA} speakers={finalUniqueSpeakers} exclude={speakerB} />
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.2rem' }}>VS</div>
        <SpeakerPicker label="Speaker B" value={speakerB} onChange={setSpeakerB} speakers={finalUniqueSpeakers} exclude={speakerA} />
        <div style={{ minWidth: 'min(180px, 100%)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year Filter</div>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="select-input" style={{ minWidth: 'min(180px, 100%)' }}>
            <option value="All">All Years</option>
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {!comparisonData ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ margin: 0 }}>Select two speakers above to compare their parliamentary engagement.</p>
        </div>
      ) : (
        <>
          {/* Stats summary */}
          <div className="comparative-speaker-summary" style={{ display: 'grid', gap: '0.85rem' }}>
            {[
              { label: 'Total Speeches', vA: comparisonData.totalA, vB: comparisonData.totalB },
              { label: 'Active Topics', vA: comparisonData.topicCount.a, vB: comparisonData.topicCount.b },
              { label: 'Shared Topics', vA: comparisonData.commonCount, vB: comparisonData.commonCount },
            ].map(({ label, vA, vB }) => (
              <div key={label} className="comparative-stat-card" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '0.9rem 1rem' }}>
                <div className="comparative-stat-title" style={{ textAlign: 'center', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  {label}
                </div>
                <div className="comparative-stat-sides" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="comparative-stat-side-a" style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                    <div className="comparative-stat-value-a" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'rgba(79,70,229,0.9)' }}>{typeof vA === 'number' ? vA.toLocaleString() : vA}</div>
                    <div className="comparative-stat-speaker" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em', marginTop: '0.22rem', lineHeight: 1.3 }}>
                      {speakerA}
                    </div>
                  </div>
                  <div className="comparative-stat-side-b" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                    <div className="comparative-stat-value-b" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'rgba(236,72,153,0.9)' }}>{typeof vB === 'number' ? vB.toLocaleString() : vB}</div>
                    <div className="comparative-stat-speaker" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em', marginTop: '0.22rem', lineHeight: 1.3 }}>
                      {speakerB}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Speaker name pills */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLOR_A, display: 'inline-block' }} />
              {speakerA}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLOR_B, display: 'inline-block' }} />
              {speakerB}
            </span>
          </div>

          {/* Topic comparison chart */}
          <Card title="Topic Engagement Comparison (Top 12 Shared/Active Topics)" icon={BarChart2}>
            <div style={{ height: '380px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData.topTopics} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={170} />
                  <Tooltip content={comparisonTooltip} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }} />
                  <Bar dataKey={speakerA} name={speakerA} fill={COLOR_A} radius={[0, 3, 3, 0]} />
                  <Bar dataKey={speakerB} name={speakerB} fill={COLOR_B} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Topic vs Topic View ──
function TopicCompareView({ evolutionData, keywordsData }) {
  const topicEntries = useMemo(() => Object.entries(evolutionData.topic_labels).sort((a, b) => +a[0] - +b[0]), [evolutionData]);
  const [topicA, setTopicA] = useState(topicEntries[0]?.[0] || '0');
  const [topicB, setTopicB] = useState(topicEntries[1]?.[0] || '1');

  const getRgb = (tid) => {
    const s = evolutionData.series.find(s => s.mt_id.toString() === tid);
    if (s?.styles?.standard_chart?.color_rgba) {
      const [r, g, b] = s.styles.standard_chart.color_rgba;
      return `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},0.8)`;
    }
    return 'rgba(79,70,229,0.8)';
  };

  const temporalData = useMemo(() => {
    const serA = evolutionData.series.find(s => s.mt_id.toString() === topicA);
    const serB = evolutionData.series.find(s => s.mt_id.toString() === topicB);
    if (!serA || !serB) return [];
    const years = [...new Set([...serA.points.map(p => p.year), ...serB.points.map(p => p.year)])].sort();
    return years.map(yr => ({
      year: yr,
      [evolutionData.topic_labels[topicA]?.slice(0, 20) + '…']: serA.points.find(p => p.year === yr)?.count || 0,
      [evolutionData.topic_labels[topicB]?.slice(0, 20) + '…']: serB.points.find(p => p.year === yr)?.count || 0,
    }));
  }, [topicA, topicB, evolutionData]);

  const labelA = evolutionData.topic_labels[topicA]?.slice(0, 20) + '…';
  const labelB = evolutionData.topic_labels[topicB]?.slice(0, 20) + '…';

  const keywordsA = useMemo(() => {
    const raw = keywordsData['count_with_freq']?.[`Macro-Topic ${topicA}`] || [];
    return raw.filter(w => !/^[\d,]+$/.test(w.keyword)).slice(0, 12);
  }, [topicA, keywordsData]);

  const keywordsB = useMemo(() => {
    const raw = keywordsData['count_with_freq']?.[`Macro-Topic ${topicB}`] || [];
    return raw.filter(w => !/^[\d,]+$/.test(w.keyword)).slice(0, 12);
  }, [topicB, keywordsData]);

  const seriesA = evolutionData.series.find(s => s.mt_id.toString() === topicA);
  const seriesB = evolutionData.series.find(s => s.mt_id.toString() === topicB);
  const totalA = seriesA?.points.reduce((s, p) => s + p.count, 0) || 0;
  const totalB = seriesB?.points.reduce((s, p) => s + p.count, 0) || 0;
  const peakA = seriesA?.points.reduce((max, p) => p.count > max.count ? p : max, seriesA.points[0]);
  const peakB = seriesB?.points.reduce((max, p) => p.count > max.count ? p : max, seriesB.points[0]);

  const tooltipStyle = {
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
    opacity: 0.98,
  };
  const tooltipLabelStyle = { color: 'var(--text-primary)', fontWeight: 700 };
  const tooltipItemStyle = { color: 'var(--text-primary)', fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Picker */}
      <div style={{ background: 'var(--surface-color)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic A</div>
          <select value={topicA} onChange={e => setTopicA(e.target.value)} className="select-input" style={{ width: '100%' }}>
            {topicEntries.map(([id, label]) => <option key={id} value={id}>MT-{id}: {label.slice(0, 55)}{label.length > 55 ? '…' : ''}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.2rem' }}>VS</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic B</div>
          <select value={topicB} onChange={e => setTopicB(e.target.value)} className="select-input" style={{ width: '100%' }}>
            {topicEntries.filter(([id]) => id !== topicA).map(([id, label]) => <option key={id} value={id}>MT-{id}: {label.slice(0, 55)}{label.length > 55 ? '…' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="topic-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[
          { tid: topicA, total: totalA, peak: peakA, color: getRgb(topicA) },
          { tid: topicB, total: totalB, peak: peakB, color: getRgb(topicB) },
        ].map(({ tid, total, peak, color }, idx) => (
          <div key={tid} className="topic-stat-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'var(--surface-color)', border: `1px solid var(--border-color)`, borderLeft: `4px solid ${color}` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              {idx === 0 ? 'Topic A' : 'Topic B'} — MT-{tid}
            </div>
            <div className="topic-stat-label-text" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
              {evolutionData.topic_labels[tid]}
            </div>
            <div className="topic-stat-numbers" style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div className="topic-stat-num" style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{total.toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Speeches</div>
              </div>
              <div>
                <div className="topic-stat-num" style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{peak?.year}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Year</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Temporal overlay */}
      <Card title="Temporal Evolution Comparison" icon={TrendingUp}>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={temporalData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Line type="monotone" dataKey={labelA} stroke={getRgb(topicA)} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name={labelA} />
              <Line type="monotone" dataKey={labelB} stroke={getRgb(topicB)} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name={labelB} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Keywords side by side */}
      <div className="grid-2">
        {[
          { tid: topicA, keywords: keywordsA, color: getRgb(topicA), label: `${labelA} — Keywords` },
          { tid: topicB, keywords: keywordsB, color: getRgb(topicB), label: `${labelB} — Keywords` },
        ].map(({ tid, keywords, color, label }) => (
          <Card key={tid} title={label} icon={Filter}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {keywords.map((w, i) => (
                <span key={i} style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, background: color.replace('0.8)', `${(0.08 + (1 - i / keywords.length) * 0.18).toFixed(2)})`), border: `1px solid ${color.replace('0.8)', '0.3)')}`, color: 'var(--text-primary)' }}>
                  {w.keyword}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main Export ──
export default function ComparativeAnalysisSection({ evolutionData, keywordsData, speakerNorm }) {
  const [speakerCounts, setSpeakerCounts] = useState(null);
  const [speakerSpeechesByYearTopic, setSpeakerSpeechesByYearTopic] = useState(null);
  const [finalUniqueSpeakers, setFinalUniqueSpeakers] = useState(null);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('speaker');

  useEffect(() => {
    Promise.all([
      readJson('/data/speaker_topic_counts_by_macro_topic.json'),
      readJson('/data/speaker_speeches_per_year_by_topic.json'),
      readJson('/data/final_unique_speakers.json'),
    ]).then(([counts, byYearTopic, unique]) => {
      setSpeakerCounts(counts);
      setSpeakerSpeechesByYearTopic(byYearTopic);
      setFinalUniqueSpeakers(unique);
    }).catch(err => setError(err.message));
  }, []);

  // Build speaker × topic matrix (normalized)
  const speakerTopicMatrix = useMemo(() => {
    if (!speakerCounts || !speakerNorm) return {};
    const matrix = {};
    Object.entries(speakerCounts.all_speakers_by_topic || {}).forEach(([topicKey, speakers]) => {
      const tid = topicKey.replace('Macro-Topic ', '');
      speakers.forEach(({ speaker, count }) => {
        const norm = speakerNorm[speaker] || speaker;
        if (!matrix[norm]) matrix[norm] = {};
        matrix[norm][tid] = (matrix[norm][tid] || 0) + count;
      });
    });
    return matrix;
  }, [speakerCounts, speakerNorm]);

  const speakerTopicMatrixByYear = useMemo(() => {
    if (!speakerSpeechesByYearTopic || !speakerNorm) return {};
    const byYearMatrix = {};

    Object.entries(speakerSpeechesByYearTopic.by_topic || {}).forEach(([topicKey, topicObj]) => {
      const tid = topicKey.replace('Macro-Topic ', '');
      Object.entries(topicObj.speakers || {}).forEach(([rawSpeaker, speakerObj]) => {
        const normalizedSpeaker = speakerNorm[rawSpeaker] || rawSpeaker;
        Object.entries(speakerObj.by_year || {}).forEach(([year, count]) => {
          if (!byYearMatrix[year]) byYearMatrix[year] = {};
          if (!byYearMatrix[year][normalizedSpeaker]) byYearMatrix[year][normalizedSpeaker] = {};
          byYearMatrix[year][normalizedSpeaker][tid] = (byYearMatrix[year][normalizedSpeaker][tid] || 0) + count;
        });
      });
    });

    return byYearMatrix;
  }, [speakerSpeechesByYearTopic, speakerNorm]);

  const availableYears = useMemo(() => {
    const yearsFromMeta = speakerSpeechesByYearTopic?.meta?.years_covered?.map(String) || [];
    if (yearsFromMeta.length) return yearsFromMeta;
    return Object.keys(speakerTopicMatrixByYear).sort((a, b) => +a - +b);
  }, [speakerSpeechesByYearTopic, speakerTopicMatrixByYear]);

  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '4rem', textAlign: 'center' }}>⚠️ {error}</div>;

  if (!speakerCounts || !speakerSpeechesByYearTopic || !finalUniqueSpeakers) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading comparative data…</p>
      </div>
    );
  }

  const SUB_TABS = [
    { id: 'speaker', label: 'Speaker vs Speaker', icon: Users },
    { id: 'topic', label: 'Topic vs Topic', icon: BarChart2 },
    { id: 'heatmap', label: 'Speaker × Topic Heatmap', icon: Grid3x3 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
      {/* Sub-tab nav */}
      <div className="comparative-subtab-nav" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {SUB_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            className="comparative-subtab-btn"
            onClick={() => setSubTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
              border: `1px solid ${subTab === id ? 'var(--primary-color)' : 'var(--border-color)'}`,
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              background: subTab === id ? 'var(--primary-color)' : 'var(--surface-color)',
              color: subTab === id ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            {React.createElement(icon, { size: 16 })} {label}
          </button>
        ))}
      </div>

      
      {subTab === 'speaker' && (
        <SpeakerCompareView
          speakerTopicMatrix={speakerTopicMatrix}
          speakerTopicMatrixByYear={speakerTopicMatrixByYear}
          availableYears={availableYears}
          finalUniqueSpeakers={finalUniqueSpeakers}
          evolutionData={evolutionData}
        />
      )}
      {subTab === 'topic' && (
        <TopicCompareView
          evolutionData={evolutionData}
          keywordsData={keywordsData}
        />
      )}
      {subTab === 'heatmap' && (
        <HeatmapView
          speakerTopicMatrix={speakerTopicMatrix}
          finalUniqueSpeakers={finalUniqueSpeakers}
          evolutionData={evolutionData}
        />
      )}
    </div>
  );
}
